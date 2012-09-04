#!/usr/bin/env coffee

require 'colors'
fs        = require 'fs'
winston   = require 'winston'

eco       = require 'eco'
cs        = require 'coffee-script'

uglifyJs  = require 'uglify-js'
cleancss  = require 'clean-css'
parserlib = require 'parserlib'
prefix    = require 'prefix-css-node'

# Precompile all widgets in a directory for InterMine use.
exports.all = ->
    # TODO: Go through the source directory.
    return fs.readdir './widgets', (err, files) ->
        throw err if err
        for file in files
            fs.stat "./widgets/#{file}", (err, stat) ->
                throw err if err
                # If it is a directory...
                if stat and stat.isDirectory()
                    # The id of the widget.
                    widgetId = file
                    winston.info "Working on `#{widgetId}`".blue

                    # Load the presenter .coffee file.
                    winston.info "Loading presenter .coffee file".grey
                    path = "./widgets/#{widgetId}/presenter.coffee"
                    try
                        isFine = fs.lstatSync path
                    catch e
                        return winston.info "Widget `#{widgetId}` is misconfigured, does not have a presenter defined".red

                    if isFine?
                        # Create a signature.
                        winston.info "Creating signature".grey
                        sig = """
                        /**
                         *      _/_/_/  _/      _/   
                         *       _/    _/_/  _/_/     InterMine Report Widget
                         *      _/    _/  _/  _/      (C) 2012 InterMine, University of Cambridge.
                         *     _/    _/      _/       http://intermine.org
                         *  _/_/_/  _/      _/
                         *
                         *  Name: #@+NAME
                         *  Author: #@+AUTHOR
                         *  Description: #@+DESCRIPTION
                         *  Version: #@+VERSION
                         *  Generated: #{(new Date()).toUTCString()}
                         */\n
                        """

                        winston.info "Compiling presenter .coffee file".grey
                        # Bare-ly compile the presenter.
                        try
                            js = [
                                sig
                                "(function() {\nvar root = this;\n\n  /**#@+ the presenter */"
                                ("  #{line}" for line in cs.compile(fs.readFileSync(path, "utf-8"), bare: "on").split("\n")).join("\n")
                            ]
                        catch e
                            return winston.info "Widget `#{widgetId}` is misconfigured in presenter.coffee".red

                        # Config placeholder.
                        js.push "  /**#@+ the config */\n  var config = #@+CONFIG;\n"

                        # Compile eco templates.
                        winston.info "Walking the templates".grey
                        walk "./widgets/#{widgetId}", /\.eco$/, (err, templates) =>
                            if err
                                return winston.info "Widget `#{widgetId}` is misconfigured, problem loading templates".red
                            else
                                tml = [ "  /**#@+ the templates */\n  var templates = {};" ]
                                for file in templates
                                    name = file.split('/').pop()[0...-4]
                                    winston.info "Compiling .eco template `#{name}`".grey
                                    
                                    try
                                        template = eco.precompile fs.readFileSync file, "utf-8"
                                    catch e
                                        return winston.info "Widget `#{widgetId}` is misconfigured, problem loading templates".red
                                    
                                    name = file.split('/').pop()[0...-4]
                                    winston.info "Minifying .js template `#{name}`".grey
                                    tml.push '  ' + minify("templates['#{name}'] = #{template}") + ';'

                                js.push tml.join "\n"

                                # Do we have a custom CSS file?
                                path = "./widgets/#{widgetId}/style.css"
                                try
                                    exists = fs.lstatSync path
                                catch e
                                if exists
                                    winston.info "Adding custom .css file".grey
                                    # Read the file.
                                    css = fs.readFileSync path, "utf-8"
                                    # Prefix CSS selectors with a callback id.
                                    css = prefix.css css, 'div#w#@+CALLBACK'
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
                                js.push "  root.intermine.temp.widgets['#@+CALLBACK'] = new Widget(config, templates);\n\n}).call(this);"

                                # Write the result.
                                write "./build/#{widgetId}.js", js.join "\n"

                                winston.info "Writing .js package".green

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

# Append to existing file.
write = (path, text, mode = "w") ->
    fs.open path, mode, 0o0666, (err, id) ->
        throw err if err
        fs.write id, text, null, "utf8"