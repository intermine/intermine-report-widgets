class Publication extends Backbone.Model

class Publications extends Backbone.Collection
    
    model: Publication

# This is my widget definition.
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
                $(target).html @templates.template
                    'rows':  records.pop().publications
                    'title': "Publications for '#{@config.symbol}'"
