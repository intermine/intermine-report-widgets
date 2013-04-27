/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */

{Service} = intermine

# The Service#rows function
{rows} = new Service root: 'www.flymine.org/query'

node-padding = 10

# Get the ontology terms for a gene.
direct-terms = ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: {symbol: [it]}

all-go-terms = (symbol) ->
    select: <[ goAnnotation.ontologyTerm.identifier goAnnotation.ontologyTerm.parents.identifier ]>
    from: \Gene
    where: {symbol}

whole-graph-q = (terms) ->
    select: <[ childTerm.identifier relationship parentTerm.identifier ]>
    from: \OntologyRelation
    where:
        'childTerm.identifier': terms
        direct: \true

#'relations.relationship': \is_a

# Get all the names for our ontology terms in one fell swoop, and build a mapping.
fetch-names = (identifier) ->
    q =
        select: <[ identifier name ]>
        from: \OntologyTerm
        where: {identifier}

    rows(q).then (listToObj << (map ([ident, label]) -> [ident, {label, id: ident, edges: []}]))

do-line = d3.svg.line!
        .x (.x)
        .y (.y)
        .interpolate \bundle

spline = (e) ->
    points = e.dagre.points.slice!
    source = dagre.util.intersect-rect e.source.dagre, points[0]
    target = dagre.util.intersect-rect e.target.dagre, points[* - 1]
    points.unshift source
    points.push target
    do-line points

translate-edge = ({width, height}, e, dx, dy) -->
    for p in e.dagre.points
        p.x = 0 >? (width <? p.x + dx)
        p.y = 0 >? (height <? p.y + dy)

get-node-drag-pos = (size-prop, pos-prop, svg-box, d) -->
    half-size = d[size-prop] / 2
    half-remaining = svg-box[size-prop] - d[size-prop] / 2
    event-pos = d3.event[pos-prop]
    Math.max(half-size, Math.min(half-remaining, event-pos))

to-node-id = (\node +) << (.replace /:/g, \_) << (.id)

add-labels = (selection) ->

    label-g = selection.append \g
        ..attr \class, \label
        ..append \rect
        ..append \text

    label-g.each (d) ->
        d.bbox = @getBBox!
        if d.label?.length
            d.width = d.bbox.width + 2 * node-padding
            d.height = d.bbox.height + 2 * node-padding
        else
            d.width = d.height = 0

    label-g.select \text
        .attr \text-anchor, \left
        .append \tspan
            .attr \dy, \1em
            .text (.label)

    label-g #.select \rect
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)

    label-g.attr \transform, ({dagre: {points}}) ->
        x = mean map (.x), points
        y = mean map (.y), points
        "translate(#{ x },#{ y })"

mark-reachable = (node) ->
    node.is-focus = true
    sources = (reject (.is-reachable)) << (map -> it.is-source; it) << (map (.source)) << (.edges)
    targets = (reject (.is-reachable)) << (map -> it.is-target; it) << (map (.target)) << (.edges)
    next-rank = -> unique concat [ (sources it), (targets it) ]
    to-mark = next-rank node
    while n = to-mark.shift()
        n.is-reachable = true
        next-level =
            | n.is-source => targets n
            | otherwise   => sources n
        for nn in next-level
            to-mark.push nn

unmark = (nodes) ->
    for n in nodes
        n.is-reachable = false
        n.is-focus = false
        n.is-source = false
        n.is-target = false

only-marked = (nodes, edges) ->
    nodes: filter (.is-reachable), nodes
    edges: filter (({target, source}) -> all (.is-reachable), [source, target]), edges

# Roots are those nodes that only have edges coming in, not going out.
find-roots = ({nodes}) -> [n for n in nodes when all ((is n) << (.source)), n.edges]

grow-tree = ({id, label, edges}) ->
    tn = {id, label, children: []}
    tn.node-type = \root
    for e in reject ((is id) << (.id) << (.target)), edges
        branch = grow-tree e.target
            ..node-type = \branch
            ..parent = tn
            ..relationship = e.label
        tn.children.push branch
    return tn

all-children = (tree) ->
    children = {}
    queue = [tree]
    while c = queue.shift!
        children[c.id] ?= c
        for gc in c.children
            queue.push gc
    return values children

