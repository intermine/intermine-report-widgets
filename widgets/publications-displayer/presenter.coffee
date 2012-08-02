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
        'click ul.pages a': 'changePage'

    initialize: (opts) ->
        # Expand opts on us.
        @[k] = v for k, v of opts

        # How many pages do we have?
        @pages = @collection.length

    render: ->
        # Populate the template
        $(@el).html @template
            # Give us a specific page.
            'rows':    @collection.toJSON().splice @size * @page, @size
            'symbol':  @symbol
            'pages':   Math.floor @collection.length / @size
            'current': @page
        @

    # Change the current page and re-render.
    changePage: (e) =>
        @page = parseInt($(e.target).text()) - 1
        @render()

# This is my widget definition, needs to have a set signature.
class Widget

    # Have access to config and templates compiled in.
    constructor: (@config, @templates) ->
        # Point to the mine's service.
        @service = new intermine.Service 'root': @config.mine

    # Render simply returns a string to be returned to the target.
    render: (target) ->
        # Add the symbol we want to constrain on to the pathQuery.
        pq = @config.pathQuery
        pq.where =
            'symbol':
                '=': @config.symbol
        
        # Run the PathQuery.
        @service.query pq, (q) =>
            q.records (records) =>
                # Create the table view.
                view = new Table
                    'collection': new Publications records.pop().publications
                    'template':   @templates.table
                    'symbol':     @config.symbol
                $(target).html view.render().el