#!/usr/bin/env coffee
urlib    = require 'url'
director = require 'director'
async    = require 'async'
winston  = require 'winston'
{ exec } = require 'child_process'
{ _ }    = require 'underscore'
fs       = _.extend require('fs-extra'), require('fs')

winston.cli()

# Require builder.
byggir = require './byggir.coffee'

# We are here.
dir = __dirname

# Here be our router once ready.
router = null

# Pass us the config merged from all different sources.
routes = (config) ->
    # A generic responder in the proper scope.
    respond = (res) ->
        (code, out) ->
            # Apples vs oranges.
            switch typeof out
                when 'object'
                    type = 'application/json'
                    out = JSON.stringify out
                when 'string'
                    type = 'application/javascript;charset=utf-8'

            # Warn us.
            if (''+code)[0] isnt '2' then winston.warn out

            # Blargh.
            res.writeHead code, 'content-type': type
            res.write out
            res.end()

    # List all available widgets.
    '/widget/report':
        'get': ->
            res = respond @res

            # Do we have a callback?
            if (callback = urlib.parse(@req.url, true).query?.callback)                
                out = {}
                for widget, stuff of config
                    out[widget] = stuff.dependencies

                res 200, "#{callback}(#{JSON.stringify(out)});"
            else
                return res 500, { 'message': 'Provide a `callback` parameter so we can respond with JSONP' }

    '/widget/report/:widgetId':
        'get': (widgetId) ->
            res = respond @res

            # Do we have a callback?
            if (callback = urlib.parse(@req.url, true).query?.callback)                
                # Do we know this one?
                widget = config[widgetId]
                if widget?
                    # # Run the precompile.
                    # byggir.widget widgetId, callback, widget, (err, js) ->
                    #     return res(500, { 'message': err }) if err
                        
                    #     # Write the output.
                    #     res 200, js

                    # OK we 'should' exist. Do we?
                    async.waterfall [ (cb) ->
                        fs.exists (path = [ dir, 'tmp/build', widgetId + '.js' ].join('/')), (exists) ->
                            return cb "`#{widgetId}` file missing" unless exists
                            cb null, path

                    # Read it then.
                    (path, cb) ->
                        fs.readFile path, 'utf8', cb
                    
                    # Process the file.
                    (js, cb) ->
                        # Remove the leading line.
                        js = (js.split("\n")[1...]).join("\n")
                        
                        # Some defaults.
                        widget.classExpr = widget.classExpr or 'Widget'
                        widget.config = JSON.stringify widget.config or {}
                        
                        # Not a default.
                        widget.callback = callback

                        # Replace the placeholders with actual values.
                        for key, value of widget
                            # Replace this everywhere you see it.
                            js = js.replace new RegExp("#@\\+" + key.toUpperCase(), 'gmi'), value

                        # Looking good.
                        res 200, js

                    ], (err) ->
                        return res 500, { 'message': err } if err

                else
                    res 400, { 'message': "Unknown widget `#{widgetId}`" }
            else
                res 400, { 'message': 'Callback not provided' }

module.exports = (opts) ->
    { widgets, config } = opts

    # Always have an empty one.
    config = config or {}

    # This will take a while.
    ready = no
    winston.info 'Busy'.bold.blue

    # Process config.
    async.waterfall [ (cb) ->
        winston.info 'Processing our config'

        async.waterfall [ (cb) ->
            switch typeof config
                # Assume is a path to load.
                when 'string'
                    fs.readJson config, (err, json) ->
                        return cb err if err
                        config = json
                        cb null

                # OK, no processing needed here
                when 'object' then cb null
                
                else cb 'Unrecognized config input'

        , (cb) ->
            for key, value of config
                if encodeURIComponent(key) isnt key
                    return cb "Widget id `#{key}` is not a valid name and cannot be used, use encodeURIComponent() to check"

            cb null
        
        ], cb

    # Make sure we are clean.
    (cb) ->
        winston.info 'Remove temp directory'
        fs.remove dir + '/tmp', cb

    # Create the build folders for the widgets.
    (cb) ->
        winston.info 'Create temp directory'
        async.eachSeries [ dir + '/tmp/sources', dir + '/tmp/build' ], fs.mkdirs, cb

    # Fetch all of the widgets sources.
    (cb) ->
        winston.info 'Fetch widgets sources'
        # Jobs to run loading all the widget sources.
        jobs = [] ; folder = 0

        process = (path, folder) ->
            (cb) ->
                # Download a Git repo off the net.
                async.waterfall [ (cb) ->
                    winston.data 'Getting ' + path.bold
                    exec "cd #{dir}/tmp/sources && git clone --depth 1 #{path} #{folder}", (err, stdout, stderr) ->
                        cb err

                # Read the config.
                (cb) ->
                    fs.readJson dir + '/tmp/sources/' + folder + '/config.json', cb

                # Validate & build.
                (json, cb) ->
                    jobs = []
                    for key, value of json
                        if encodeURIComponent(key) isnt key
                            return cb "Widget id `#{key}` is not a valid name and cannot be used, use encodeURIComponent() to check"

                        # Extend our config with this one.
                        config[key] ?= {}
                        config[key] = _.extend value, config[key]

                    # Build them in series so we can debug which is which.
                    async.eachSeries Object.keys(json), (key, cb) ->
                        byggir.widget [ dir, 'tmp/sources', folder, key ].join('/'), null, null, (err, js) ->
                            return cb err if err
                            
                            # Since we are writing the result into a file, make sure that the file begins with an exception if read directly.
                            js = 'new Error(\'This widget cannot be called directly\');\n' + js

                            path = [ dir, 'tmp/build', key + '.js' ].join('/')
                            winston.info 'Writing ' + path.bold
                            fs.writeFile path, js, cb
                    , cb

                ], cb

        return cb '`widgets` is not an Array of paths' unless widgets and widgets instanceof Array
        for path in widgets
            return cb '`widgets` is an Array of Strings only' if typeof path isnt 'string'
            if path.indexOf 'git://' is 0
                jobs.push process path, folder++

        # Run them jobs.
        async.parallel jobs, cb
    
    ], (err) ->
        throw err if err
        ready = yes
        winston.info 'Ready'.bold.green

        # Init new Director.js router.
        router = new director.http.Router routes(config)

    # Make our dispatcher part of connect.
    (req, res, next) ->
        # Just skip if we do not exist yet.
        return next() unless router
        # Use our router now.
        router.dispatch req, res, (err) ->
            next() if err