draw-chord = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    roots = find-roots graph

    trees = map grow-tree, roots

    ontology = label: \GO, children: [], id: \go-ontology

    node-mapping = {}

    for tree in trees
        sub-ontology =
            label: tree.label
            id: tree.id
            children: all-children tree
        console.log sub-ontology
        for term in sub-ontology.children
            term.parent = sub-ontology
            term.children = []
            node-mapping[term.id] = term
        sub-ontology.parent = ontology
        ontology.children.push sub-ontology

    get-mapped = -> node-mapping[it.id]

    links = graph.edges
            |> map ({source, target}) -> {source: (get-mapped source), target: (get-mapped target)}
            |> filter ({source, target}) -> source and target

    console.log links.length

    svg = d3.select \svg

    svg
        .attr \width, 2000
        .attr \height, 1000

    orientation = angle: 0

    svg-group = svg.append(\g).attr \transform, 'translate(500, 500)'

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    bundle = d3.layout.bundle!

    cluster = d3.layout.cluster!
        .size [360, 250]

    line = d3.svg.line.radial!
        .interpolate \bundle
        .tension 0.85
        .radius (.y)
        .angle -> it.x / 180 * Math.PI

    nodes = cluster.nodes ontology

    console.log length all-children ontology
    console.log nodes.length

    splines = bundle links

    path = svg-group.select-all \path.chord
        .data links
        .enter!
            .append \path
            .attr \class, \chord
            .attr \stroke, \#555
            .attr \d, (d, i) -> line splines[i]

    angle-between = ([xa, ya], [xb, yb]) ->
        | xa is xb and ya is yb => Math.PI / 2
        | otherwise => Math.atan2 yb - ya, xb - xa

    drag-g-terms = d3.behavior.drag!
        .origin ->
            t = d3.select @
            {x: t.attr(\x), y: t.attr(\y)}
        .on \drag (d) ->
            angle = Math.atan2 d3.event.dx, d3.event.dy
            orientation.angle += angle
            svg-group.attr \transform, "translate(500, 500) rotate(#{ orientation.angle * 180 / 2 })"

    go-terms = svg-group.select-all \g.node
        .data nodes
        .enter!
            .append \g
            .attr \class, \node
            .attr \id, (.replace /:/g, \_) << (.id)
            .attr \transform, ({x, y}) -> "rotate(#{ x - 90 }) translate(#{ y })"
        .append \text
            .attr \class, \chord-label
            .attr \dx, ({x}) -> if x < 180 then 8 else -8
            .attr \dy, \.31em
            .attr \text-anchor, ({x}) -> if x < 180 then \start else \end
            .attr \transform, ({x}) -> if x < 180 then null else 'rotate(180)'
            .text (.label)
            .classed \direct, (.id) >> (in direct-nodes)
            .on \mouseover, show-links
            .on \mouseout, hide-links
            #.call drag-g-terms

    linkage-palette = d3.scale.category20b!

    function show-links d, i, level = 1
        return if level > 20 or d.seen
        svg-group.select-all \path.chord
            .attr \stroke, ({source, target}) ->
                next-level = level + 1
                #if source is d
                #    source.seen = level
                #    setTimeout (-> show-links target, i, next-level), 0
                #    linkage-palette level
                if target is d
                    target.seen = level
                    set-timeout (-> show-links source, i, next-level), 0
                    linkage-palette level
                else
                    lowest = Math.max (target.seen or 0), (source.seen or 0)
                    if lowest then linkage-palette lowest else null

    function hide-links d
        for n in nodes
            n.seen = false
        set-timeout (-> svg-group.select-all \path.chord .attr \stroke, \#555), 0

draw-force =  (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    force = d3.layout.force!
        .charge (d) -> -100 - (10 * d.edges.length)
        .friction 0.8
        .gravity 0.04
        .link-strength 0.5
        .link-distance ({source, target}) ->
            ns = [source, target]
            (10 * sum map (-> it.edges?.length or 0) ns) + 50 + if (any (.marked), ns) then 150 else 0
        .size [1400, 1000]

    svg = d3.select \svg
    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    color = d3.scale.category10!
    relationships = unique map (.label), graph.edges

    svg
        .attr \width, 1400
        .attr \height, 1000

    force.nodes graph.nodes
        .links graph.edges
        .on \tick, tick

    link = svg-group.select-all \.force-link
        .data graph.edges
    link.enter!
        .append (if query-params.spline then \path else \line)
        .attr \class, \force-link
        .attr \stroke-width, \1px
        .attr \stroke, (color) << (relationships~index-of) << (.label)
        .attr \fill, (color) << (relationships~index-of) << (.label)
    link.exit!remove!

    get-label-id = (\label- +) << (.replace /:/g, \-) << (.id)
    node = svg-group.select-all \.force-node
        .data graph.nodes
    n-g = node.enter!
        .append \g
        .attr \class, \force-node
        .call force.drag
        .on \click, draw-path-to-root

    get-r = (5 +) << (length) << (.edges)

    n-g.append \circle
        .attr \class, \force-term
        .classed \root, (n) -> all (is n), map (.source), n.edges
        .classed \direct, (.is-direct)
        .attr \r, get-r

    n-g.append \text
        .attr \class, \force-label
        .attr \text-anchor, \start
        .attr \fill, \#555
        .attr \stroke, \black
        .attr \stroke-width, \0.5px
        .attr \display, -> if it.is-direct then \block else \none
        .attr \id, get-label-id
        .text (.label)

    n-g.append \title
        .text (.label)

    legend = svg.select-all \g.legend
        .data relationships
    lg = legend.enter!
        .append \g
        .attr \class, \legend
        .attr \width, 200
        .attr \height, 50
        .attr \x, 25
        .attr \y, (d, i) -> 25 + 50 * i

    lg.append \rect
        .attr \opacity, 0.6
        .attr \width, 250
        .attr \height, 50
        .attr \x, 25
        .attr \y, (d, i) -> 50 * i
        .attr \fill, (d, i) -> color i

    lg.append \text
        .attr \x, 25
        .attr \y, (d, i) -> 25 + 50 * i
        .attr \dy, \0.31em
        .attr \dx, \1em
        .text id

    update-marked!

    var timer

    function draw-path-to-root d, i
        clear-timeout timer
        queue = [d]
        moar = -> it.edges |> map (.source) |> reject (.marked) |> unique
        count = 0
        max = 15 # don't overwhelm things
        while (count++ < max) and n = queue.shift!
            n.marked = true
            for sn in moar n
                queue.push sn
        update-marked true
        timer := set-timeout unmark , 15000ms

    function unmark
        for n in graph.nodes
            n.marked = false
        update-marked!

    function update-marked marked
        force.start!

        node.select-all \text
            .attr \display ({marked, id, edges, is-direct}) ->
                | (marked or is-direct) => \block
                | all (is id), map (.id) << (.source), edges => \block
                | otherwise => \none

        link.attr \stroke-width, ({target}) ->
            | target.marked => \2px
            | otherwise => \1px

        if marked
            node.select-all \circle
                .attr \opacity, -> if it.marked then 1 else 0.3
            link.attr \opacity, ({target}) ->
                | target.marked => 0.8
                | otherwise => 0.3
            node.select-all \text
                .attr \opacity, -> if it.marked then 1 else 0.3

        else
            node.select-all \circle
                .attr \opacity, 1
            link.attr \opacity, 0.6
            node.select-all \text
                .attr \opacity, 1

    function show-label d, i
        for n in concat-map (-> [it.source, it.target]), d.edges
            d3.select(\# + get-label-id n).attr \display, \block
        set-timeout (-> hide-label d, i), 6000ms

    function hide-label d, i
        for n in concat-map (-> [it.source, it.target]), d.edges
            d3.select(\# + get-label-id n).attr \display, \none

    /* http://bl.ocks.org/sboak/2942559 */
    /* http://bl.ocks.org/sboak/2942556 */
    basis-line = d3.svg.line!
            .interpolate \basis
    offset-scale = 0.1

    draw-curve = ({target, source}) ->
        [source, target] = [target, source]
        {cos, sin, sqrt, atan2, pow, PI} = Math
        slope = atan2 (target.y - source.y), (target.x - source.x)
        [sin-s, cos-s] = map (-> it slope), [sin, cos]
        slope-plus90 = PI / 2 + slope
        [sin90, cos90] = map (-> it slope-plus90), [sin, cos]

        [radius-t, radius-s] = map get-r, [target, source]
        width = radius-s / 3

        mean-x = mean map (.x), [source, target]
        mean-y = mean map (.y), [source, target]

        line-length = sqrt pow(target.x - source.x, 2) + pow(target.y - source.y, 2)

        mp1-x = mean-x + (offset-scale * line-length + (width / 2)) * cos90
        mp1-y = mean-y + (offset-scale * line-length + (width / 2)) * sin90
        mp2-x = mean-x + (offset-scale * line-length - (width / 2)) * cos90
        mp2-y = mean-y + (offset-scale * line-length - (width / 2)) * sin90

        points = [
            [(source.x - width * cos90), (source.y - width * sin90)],
            [mp2-x, mp2-y],
            [(target.x + radius-t * cos-s), (target.y + radius-t * sin-s)],
            [(target.x + radius-t * cos-s), (target.y + radius-t * sin-s)],
            [mp1-x, mp1-y],
            [(source.x + width * cos90), (source.y + width * sin90)]
        ]
        points |> basis-line |> (+ \Z)


    function tick
        # find overlapping labels
        texts = node.select-all \text
        displayed-texts = texts.filter -> \block is d3.select(@).attr \display
        displayed-texts.each (d1) ->
            overlapped = false
            displayed-texts.each (d2) -> overlapped or= abs(d1.y - d2.y) < 20
            if overlapped
                op = if Math.random! > 0.5 then (+) else (-)
                d1.y = op d1.y, 22 # Jiggle them out of the way of each other.

        texts.attr \x, (.x)
            .attr \y, (.y)
        node.select-all \circle
            .attr \cx, (.x)
            .attr \cy, (.y)
        if query-params.spline
            link.attr \d, draw-curve
        else
            link.attr \x1, (.x) << (.source)
                .attr \y1, (.y) << (.source)
                .attr \x2, (.x) << (.target)
                .attr \y2, (.y) << (.target)


draw-radial = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    roots = find-roots graph

    root =
        | query-params?.root => find ((is query-params.root) << (.id)), roots
        | otherwise => head roots

    tree = grow-tree root

    svg = d3.select \svg

    svg
        .attr \width, 2000
        .attr \height, 1000

    svg-group = svg.append(\g).attr \transform, 'translate(500, 500)'

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    cluster = d3.layout.cluster!
        .size [360, 225]
        .sort (a, b) -> d3.ascending a.children.length, b.children.length

    diagonal = d3.svg.diagonal.radial!
        .projection ({x,y}) -> [y, x / 180 * Math.PI]

    nodes = cluster.nodes tree
    links = cluster.links nodes

    #if query-params?.join-leaves
    #    [nodes, links] = join-leaves nodes, links

    palette = d3.scale.category10!
    relationships = unique map (.relationship), nodes
    link-stroke = (palette) << (relationships~index-of)

    link = svg-group.select-all \path.link
        .data links
        .enter!
            .append \path
            .attr \class, \link
            .attr \stroke, link-stroke
            .attr \d, diagonal

    node = svg-group.select-all \g.treenode
        .data nodes
        .enter!
            .append \g
            .attr \class, \treenode
            .attr \transform, ({x, y}) -> "rotate(#{ x - 90 }) translate(#{ y })"

    set-on-each-to-root = (tn, val) ->
        tn <<< val
        while tn = tn.parent
            tn <<< val

    circle-palette = d3.scale.category20!
    node-ids = unique map (.id), nodes
    circle-fill = (circle-palette) << (node-ids~index-of) << (.id)

    circles = node.append \circle
        .attr \r, -> if it.node-type is \root then 10 else 3.5
        .attr \class, -> if it.id in direct-nodes then \direct else it.node-type
        .attr \fill, circle-fill
        .on \mouseover, (tn) ->
            set-on-each-to-root tn, focus: true
            for n in nodes when n.id is tn.id and n isnt tn
                n.synonym = true
            show-focussed!
        .on \mouseout, (tn) ->
            set-on-each-to-root tn, focus: false
            for n in nodes
                n.synonym = false
            show-focussed!

    texts = node.append \text
        .attr \class, \go-name
        .attr \dx, ({x}) -> if x < 180 then 8 else -8
        .attr \dy, \.31em
        .text (.label)
        .attr \text-anchor, \start
        .attr \text-anchor, ({x, children}) ->
            | x < 180 => \start
            | children.length > 1 => \start
            | otherwise => \end
        .attr \transform, ({x, children}) ->
            | children.length > 1 => 'rotate(0)'
            | x < 45  => 'rotate(45)'
            | x < 180 => 'rotate(-45)'
            | x < 315 => 'rotate(240)'
            | otherwise => 'rotate(120)'

    do show-focussed = ->
        texts.attr \opacity, ({focus}) ->
            | focus => 1
            | nodes.length > 50 => 0
            | otherwise => 0.1
        link.attr \stroke-width, ({target: {focus}}) -> if focus then \5px else \1.5px
        circles.attr \r, ({node-type, synonym}) ->
            | node-type is \root => 10
            | synonym => 7
            | otherwise => 3.5


draw-dag = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    svg = d3.select \svg
    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    # Hacky hack for now - should not have to do this...
    svgBBox = svg.node!getBBox!
        ..width = 5000
        ..height = 2000

    render svg, svg-group, graph

make-graph = (direct-nodes, edges, node-for-ident) ->

    for e in edges
        for prop in <[ source target ]>
            node-for-ident[e[prop]].edges.push e

    # Lift idents to nodes
    for e in edges
        e.source = node-for-ident[e.source]
        e.target = node-for-ident[e.target]

    for ident, node of node-for-ident
        if ident in direct-nodes
            node.is-direct = true

    nodes = values node-for-ident

    {nodes, edges}

do-update = (group) ->
    group.select-all \circle.cp
        .attr \r, 10
        .attr \cx, (.x)
        .attr \cy, (.y)

    label-g = group.select-all \g.label

    label-g
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)
        .attr \transform, ({dagre: {points}, bbox}) ->
            x = mean map (.x), points
            y = mean map (.y), points
            "translate(#{ x },#{ y })"

render = (svg, svg-group, {nodes, edges, reset}) -->

    re-render = render svg, svg-group

    update = -> do-update svg-group

    reset ?= -> re-render {nodes, edges}

    console.log "Rendering #{ length nodes } nodes and #{ length edges } edges"

    svgBBox = svg.node!getBBox!

    mv-edge = translate-edge svgBBox

    svg-group.select-all('*').remove!

    svg-edges = svg-group.select-all 'g .edge'
        .data edges

    edges-enter = svg-edges.enter!
        .append \g
        .attr \id, -> (it.source.id + it.label + it.target.id).replace /:/g, \_
        .attr \class, \edge

    svg-edges.exit!remove!

    svg-nodes = svg-group.select-all 'g .node'
        .data nodes

    nodes-enter = svg-nodes.enter!
        .append \g
        .attr \class, \node
        .attr \id, to-node-id

    svg-nodes..exit!remove!

    nodes-enter.on \click, (node) ->
        was-filtered = node.is-focus
        unmark nodes
        if was-filtered
            console.log "Resetting"
            reset!
        else
            mark-reachable node
            filtered = only-marked nodes, edges
            re-render filtered <<< {reset}

    rects = nodes-enter.append \rect

    edges-enter.append \path
        .attr \marker-start, 'url(#arrowhead)'

    drag-cp = d3.behavior.drag!
        .on \drag, (d) ->
            d.y += d3.event.dy
            mv-edge d.parent, d3.event.dx, 0
            d3.select(\# + d.parent.dagre.id).attr \d, spline


    labels = nodes-enter.append \text
        .attr \text-anchor, \middle
        .attr \x, 0
        .attr \class, -> if it.is-direct then \direct else \indirect

    labels.append \tspan
        .attr \x, 0
        .attr \dy, \1em
        .text (.label)

    labels.each (d) ->
        bbox = @getBBox!
        d.bbox = bbox
        d.width = bbox.width + 2 # * node-padding
        d.height = bbox.height + 2  # * node-padding

    rects
        .attr \width, (node-padding +) << (.width)
        .attr \height, (node-padding +) << (.height)
        .attr \x, -> -it.bbox.width / 2 - node-padding
        .attr \y, -> -it.bbox.height / 2 - node-padding / 2
        .attr \class, ->
            | it.is-focus  => \focus
            | it.is-direct => \direct
            | otherwise    => \indirect

    labels
        .attr \x, -> -it.bbox.width / 2
        .attr \y, -> -it.bbox.height / 2

    dagre.layout!
        .nodeSep 50
        .edgeSep 10
        .rankSep 50
        .nodes nodes
        .edges edges
        .debugLevel 1
        .run!

    # Apply the layout
    nodes-enter.attr \transform, -> "translate(#{ it.dagre.x },#{ it.dagre.y })"

    focus-edges = ->
        svg-edges.select-all \path
            .attr \class, ->
                | it.highlight => \highlight
                | otherwise    => it.label

    nodes-enter.on \mouseover, (node) ->
        for e in node.edges
            e.highlight = true
        focus-edges!
    nodes-enter.on \mouseout, (node) ->
        for e in node.edges
            e.highlight = false
        focus-edges!

    # ensure two control points between source and target
    edges-enter.each (d) ->
        {points} = d.dagre
        unless points.length
            s = d.source.dagre
            t = d.target.dagre
            points.push x: (s.x + t.x) / 2, y: (s.y + t.y) / 2

        if points.length is 1
            points.push x: points[0].x, y: points[0].y

    add-labels edges-enter

    edges-enter.select-all \circle.cp
        .data (d) ->
            [p.parent = d for p in d.dagre.points]
            d.dagre.points.slice!reverse!
        .enter!
        .append \circle
            .attr \class, \cp
            .call drag-cp

    relationships = reverse unique map (.label), edges
    palette = d3.scale.category10!
    edge-stroke = (palette) << (relationships~index-of) << (.label)

    svg-edges.select-all \path
        .attr \id, (.id) << (.dagre)
        .attr \d, spline
        .attr \stroke, edge-stroke

    update!

    get-drag-x = get-node-drag-pos \width, \x, svgBBox
    get-drag-y = get-node-drag-pos \height, \y, svgBBox

    drag-handler = (d, i) ->
        prev-x = d.dagre.x
        prev-y = d.dagre.y
        # Must be inside the svg box
        d.dagre.x = get-drag-x d
        d.dagre.y = get-drag-y d

        d3.select(@).attr \transform, "translate(#{ d.dagre.x },#{ d.dagre.y })"

        dx = d.dagre.x - prev-x
        dy = d.dagre.y - prev-y

        for e in d.edges
            mv-edge e, dx, dy
            update!
            d3.select(\# + e.dagre.id).attr \d, spline(e)

    node-drag = d3.behavior.drag!
        .origin ({pos, dagre}) -> (if pos then pos else dagre) |> ({x, y}) -> {x, y}
        .on \drag, drag-handler

    edge-drag = d3.behavior.drag!
        .on \drag, (d, i) ->
            mv-edge d, d3.event.dx, d3.event.dy
            d3.select(@).attr \d, spline d

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    nodes-enter.call node-drag
    edges-enter.call edge-drag

flatten = concat-map id

row-to-node = ([target, label, source]) -> {target, label, source}

query-params =
    (location.search or '?')
    |> (.substring 1)
    |> (.split \&)
    |> map (map decodeURIComponent) << (.split \=)
    |> listToObj

current-symbol = -> query-params.symbol or \bsk

main = (symbol) ->
    console.log "Drawing graph for #{ symbol }"

    getting-direct = symbol |> direct-terms |> rows |> (.then flatten)
    getting-all = symbol |> all-go-terms |> rows
    getting-names = getting-all.then (fetch-names << flatten)
    getting-edges = getting-all.then(rows << whole-graph-q << flatten).then map row-to-node

    draw = switch query-params.view
        | \radial => draw-radial
        | \chord  => draw-chord
        | \force => draw-force
        | otherwise => draw-dag

    $.when(getting-direct, getting-edges, getting-names).then draw

# Let's go!
main current-symbol!

