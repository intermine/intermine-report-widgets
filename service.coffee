#!/usr/bin/env coffee

flatiron   = require 'flatiron'
union      = require 'union'
connect    = require 'connect'
urlib      = require 'url'
winston    = require 'winston'

fs         = require 'fs'

precompile = require './precompile.coffee'

# Read the config file.
config = JSON.parse fs.readFileSync './config.json'

# Validate that the config has widgets that are accessible by us.
for id, _ of config.widgets
    if encodeURIComponent(id) isnt id
        return winston.info "Widget id `{id}` is not a valid name and cannot be used, use encodeURIComponent() to check".red

app = flatiron.app
app.use flatiron.plugins.http,
    'before': [
        connect.static './public'
    ]
    'after':  []

app.start process.env.PORT, (err) ->
    throw err if err
    winston.info "Listening on port #{app.server.address().port}".green

# -------------------------------------------------------------------
# List all available widgets.
app.router.path "/widget/report", ->
    @get ->
        winston.info "Get a listing of available widgets"

        # Do we have a callback?
        callback = @req.query?.callback
        if callback?
            # Only provide deps for each widget much like InterMine.
            out = {}
            for widget, stuff of config.widgets
                out[widget] = stuff.dependencies

            @res.writeHead 200, "content-type": "application/javascript;charset=utf-8"
            @res.write "#{callback}(#{JSON.stringify(out)});"
            @res.end()
        else
            @res.writeHead 500, "content-type": "application/json"
            @res.write JSON.stringify 'message': 'Provide a `callback` parameter so we can respond with JSONP'
            @res.end()

app.router.path "/widget/report/:widgetId", ->
    @get (widgetId) ->
        winston.info "Get widget " + widgetId.bold

        # Do we have a callback?
        callback = @req.query?.callback
        if callback?
            # Do we know this one?
            widget = config.widgets[widgetId]
            if widget?
                # Run the precompile.
                precompile.single widgetId, callback, widget, (err, js) =>
                    if err
                        # Catch all errors into logs and JSON messages.
                        winston.info err.red

                        @res.writeHead 500, 'content-type': 'application/json'
                        @res.write JSON.stringify 'message': err
                        @res.end()
                    else
                        # Write the output.
                        winston.info "Returning .js package".green
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