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
            'url':      "#{@server}/widget/report"
            'dataType': 'jsonp'

            success: (data) =>
                console.log "Got config for #{server}"
                @config = data
    
    # Load a report widget.
    #
    # 1. `widgetId`: id of a widget as specified in its config
    # 2. `target`:   element the widget will render into
    # 3. `options`:  local options to pass to us, will get merged with @config
    load: (widgetId, target, options = {}) ->
        # Keep checking if we have the config loaded.
        if not @config? then window.setTimeout((=> @load(widgetId, target, options)), 0)
        else
            # Post dependencies loaded.
            run = =>
                # Callback id.
                uid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g, (c) ->
                    r = Math.random() * 16 | 0
                    (if c is "x" then r else r & 0x3 | 0x8).toString 16

                console.log "Getting widget #{widgetId}"

                # Get the compiled script.
                $.ajax
                    'url':      "#{@server}/widget/report/#{widgetId}?callback=#{uid}"
                    'dataType': 'script'
                    
                    success: =>        
                        # Create a wrapper for the target.
                        $(target).html $("<div/>",
                            'id':   "w#{uid}"
                            'html': $('<article/>', 'class': "im-report-widget #{widgetId}")
                        )
                        
                        # Get the widget from the `cache`.
                        widget = root.intermine.temp.widgets[uid]

                        # Inject the extra options to it.
                        merge = (child, parent) ->
                            for key of parent
                                if not child[key]?
                                    child[key] = parent[key] if Object::hasOwnProperty.call parent, key
                            child
                        widget.config = merge widget.config, options
                        
                        # Render.
                        widget.render "#w#{uid} article.im-report-widget"

            # Load the dependencies.
            deps = @config[widgetId]
            if deps? then root.intermine.load deps, run
            else run

# Expose class globally
root.ReportWidgets = ReportWidgets