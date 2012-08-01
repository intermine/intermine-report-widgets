#!/usr/bin/env coffee

$ = jQuery or Zepto
root = this

class ReportWidgets

    selectorPrefix: 'w'

    # Save the root URL of the widgets config
    constructor: (@server) ->
        console.log "Initialize ReportWidgets for #{@server}"
        
        # Fetch the config for this server.
        $.ajax
            'url':      "#{@server}/widgets"
            'dataType': 'json'

            success: (data) =>
                console.log "Got config for #{server}"
                @config = data
    
    # Load a report widget.
    #
    # 1. `widgetId`: id of a widget as specified in its config
    # 2. `target`:   element the widget will render into
    load: (widgetId, target) ->
        # Keep checking if we have the config loaded.
        if not @config? then window.setTimeout((=> @load(widgetId, target)), 0)
        else
            # Post dependencies loaded.
            run = =>
                # TODO: Callback id, random...
                callback = 24517

                console.log "Getting widget #{widgetId}"

                # Get the compiled script.
                $.ajax
                    'url':      "#{@server}/widget/#{callback}/#{widgetId}"
                    'dataType': 'script'
                    
                    success: =>        
                        # Create a wrapper for the target.
                        $(target).html $("<div/>",
                            'id': "#{@selectorPrefix}#{callback}"
                        )
                        
                        # Get the widget from the `cache`.
                        widget = root.intermine.temp.widgets[callback]
                        
                        # Render.
                        widget.render "##{@selectorPrefix}#{callback}"

            # Load the dependencies.
            deps = @config[widgetId].dependencies
            if deps? then root.intermine.load deps, run
            else run

# Expose class globally
root.ReportWidgets = ReportWidgets