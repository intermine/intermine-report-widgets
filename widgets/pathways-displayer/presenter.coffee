#!/usr/bin/env coffee

# Simple assertion class.
class AssertException

    constructor: (@message) ->

    toString: -> "PathwaysDisplayerAssertException: #{@message}"

###
Set the assertion on the window object.
@param {boolean} exp Expression to be truthy
@param {string} message Exception text to show if `exp` is not truthy fruthy
###
@.assert = (exp, message) -> throw new AssertException(message) unless exp


$ = jQuery or Zepto


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

        grid.messages.new 'Loading homologues &hellip;', 'homologues'

        # Get pathways for a single mine.
        launchOneP = (mine, url, homologues) =>
            # Show a loading message.
            grid.messages.new "Loading #{mine} &hellip;", mine

            # Promise to, after we get the data, to add them to the grid.
            $.when(@getPathways(homologues, url)).then( (pathways) ->
                grid.messages.clear mine

                for [ pathway, isCurated, organism ] in pathways
                    # Add the element to the row.
                    grid.add pathway, organism, $ '<span/>',
                        'text':  'Yes'
                        'class': if isCurated then 'label success has-tip' else 'label secondary has-tip'
                        'title': mine

                    # Init tooltips (again).
                    $(document).foundationTooltips()
            )
        
        # Launch an array of pathway fetching functions and that is it.
        launchAllP = (homologues) =>
            # A list of functions.
            all = []
            ( for mine, url of @config.mines then do (mine, url) -> all.push launchOneP(mine, url, homologues) )

            $.when(all).done()

        # Start here by getting all homologues and then going forward with the mines.
        $.when(@getHomologues(@config.symbol)).then( (homologues) =>
            # Done loading homologues, clear the message.
            grid.messages.clear 'homologues'
            
            # Adjust the message in the title.
            $(@el).find('p').html 'Using <strong>homologues</strong>: ' + homologues.join(', ')

            grid.legend '<span class="label success"></span> Is curated <span class="label secondary"></span> Is not curated '

            homologues
        ).then(
            launchAllP
        ).fail( (err) ->
            console.log err
        )

    # For a given symbol return a promise to a list of homologues.
    getHomologues: (symbol) =>
        assert symbol? and symbol isnt '', 'Need to provide a symbol to constrain gene on'

        # Constrain on 'this' gene.
        pq = JSON.parse JSON.stringify @config.pathQueries.homologues
        pq.constraints ?= []
        pq.constraints.push
            'path':  'Gene'
            'op':    'LOOKUP'
            'value': symbol

        # Make a service...
        serviceP = (service, pq) -> service.query(pq)
        # ... turn q into rows...
        rowsP    = (q) -> q.rows()
        # ... finish off
        fin      = (rows) -> ( g[0] for g in rows when g[0] )

        error = (err) -> console.log err

        # Promise to query the service getting rows and then reformatting them for us.
        $.when(serviceP(@service, pq)).then(rowsP).then(fin).fail(error)

    # For a set of identifiers and mine URL callback with pathway names.
    getPathways: (identifiers, url) ->
        assert identifiers? and identifiers instanceof Array, 'Need to provide an Array of gene identifiers to constrain pathways on'

        # Constrain on a set of identifiers.
        pq = JSON.parse JSON.stringify @config.pathQueries.pathways
        pq.constraints ?= []
        pq.constraints.push
            'path':   'Gene.primaryIdentifier'
            'op':     'ONE OF'
            'values': identifiers

        # Make a service...
        serviceP = (url, pq) -> (new intermine.Service('root': url)).query pq
        # ... turn q into rows...
        rowsP    = (q) -> q.rows()

        error = (err) -> console.log err

        # Promise to construct query, make a Query and rowify().
        $.when(serviceP(url, pq)).then(rowsP).fail(error)


### Our data.###
class Row extends Backbone.Model

    # By default all rows are visible and unfiltered.
    defaults:
        'show': true

