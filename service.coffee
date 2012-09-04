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
if not config.service? or
    not config.service.port? or
        typeof config.service.port isnt 'number'
            return winston.info 'You need to specify the `port` to use by the server in the `service` portion of the config file'.red

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

app.start config.service.port, (err) ->
    throw err if err
    winston.info "Listening on port #{app.server.address().port}".green

# -------------------------------------------------------------------
# List all available widgets.
app.router.path "/widgets", ->
    @get ->
        winston.info "Get a listing of available widgets"

        @res.writeHead 200, "content-type": "application/json"
        @res.write JSON.stringify config.widgets
        @res.end()

app.router.path "/widget/:callback/:widgetId", ->
    @get (callback, widgetId) ->
        winston.info "Get widget " + widgetId.bold

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