class Widget

    constructor: (@config, @templates) ->
        @service = new intermine.Service 'root': 'http://beta.flymine.org/beta'

    render: (@target) ->
        # Render the template.
        target = $(@target).html @templates.table()

        # Add the organisms into faux head.
        for organism in @config.organisms
            target.find('.faux thead tr').append $ '<th/>', 'text': organism

        # Init the `Grid`.
        grid = new Grid target.find('.wrapper'), @config.organisms

        # Get homologues in this mine.
        @getHomologues @config.symbol, (homologues) =>
            for mine, url of @config.mines then do (mine, url) =>
                # Now get pathways in all the mines.
                @getPathways homologues, url, (pathways) ->
                    for [ pathway, isCurated, organism ] in pathways
                        grid.add pathway, organism, $ "<span/>",
                            'class': if isCurated then 'label success' else 'label secondary'
                            'text': 'Yes'
                            'title': mine

                        # Fix the faux elements width.
                        target.find('.wrapper thead th').each (i, th) ->
                            $(target).find(".faux th:eq(#{i})").width $(th).outerWidth()

    # For a given symbol callback with a list of homologues.
    getHomologues: (symbol, cb) ->
        # Constrain on 'this' gene.
        pq = JSON.parse JSON.stringify @config.pathQueries.homologues
        pq.constraints ?= []
        pq.constraints.push
            "path": "Gene"
            "op": "LOOKUP"
            "value": symbol
        
        # Run the query giving us homologues.
        @service.query pq, (q) -> q.rows (rows) -> cb ( g[0] for g in rows when g[0] )

    # For a set of identifiers and mine URL callback with pathway names.
    getPathways: (identifiers, url, cb) ->
        # Constrain on a set of identifiers.
        pq = JSON.parse JSON.stringify @config.pathQueries.pathways
        pq.constraints ?= []
        pq.constraints.push
            "path": "Gene.primaryIdentifier"
            "op": "ONE OF"
            "values": identifiers

        # Run the query giving us homologues.
        service = new intermine.Service 'root': url
        service.query pq, (q) -> q.rows cb


### Maintain and dynamically update data in a grid/table.###
class Grid

    # Holds the slugified columns.
    columns: []
    # Holds the slugified rows in order.
    rows: []

    # Actual storage of data.
    grid: {}

    constructor: (el, head) ->
        $(el).append el = $('<table/>')

        # Add target for body of the grid.
        $(el).append @body = $ '<tbody/>'

        # Generate the `<thead>`.
        row = $ '<tr/>'
        row.append $ '<th/>'
        for column in head
            # Add the slug.
            @columns.push columnS = @slugify column
            # Add the el.
            row.append $('<th/>', { 'text': column, 'class': columnS })
        row.appendTo $('<thead/>').appendTo $(el)

    # Add an element to the grid.
    add: (row, column, data) ->
        # Slugify the row and column.
        rowS = @slugify row
        columnS = @slugify column

        # Do we have this pathway already?
        if rowS not in @rows
            # Create the element.
            rowEl = $('<tr/>', 'class': rowS).append($('<td/>',
                'text': row # use the original text
            ))

            # Is this the first row in the grid?
            if not @rows.length
                # Create the row, append to `<tbody>`.
                @body.append rowEl
                @rows = [rowS]
            else
                # Append in order.
                do =>
                    for index, row of @rows
                        if rowS.localeCompare(row) < 0
                            # Insert at a specified index.
                            @rows.splice index, 0, rowS
                            @grid[row]['el'].before rowEl
                            return
                    # Append at the end.
                    @rows.push rowS
                    @body.append rowEl

            # Add row `<td>` columns to the actual grid.
            ( (row, column) =>
                @grid[row] = { 'el': rowEl, 'columns': {} }
                for column in @columns
                    @grid[row]['columns'][column] = do ->
                        rowEl.append el = $ '<td/>', 'class': column
                        el
            ) rowS, columnS

        # We have the grid in place, add the element.
        @grid[rowS]['columns'][columnS].html data

    # Slugify a string.
    slugify: (text) -> text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase()