#!/usr/bin/env coffee

flatiron  = require 'flatiron'
union     = require 'union'
connect   = require 'connect'
urlib     = require 'url'
fs        = require 'fs'
eco       = require 'eco'
cs        = require 'coffee-script'
uglifyJs  = require 'uglify-js'
cleancss  = require 'clean-css'
parserlib = require 'parserlib'
prefix    = require 'prefix-css-node'

# Read the config file.
config = JSON.parse fs.readFileSync './config.json'
if not config.service? or
    not config.service.port? or
        typeof config.service.port isnt 'number'
            throw 'You need to specify the `port` to use by the server in the `service` portion of the config file'

# Validate that the config has widgets that are accessible by us.
for id, _ of config.widgets
    if encodeURIComponent(id) isnt id
        throw "Widget id `{id}` is not a valid name and cannot be used, use encodeURIComponent() to check"

app = flatiron.app
app.use flatiron.plugins.http,
    'before': [
        connect.static './public'
    ]
    'after':  []

app.start config.service.port, (err) ->
    throw err if err
    app.log.info "Listening on port #{app.server.address().port}".green if process.env.NODE_ENV isnt 'test'

# -------------------------------------------------------------------
# List all available widgets.
app.router.path "/widgets", ->
    @get ->
        app.log.info "Get a listing of available widgets"

        @res.writeHead 200, "content-type": "application/json"
        @res.write JSON.stringify config.widgets
        @res.end()

app.router.path "/widget/:callback/:widgetId", ->
    @get (callback, widgetId) ->
        app.log.info "Get widget " + widgetId.bold

        # Do we know this one?
        widget = config.widgets[widgetId]
        if widget?
            # Load the presenter .coffee file.
            app.log.info "Loading presenter .coffee file".grey
            path = "./widgets/#{widgetId}/presenter.coffee"
            try
                isFine = fs.lstatSync path
            catch e
                @res.writeHead 500, "content-type": "application/json"
                @res.write JSON.stringify 'message': "Widget `#{widgetId}` is misconfigured, does not have a presenter defined"
                @res.end()

            if isFine?
                # Create a signature.
                app.log.info "Creating signature".grey
                sig = """
                /**
                 *      _/_/_/  _/      _/   
                 *       _/    _/_/  _/_/     InterMine Report Widget
                 *      _/    _/  _/  _/      (C) 2012 InterMine, University of Cambridge.
                 *     _/    _/      _/       http://intermine.org
                 *  _/_/_/  _/      _/
                 *
                 *  Name: #{widget.title}
                 *  Author: #{widget.author}
                 *  Description: #{widget.description}
                 *  Version: #{widget.version}
                 *  Generated: #{(new Date()).toUTCString()}
                 */\n
                """

                app.log.info "Compiling presenter .coffee file".grey
                # Bare-ly compile the presenter.
                try
                    js = [
                        sig
                        "(function() {\nvar root = this;\n\n  /**#@+ the presenter */"
                        ("  #{line}" for line in cs.compile(fs.readFileSync(path, "utf-8"), bare: "on").split("\n")).join("\n")
                    ]
                catch e
                    @res.writeHead 500, "content-type": "application/json"
                    @res.write JSON.stringify 'message': "Widget `#{widgetId}` is misconfigured in presenter.coffee"
                    @res.end()
                    return

                # Tack on any config.
                app.log.info "Appending config".grey
                cfg = JSON.stringify(widget.config) or '{}'
                js.push "  /**#@+ the config */\n  var config = #{cfg};\n"

                # Compile eco templates.
                app.log.info "Walking the templates".grey
                walk "./widgets/#{widgetId}", /\.eco$/, (err, templates) =>
                    if err
                        @res.writeHead 500, "content-type": "application/json"
                        @res.write JSON.stringify 'message': "Widget `#{widgetId}` is misconfigured, problem loading templates"
                        @res.end()
                    else
                        tml = [ "  /**#@+ the templates */\n  var templates = {};" ]
                        for file in templates
                            name = file.split('/').pop()[0...-4]
                            app.log.info "Compiling .eco template `#{name}`".grey
                            
                            try
                                template = eco.precompile fs.readFileSync file, "utf-8"
                            catch e
                                @res.writeHead 500, "content-type": "application/json"
                                @res.write JSON.stringify 'message': "Widget `#{widgetId}` is misconfigured, problem loading templates"
                                @res.end()
                                return
                            
                            name = file.split('/').pop()[0...-4]
                            app.log.info "Minifying .js template `#{name}`".grey
                            tml.push '  ' + minify("templates['#{name}'] = #{template}") + ';'

                        js.push tml.join "\n"

                        # Do we have a custom CSS file?
                        path = "./widgets/#{widgetId}/style.css"
                        try
                            exists = fs.lstatSync path
                        catch e
                        if exists
                            app.log.info "Adding custom .css file".grey
                            # Read the file.
                            css = fs.readFileSync path, "utf-8"
                            # Prefix CSS selectors with a callback id.
                            css = prefix.css css, "div#w#{callback}"
                            # Escape all single quotes.
                            css = css.replace /\'/g, "\\'"
                            # Minify
                            css = minify css, 'css'
                            # Embed.
                            exec = """
                            \n/**#@+ css */
                            var style = document.createElement('style');
                            style.type = 'text/css';
                            style.innerHTML = '#{css}';
                            document.head.appendChild(style);\n
                            """
                            js.push ("  #{line}" for line in exec.split("\n")).join("\n")

                        # Finally add us to the browser `cache` under the callback id.
                        cb = """
                        /**#@+ callback */
                        (function() {
                          var parent, part, _i, _len, _ref;
                          parent = this;
                          _ref = 'intermine.temp.widgets'.split('.');
                          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            part = _ref[_i];
                            parent = parent[part] = parent[part] || {};
                          }
                        }).call(root);
                        """
                        js.push ("  #{line}" for line in cb.split("\n")).join("\n")
                        js.push "  root.intermine.temp.widgets['#{callback}'] = new Widget(config, templates);\n\n}).call(this);"

                        app.log.info "Returning .js package".grey
                        @res.writeHead 200, "content-type": "application/javascript;charset=utf-8"
                        @res.write js.join "\n"
                        @res.end()
        else
            @res.writeHead 400, "content-type": "application/json"
            @res.write JSON.stringify 'message': "Unknown widget `#{widgetId}`"
            @res.end()

walk = (path, filter, callback) ->
    results = []
    # Read directory.
    fs.readdir path, (err, list) ->
        # Problems?
        return callback err if err
        
        # Get listing length.
        pending = list.length

        return callback null, results unless pending # Done already?
        
        # Traverse.
        list.forEach (file) ->
            # Form path
            file = "#{path}/#{file}"
            fs.stat file, (err, stat) ->
                # Subdirectory.
                if stat and stat.isDirectory()
                    walk file, filter, (err, res) ->
                        # Append result from sub.
                        results = results.concat(res)
                        callback null, results unless --pending # Done yet?
                # A file.
                else
                    if filter?
                        if file.match filter then results.push file
                    else
                        results.push file
                    callback null, results unless --pending # Done yet?

# Compress using `uglify-js` or `clean-css`.
minify = (input, type="js") ->
    switch type
        when 'js'
            jsp = uglifyJs.parser ; pro = uglifyJs.uglify
            pro.gen_code pro.ast_squeeze pro.ast_mangle jsp.parse input
        when 'css'
            cleancss.process input