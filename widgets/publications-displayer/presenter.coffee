# Our data.
class Publication extends Backbone.Model

class Publications extends Backbone.Collection
    
    model: Publication

# The table used to render the paginated view.
class Table extends Backbone.View

    # Which page are we on?
    page: 0
    # How many publications per page?
    size: 10

    # The behaviors.
    events:
        'click ul.pages a':   'changePage'
        'keyup input.symbol': 'changeSymbol'

    initialize: (opts) ->
        # Expand opts on us.
        @[k] = v for k, v of opts

    render: ->
        # Populate the template
        $(@el).html @template
            # Give us a specific page.
            'rows':    if @collection.length isnt 0 then @collection.toJSON().splice(@size * @page, @size) else []
            'symbol':  @symbol
            'pages':   Math.ceil @collection.length / @size
            'current': @page
            'count':   @collection.length
        @

    # Change the current page and re-render.
    changePage: (e) ->
        @page = parseInt($(e.target).text()) - 1
        @render()

    changeSymbol: (e) ->
        done = =>
            symbol = $(e.target).val()
            if symbol isnt '' and symbol isnt @symbol
                # Borrow the data loader from Widget.
                @data symbol, (records) =>
                    # Long live the new King.
                    @symbol = symbol
                    @collection = new Publications records
                    @render()

        # Reset previous timeouts.
        if @timeout? then clearTimeout @timeout
        # Start a timeout so we do not fetch immediately.
        @timeout = root.setTimeout(done, 500)

# This is my widget definition, needs to have a set signature.
class Widget

    # Have access to config and templates compiled in.
    constructor: (@config, @templates) ->
        # Point to the mine's service.
        @service = new intermine.Service 'root': @config.mine

    # Fetch us the data.
    data: (symbol, done) =>
        # Show loading message.
        $(@view?.el).hide()
        $(@target).prepend loading = $ '<div class="alert-box">Loading &hellip;</div>'

        # Add the symbol we want to constrain on to the pathQuery.
        pq = @config.pathQuery
        pq.where =
            'symbol':
                '=': symbol

        # Run the PathQuery and pop the publications if present.
        @service.query pq, (q) =>
            q.records (records) =>
                $(@view?.el).show()
                loading.remove()

                # Callback with the results.
                if records.length is 1 and records[0].publications?
                    done records.pop().publications
                else
                    done []

    # Render simply returns a string to be returned to the target.
    render: (@target) ->
        # Get the data.
        @data @config.symbol, (records) =>
            # new View.
            @view = new Table
                # Pop the publications for this gene.
                'collection': new Publications records
                # 'table.eco' template.
                'template':   @templates.table
                # Initial symbol coming from client side config.
                'symbol':     @config.symbol
                # Link back to the data loader.
                'data':       @data
            # Render into the target el.
            $(@target).html @view.render().el