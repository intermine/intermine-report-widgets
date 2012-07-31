#!/usr/bin/env coffee

flatiron = require 'flatiron'
union    = require 'union'
connect  = require 'connect'
urlib    = require 'url'
fs       = require 'fs'
eco      = require 'eco'

# Read the config file.
config = JSON.parse fs.readFileSync './config.json'
if not config.service? or
    not config.service.port? or
        typeof config.service.port isnt 'number'
            throw 'You need to specify the `port` to use by the server in the `service` portion of the config file'

app = flatiron.app
app.use flatiron.plugins.http,
    'before': []
    'after':  []

app.start config.service.port, (err) ->
    throw err if err
    app.log.info "Listening on port #{app.server.address().port}".green if process.env.NODE_ENV isnt 'test'

# -------------------------------------------------------------------
# Eco templating.
app.use
    name: "eco-templating"
    attach: (options) ->
        app.eco = (path, data, cb) ->
            fs.readFile "./src/site/#{path}.eco", "utf8", (err, template) ->
                if err then cb err, {} else cb undefined, eco.render template, data

# -------------------------------------------------------------------
# List all available widgets.
app.router.path "/widgets", ->
    @get ->
        app.log.info "Root"

        @res.writeHead 200, "content-type": "application/json"
        @res.write JSON.stringify config.widgets
        @res.end()