class Rows extends Backbone.Collection
    
    model: Row

    filter: (re) ->
        shown = 0 ; hidden = 0

        @each (model) ->
            if model.get('text').match re
                model.set('show': true) unless model.get('show')
                shown++
            else
                model.set('show': false) if model.get('show')
                hidden++

        [ shown, hidden ]


### The table used to render the paginated view.###
class GridRow extends Backbone.View

    # A table row.
    tagName: 'tr'

    # Slug is our class.
    className: => @model.get 'slug'

    initialize: ->
        # On us.
        @mediator = @attributes.mediator

        # Append a column with the name of our row.
        $(@el).append td = $('<td/>', 'html': @model.get('text'))
        
        # Toggle visibility.
        @model.bind 'change', => $(@el).toggle()

        # Listen for filtering so we can highlight the filter the text we see.
        @mediator.on 'filter', (re) =>
            # Can we be seen?
            if @model.get('show')
                $(@el).find('td:first-child').html @model.get('text').replace re, (str, g1, g2) ->
                    # Are we matching for empty brackets? Not.
                    if g1.length isnt 0 then "<span class='label'>#{g1}</span>" else g1

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
        'keyup input.filter':           'filterAction'
        'click .filterMessage a.show-all': 'clearFilterAction'

    # Init the wrapper for the grid table.
    initialize: ->
        # jQueryize.
        @el = $(@el)

        # Mediator of events.
        _.extend @mediator = {}, Backbone.Events

        # Render the template.
        target = $(@el).html @attributes.template
            'title': @attributes.title

        # Messaging for the user in the context of `this` object.
        @messages = new GridMessages @el

        # Create a collection for rows.
        @collection = new Rows()

        # Link to `tbody`.
        @body = @el.find('.wrapper table tbody')

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
        
        row.appendTo @el.find('.wrapper table thead')

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
            view = new GridRow
                'model': model
                'attributes':
                    'mediator': @mediator

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

        # Do we have at least 8 rows to show the filter?
        if @collection.length >= 8 then @el.find('input.filter').show()

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
            # Fetch the query value and strip whitespace on either end.
            query = $.trim $(e.target).val()
            if query isnt @query
                # Do the actual filtering.
                @query = query
                # Regex.
                re = new RegExp "(#{query})", 'ig'
                # Filter and re-render.
                [ shown, hidden ] = @collection.filter re
                # What about filter clearing message?
                @filterMessage shown, hidden
                # Trigger message.
                @mediator.trigger 'filter', re
        ), 500

    clearFilterAction: ->
        # Clear input field.
        @el.find('input.filter').val ''
        # Filter the collection back.
        [ shown, hidden ] = @collection.filter()
        # What about filter clearing message?
        @filterMessage shown, hidden
        # Trigger the mediator as well.
        @mediator.trigger 'filter', re = new RegExp '()', 'ig'

    # A message saying how many rows are hidden.
    filterMessage: (shown, hidden) ->
        box = @body.find '.filterMessage'
        msg = @body.find '.filterMessage .text'
        
        if hidden isnt 0
            box.show()
            if shown isnt 0
                msg.text "#{hidden} rows are hidden."
            else
                msg.text 'All rows are hidden.'
        else
            box.hide()

    legend: (html) ->
        # Inject.
        (l = @el.find('.legend')).html html
        # Based on the height of the element, shift it above the grid.
        l.css 'top': - l.outerHeight() + 1


### Letting the user know as to what happens.###
class GridMessages

    # Unkeyed messages stored under index number.
    i: 0
    
    # Stores all current messages under keys here.
    msgs: {}

    constructor: (el) ->
        # Sit on this el.
        @el = $(el).find '.notifications'

    # Add a new message.
    new: (text, key) ->
        # Append the new message.
        @el.append m = $ '<div/>',
            'class': 'alert-box'
            'html':  text

        # Was the key provided?
        key = key or i++

        # Save the el.
        @msgs[key] = m

    # Remove one or all messages.
    clear: (key) ->
        # Clear a specific message or all?
        if key?
            @msgs[key]?.remove()
        else
            ( value.remove() for key, value of @msgs )