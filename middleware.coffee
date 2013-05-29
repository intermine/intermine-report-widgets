#!/usr/bin/env coffee
urlib    = require 'url'
fs       = require 'fs'
director = require 'director'
async    = require 'async'
wrench   = require 'wrench'
winston  = require 'winston'
{ exec } = require 'child_process'

winston.cli()

# Require builder with out logger.
build = require './build.coffee'

# We are here.
dir = __dirname

# Read the config file.
config = (cb) ->
    fs.readFile './example/config.json', 'utf-8', (err, data) ->
        return cb err if err
        
        try
            data = JSON.parse data
        catch err
            return cb err

        # Validate that the config has widgets that are accessible by us.
        for id in Object.keys data.widgets
            if encodeURIComponent(id) isnt id
                return cb "Widget id `#{id}` is not a valid name and cannot be used, use encodeURIComponent() to check"

        # Cache & return.
        cb null, data

# Init new Director.js router.
router = new director.http.Router

    # List all available widgets.
    '/widget/report':
        'get': ->
            # Do we have a callback?
            if (callback = urlib.parse(@req.url, true).query?.callback)
                # Only provide deps for each widget much like InterMine.
                config (err, data) =>
                    if err
                        @res.writeHead 500, "content-type": "application/json"
                        @res.write JSON.stringify 'message': err
                        @res.end()
                    else
                        out = {}
                        for widget, stuff of data.widgets
                            out[widget] = stuff.dependencies

                        @res.writeHead 200, "content-type": "application/javascript;charset=utf-8"
                        @res.write "#{callback}(#{JSON.stringify(out)});"
                        @res.end()
            else
                @res.writeHead 500, "content-type": "application/json"
                @res.write JSON.stringify 'message': 'Provide a `callback` parameter so we can respond with JSONP'
                @res.end()

    '/widget/report/:widgetId':
        'get': (widgetId) ->
            # Do we have a callback?
            if (callback = urlib.parse(@req.url, true).query?.callback)
                config (err, data) =>
                    if err
                        @res.writeHead 500, "content-type": "application/json"
                        @res.write JSON.stringify 'message': err
                        @res.end()
                    else
                        # Do we know this one?
                        widget = data.widgets[widgetId]
                        if widget?
                            # Run the precompile.
                            build.single widgetId, callback, widget, (err, js) =>
                                if err
                                    @res.writeHead 500, 'content-type': 'application/json'
                                    @res.write JSON.stringify 'message': err
                                    @res.end()
                                else
                                    # Write the output.
                                    @res.writeHead 200, "content-type": "application/javascript;charset=utf-8"
                                    @res.write js
                                    @res.end()
                        else
                            @res.writeHead 400, "content-type": "application/json"
                            @res.write JSON.stringify 'message': "Unknown widget `#{widgetId}`"
                            @res.end()
            else
                @res.writeHead 400, "content-type": "application/json"
                @res.write JSON.stringify 'message': 'Callback not provided'
                @res.end()

# Download a Git repo off the net.
download = (path, folder) ->
    (cb) ->
        exec "cd #{dir}/tmp/sources && git clone --depth 1 #{path} #{folder}", (err, stdout, stderr) ->
            cb err

# Copy a folder locally.
copy = (path, folder) ->

module.exports = (opts) ->
    { widgets, config } = opts

    # This will take a while.
    ready = no

    # Make sure we are clean.
    async.waterfall [ (cb) ->
        winston.info 'Remove temp directory'
        wrench.rmdirRecursive dir + '/tmp', true, cb

    # Create the build folders for the widgets.
    (cb) ->
        winston.info 'Create temp directory'
        async.eachSeries [ dir + '/tmp/sources', dir + '/tmp/build' ], (path, cb) ->
            try
                wrench.mkdirSyncRecursive path, 0o0777
                cb null
            catch err
                cb err
        , cb

    # Fetch all of the widgets sources.
    (cb) ->
        winston.info 'Fetch widgets sources'
        # Jobs to run loading all the widget sources.
        jobs = [] ; folder = 0

        return cb '`widgets` is not an Array of paths' unless widgets and widgets instanceof Array
        for path in widgets
            return cb '`widgets` is an Array of Strings only' if typeof path isnt 'string'
            if path.indexOf 'git://' is 0
                jobs.push download path, folder++

        # Run them jobs.
        async.parallel jobs, cb

    # Build all of them.
    (cb) ->
        # For each source folder...
        # ...read the config file
        # ...run a build on the widget

    # Validate & merge the configs.
    
    ], (err) ->
        throw err if err
        ready = yes

    # Make our dispatcher part of connect.
    (req, res, next) ->
        router.dispatch req, res, (err) ->
            next() if err