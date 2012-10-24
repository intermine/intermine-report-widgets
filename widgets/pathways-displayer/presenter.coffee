class Widget

    constructor: (@config, @templates) ->

    render: (@target) ->
        # The mines we will be 'querying'.
        mines = [ 'FlyMine', 'CoalMine', 'GoldMine' ]

        # Data for each 'mine'.
        data = [
            'name':     "FlyMine"
            'pathways': [ "glycoLysis", "Glucuronic acid", "Lipogenesis", "Citric acid cycle", "Oxidative phosphorylation" ]
        ,
            'name':     "GoldMine"
            'pathways': [ "Nitrogen metabolism", "Glycolysis", "Oxidative phosphorylation", "Inositol", "glucuronic acid" ]
        ,
            'name':     "CoalMine"
            'pathways': [ "citric acid CYCLE", "Lipogenesis", "inositol", "Nitrogen metabolism" ]
        ]

        $(@target).append target = $ '<table/>'

        grid = new Grid target, mines

        # Traverse the server data.
        for mine in data then do (mine) ->
            for pathway in mine.pathways then do (mine, pathway) ->
                # Now add the pathway for this mine into the grid.
                grid.add pathway, mine['name'], $("<span/>", 'class': 'label label-success', 'text':    'Yes')


### Maintain and dynamically update data in a grid/table.###
class Grid

    # Holds the slugified columns.
    columns: []
    # Holds the slugified rows in order.
    rows:        []

    # Actual storage of data.
    grid:        {}

    constructor: (el, head) ->
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
            rowEl = $("<tr/>", 'class': rowS).append($("<td/>",
                'text':    row # Use the original text.
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
            do =>
                @grid[rowS] = { 'el': rowEl, 'columns': {} }
                for columnS in @columns
                    @grid[rowS]['columns'][columnS] = do ->
                        rowEl.append el = $ '<td/>', 'class': columnS
                        el

        # We have the grid in place, add the element.
        @grid[rowS]['columns'][columnS].html data

    # Slugify a string.
    slugify: (text) -> text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase()