class Widget

    pq:
        alleleTerms:
            "select": [
                "Gene.symbol",
                "Gene.alleles.id",
                "Gene.alleles.genotypes.id",
                "Gene.alleles.genotypes.phenotypeTerms.id"
                "Gene.alleles.genotypes.phenotypeTerms.name"
            ],
            "constraints": [
                {
                    "path": "Gene",
                    "op": "LOOKUP",
                    "value": "MGI:97747",
                    "extraValue": ""
                }
            ]
        highLevelTerms:
            "select": [
                "Allele.highLevelPhenotypeTerms.name",
                "Allele.highLevelPhenotypeTerms.relations.childTerm.name"
            ],
            "constraints": []

    constructor: (@config, @templates) ->
        @service = new intermine.Service 'root': 'http://metabolicmine.org/beta/service/'

    render: (@target) ->
        @alleleTerms (top, children) =>
            @highLevelTerms top, children, @dendrogram

    # Fetch phenotypic terms for PPARG mouse.
    alleleTerms: (cb) ->
        @service.query @pq.alleleTerms, (q) ->
            q.records (records) ->
                max = 1 # top term count
                terms = {}
                # Terms to their counts.
                for allele in records[0]['alleles']
                    for genotype in allele.genotypes
                        for term in genotype.phenotypeTerms
                            if terms[term.name]?
                                terms[term.name].count += 1 # increase count
                                if terms[term.name].count > max then max = terms[term.name].count
                            else
                                terms[term.name] = 'count': 1 # new term
                
                cb max, terms

    # Fetch high level terms for child terms.
    highLevelTerms: (max, children, cb) ->
        # Constrain on these terms.
        pq = @pq.highLevelTerms
        pq.constraints.push
            "path": "Allele.highLevelPhenotypeTerms.relations.childTerm.name",
            "op": "ONE OF",
            "values": ( k for k, v of children )

        @service.query pq, (q) ->
            q.rows (rows) ->
                terms = {}
                # A map from high level terms to child terms (and eventually their counts).
                for [ parent, child ] in rows
                    if terms[parent]?
                        # add child terms and its count
                        terms[parent].children.push
                            'name': child
                            'count': children[child].count
                            'band': Math.floor(children[child].count / (max / 4))
                    else
                        terms[parent] =
                            'name': parent
                            'children': [] # new term

                cb 'name': 'MGI:97747', 'children': _(terms).toArray()

    dendrogram: (data) =>
        width = 1000
        height = 800
        rx = width / 2
        ry = height / 2
        
        # Create a dendrogram layout going all the way round with the width of ry - 50.
        cluster = d3.layout.cluster().size([360, ry - 50]).sort(null)
        
        # Diagonal generator producing smooth fan.
        diagonal = d3.svg.diagonal.radial().projection (d) -> [d.y, d.x / 180 * Math.PI]
        
        # Wrapper SVG.
        vis = d3.select($(@target)[0]).append("svg:svg")
            .attr("width", width)
            .attr("height", height)
            # Center the graph.
            .append("svg:g")
                .attr("transform", "translate(" + rx + "," + ry + ")")
        
        # Draw the white arc where the end nodes lie.
        vis.append("svg:path")
            .attr("class", "arc")
                .attr("d", d3.svg.arc().innerRadius(ry - 120).outerRadius(ry).startAngle(0).endAngle(2 * Math.PI))
        
        # Get the data and create links for them.
        nodes = cluster.nodes(data)

        for link in cluster.links(nodes)
            vis.append("svg:path")
                .attr("class", "link")
                .attr("d", diagonal(link))
        
        # Create the actual node.
        for d in nodes
            node = vis.append("svg:g")
                .attr("class", if d.count? then "node depth-#{d.depth} count-#{d.count}" else "node depth-#{d.depth}")
                .attr("transform", "rotate(" + (d.x - 90) + ")translate(" + d.y + ")" )

            # Draw a node circle.
            node.append("svg:circle")
                .attr("r", Math.abs(d.depth - 6))
                .attr("class", "band-#{d.band}" if d.band )

            # Append a rotated text to the node.
            node.append("svg:title")
                .text(d.name)
            node.append("svg:text")
                .attr("dx", if d.x < 180 then 8 else -8)
                .attr("dy", ".31em")
                .attr("text-anchor", if d.x < 180 then "start" else "end")
                .attr("transform", if d.x < 180 then null else "rotate(180)")
                .text(if d.name.length > 50 then d.name[0...50] + '...' else d.name)