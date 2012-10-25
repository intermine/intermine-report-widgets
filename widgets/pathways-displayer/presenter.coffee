### Behavior of the widget.###
class Widget

    constructor: (@config, @templates) ->
        @service = new intermine.Service 'root': 'http://beta.flymine.org/beta'

    render: (@el) ->
        # Init the `Grid`.
        grid = new Grid
            'el': @el
            'attributes':
                'head':     @config.organisms
                'title':    @config.symbol
                'template': @templates.grid

        # Get homologues in this mine.
        @getHomologues @config.symbol, (homologues) =>
            for mine, url of @config.mines then do (mine, url) =>
                # Now get pathways in all the mines.
                @getPathways homologues, url, (pathways) ->
                    for [ pathway, isCurated, organism ] in pathways
                        # Add the element to the row.
                        grid.add pathway, organism, $ '<span/>',
                            'text':  'Yes'
                            'class': if isCurated then 'label success' else 'label secondary'
                            'title': mine

    # For a given symbol callback with a list of homologues.
    getHomologues: (symbol, cb) ->
        # Constrain on 'this' gene.
        pq = JSON.parse JSON.stringify @config.pathQueries.homologues
        pq.constraints ?= []
        pq.constraints.push
            'path':  'Gene'
            'op':    'LOOKUP'
            'value': symbol
        
        # Run the query giving us homologues.
        @service.query pq, (q) -> q.rows (rows) -> cb ( g[0] for g in rows when g[0] )

    # For a set of identifiers and mine URL callback with pathway names.
    getPathways: (identifiers, url, cb) ->
        # Constrain on a set of identifiers.
        pq = JSON.parse JSON.stringify @config.pathQueries.pathways
        pq.constraints ?= []
        pq.constraints.push
            'path':   'Gene.primaryIdentifier'
            'op':     'ONE OF'
            'values': identifiers

        # Run the query giving us homologues.
        service = new intermine.Service 'root': url
        service.query pq, (q) -> q.rows cb


### Our data.###
class Row extends Backbone.Model

    # By default all rows are visible and unfiltered.
    defaults:
        'show': true

class Rows extends Backbone.Collection
    
    model: Row

    filter: (re) ->
        @each (model) ->
            if model.get('text').match re
                model.set('show': true) unless model.get('show')
            else
                model.set('show': false) if model.get('show')


### The table used to render the paginated view.###
class GridRow extends Backbone.View

    # A table row.
    tagName: 'tr'

    # Slug is our class.
    className: => @model.get 'slug'

    initialize: ->
        # Append a column with the name of our row.
        $(@el).append($('<td/>', 'text': @model.get('text')))
        
        # Toggle visibility.
        @model.bind 'change', => $(@el).toggle()

        @


### Maintain and dynamically update data in a grid/table.###
class Grid extends Backbone.View

    # Holds the slugified columns.
    columns: []
    
    # Holds the slugified rows in order.
    rows: []

    # Actual storage of data.
    grid: {}

    # Events on the whole grid.
    events:
        'keyup input.filter': 'filterAction'

    # Init the wrapper for the grid table.
    initialize: ->
        # jQueryize.
        @el = $(@el)

        # Render the template.
        target = $(@el).html @attributes.template
            'title': @attributes.title

        # Create a collection for rows.
        @collection = new Rows()

        # Create `table` element.
        @el.find('.wrapper').append table = $ '<table/>'

        # Add target for body of the grid.
        table.append @body = $ '<tbody/>'

        # Generate the `<thead>`.
        row = $ '<tr/>'
        row.append $ '<th/>'
        for column in @attributes.head
            # Add the slug.
            @columns.push columnS = @slugify column
            # Add the el.
            row.append $ '<th/>', { 'text': column, 'class': columnS }
            # Add to the faux head.
            @el.find('.faux thead tr').append $ '<th/>', 'text': column
        
        row.appendTo $('<thead/>').appendTo table

        # Adjust faux header width whenever the underlying collection changes.
        @collection.bind 'change', @adjustFauxHeader
        @collection.bind 'add',    @adjustFauxHeader

        @

    # Add an element to the grid.
    add: (row, column, data) ->
        # Slugify the row and column.
        rowS = @slugify row
        columnS = @slugify column

        # Do we have this pathway already?
        if rowS not in @rows
            # Create a new Model representation.
            model = new Row
                'text': row
                'slug': rowS

            # Add it to the collection.
            @collection.add model

            # Create a new View representation.
            view = new GridRow 'model': model

            # Is this the first row in the grid?
            if not @rows.length
                # Create the row, append to `<tbody>`.
                @body.append view.el
                @rows = [rowS]
            else
                # Append in order.
                do =>
                    for index, row of @rows
                        if rowS.localeCompare(row) < 0
                            # Insert at a specified index.
                            @rows.splice index, 0, rowS
                            $(@grid[row]['el']).before view.el
                            return
                    # Append at the end.
                    @rows.push rowS
                    @body.append view.el

            # Add row `<td>` columns to the actual grid.
            ( (row, column) =>
                @grid[row] = { 'el': view.el, 'columns': {} }
                for column in @columns
                    @grid[row]['columns'][column] = do ->
                        $(view.el).append el = $ '<td/>', 'class': column
                        el
            ) rowS, columnS

        # We have the grid in place, add the element.
        @grid[rowS]['columns'][columnS].html data

    # Slugify a string.
    slugify: (text) -> text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase()

    # Fix the faux elements width.
    # Does not work immediately, waits a while for new elements to come.
    adjustFauxHeader: =>
        # Delay any further processing by a few.
        if @fauxTimeout? then clearTimeout @fauxTimeout

        @fauxTimeout = setTimeout (=>
            @el.find('.wrapper thead th').each (i, th) =>
                @el.find(".faux th:eq(#{i})").width $(th).outerWidth()
        ), 0

    # Filter the list of entries.
    filterAction: (e) =>
        # Delay any further processing by a few.
        if @filterTimeout? then clearTimeout @filterTimeout

        @filterTimeout = setTimeout (=>
            # Fetch the query value.
            query = $(e.target).val()
            if query isnt @query
                # Do the actual filtering.
                @query = query
                # Regex.
                re = new RegExp "#{query}.*", 'i'
                # Filter and re-render.
                @collection.filter re
        ), 500