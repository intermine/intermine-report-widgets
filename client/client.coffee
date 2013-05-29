#!/usr/bin/env coffee
root = this

# Can we work?
throw 'An old & unsupported browser detected' unless document.querySelector

class ReportWidgets

    # So that we do not start a selector with a number...
    selectorPrefix: 'w'

    # Save the root URL of the widgets config
    constructor: (server) ->
        # Strip trailing slash?
        @server = server.replace /\/+$/, ''
        
        # Generate a callback.
        callback = 'rwc' + +new Date

        # A callback setting the config on us..
        root[callback] = (@config) =>

        # Load it.
        root.intermine.load [
            'path': "#{@server}/widget/report?callback=#{callback}"
            'type': 'js'
        ]
    
    # Load a report widget.
    #
    # 1. `widgetId`: id of a widget as specified in its config
    # 2. `target`:   element the widget will render into
    # 3. `options`:  local options to pass to us, will get merged with @config
    load: (widgetId, target, options = {}) =>
        # Keep checking if we have the config loaded.
        again = => @load widgetId, target, options
        if not @config then return _setImmediate again

        # Post dependencies loaded.
        run = (err) =>
            # Any loading problems?
            throw err if err

            # Generate callback UID.
            uid = _uid()

            # Get the compiled script.
            root.intermine.load [
                'path': "#{@server}/widget/report/#{widgetId}?callback=#{uid}"
                'type': 'js'
            ], (err) =>
                # Create a wrapper for the target.
                article = document.createElement 'article'
                article.setAttribute 'class', "im-report-widget #{widgetId}"

                div = document.createElement 'div'
                div.setAttribute 'id', 'w' + uid
                div.appendChild article

                # Append it to the target, IE8+.
                document.querySelector(target).appendChild div
                
                # Checks.
                throw '`intermine.temp` object cache does not exist' unless root.intermine.temp

                # Get the widget from the `cache`.
                throw "Unknown widget `#{uid}`" unless widget = root.intermine.temp.widgets[uid]

                # Build config for this instance.
                [Widget, generalConfig, templates] = widget
                config = _extend {}, generalConfig, options
                selector = "#w#{uid} article.im-report-widget"

                instance = new Widget config, templates
                instance.render selector

        # Load dependencies?
        deps = @config[widgetId]

        if deps? then root.intermine.load deps, run
        else run()

# Do we have the InterMine API Loader?
if not root.intermine
    throw 'You need to include the InterMine API Loader first!'
else
    # Expose class globally?
    root.intermine.reportWidgets = root.intermine.reportWidgets or ReportWidgets
