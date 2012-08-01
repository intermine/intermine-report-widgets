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
        @service.query @config.pathQuery, (q) =>
            q.records (records) =>
                $(target).html @templates.layout
                    'rows': records.pop().publications
