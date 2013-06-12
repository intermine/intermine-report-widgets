#!/usr/bin/env coffee
root = this

# Can we work?
throw 'An old & unsupported browser detected' unless document.querySelector

class FatAppsClient

    # So that we do not start a selector with a number...
    selectorPrefix: 'w'

    # Save the root URL of the app config
    constructor: (server) ->
        # Strip trailing slash?
        @server = server.replace /\/+$/, ''
        
        # Generate a callback.
        callback = 'rwc' + +new Date

        # A callback setting the config on us..
        root[callback] = (@config) =>

        # Load it.
        root.intermine.load [
            'path': "#{@server}/embedding/fatapps?callback=#{callback}"
            'type': 'js'
        ]
    
    # Load one app.
    #
    # 1. `appId`: id of the app as specified in its config
    # 2. `target`:   element the app will render into
    # 3. `options`:  local options to pass to us, will get merged with @config
    load: (appId, target, options = {}) =>
        # Keep checking if we have the config loaded.
        again = => @load appId, target, options
        if not @config then return _setImmediate again

        # Post dependencies loaded.
        run = (err) =>
            # Any loading problems?
            throw err if err

            # Generate callback UID.
            uid = _uid()

            # Get the compiled script.
            root.intermine.load [
                'path': "#{@server}/embedding/fatapps/#{appId}?callback=#{uid}"
                'type': 'js'
            ], (err) =>
                # Create a wrapper for the target.
                article = document.createElement 'article'
                article.setAttribute 'class', "-im-fatapps #{appId}"

                div = document.createElement 'div'
                div.setAttribute 'id', 'w' + uid
                div.appendChild article

                # Append it to the target, IE8+.
                document.querySelector(target).appendChild div
                
                # Do we have the temp directory to save apps under?
                throw '`intermine.temp` object cache does not exist' unless root.intermine.temp

                # Get the app from there.
                throw "Unknown app `#{uid}`" unless app = root.intermine.temp.apps[uid]

                # Get the instantiation fn, server config and templates from the app.
                [ fn, config, templates ] = app
                
                # Merge server and client config.
                config = _extend config, options

                # Create a new instance passing merged config and templates.
                instance = new fn config, templates

                # Did we create anything?
                throw 'Widget failed to instantiate' unless instance and typeof instance is 'object'

                # Do we implement render function?
                throw 'Widget does not implement `render` function' unless instance.render and typeof instance.render is 'function'

                # Render.
                instance.render "#w#{uid} article.-im-fatapps"

        # Load dependencies?
        deps = @config[appId]

        if deps? then root.intermine.load deps, run
        else run()

# Do we have the InterMine API Loader?
if not root.intermine
    throw 'You need to include the InterMine API Loader first!'
else
    # Expose class globally?
    root.intermine.fatApps = root.intermine.fatApps or FatAppsClient
