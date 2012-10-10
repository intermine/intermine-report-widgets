#!/usr/bin/env coffee

require 'colors'
fs        = require 'fs'
winston   = require 'winston'

eco       = require 'eco'
cs        = require 'coffee-script'
stylus    = require 'stylus'

uglifyJs  = require 'uglify-js'
cleanCss  = require 'clean-css'
parserlib = require 'parserlib'
prefix    = require 'prefix-css-node'

###
Precompile a single widget.
@param {string} widgetId A URL-valid widgetId.
@param {string} callback A string used to tell client that THIS widget has arrived.
@param {dict} config Configuration to be injected into the widget.
@param {fn} output Expects two parameters, 1. error string 2. JS string with the precompiled widget.
###
exports.single = (widgetId, callback, config, output) ->
    winston.info "Working on `#{widgetId}`".blue

    # Does the dir actually exist?
    path = "./widgets/#{widgetId}/"
    try
        fs.lstatSync path
    catch e
        return output "Widget path `#{widgetId}` does not exist"

    # Load the presenter .coffee file.
    winston.info 'Loading presenter .coffee file'.grey
    path += 'presenter.coffee'
    try
        isFine = fs.lstatSync path
    catch e
        return output "Widget `#{widgetId}` is misconfigured, does not have a presenter defined"

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
         *  Name: #{config.title}
         *  Author: #{config.author}
         *  Description: #{config.description}
         *  Version: #{config.version}
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
            return output "Widget `#{widgetId}` is misconfigured in presenter.coffee"

        # Tack on any config.
        winston.info "Appending config".grey
        cfg = JSON.stringify(config.config) or '{}'
        # Leave out the quotes around the config (from stringify...).
        if cfg[0] is '"' and cfg[cfg.length - 1] is '"' then cfg = cfg[1...-1]
        js.push "  /**#@+ the config */\n  var config = #{cfg};\n"

        # Compile eco templates.
        winston.info "Walking the templates".grey
        walk "./widgets/#{widgetId}", /\.eco$/, (err, templates) =>
            if err
                return output "Widget `#{widgetId}` is misconfigured, problem loading templates"
            else
                tml = [ "  /**#@+ the templates */\n  var templates = {};" ]
                for file in templates
                    name = file.split('/').pop()[0...-4]
                    winston.info "Compiling .eco template `#{name}`".grey
                    
                    try
                        template = eco.precompile fs.readFileSync file, "utf-8"
                    catch e
                        return output "Widget `#{widgetId}` is misconfigured, problem loading templates"
                    
                    name = file.split('/').pop()[0...-4]
                    winston.info "Minifying .js template `#{name}`".grey
                    tml.push '  ' + minify("templates['#{name}'] = #{template}") + ';'

                js.push tml.join "\n"

                # Stylus or CSS?
                ( (cb) ->                    
                    # Do we have a custom Stylus file?
                    path = "./widgets/#{widgetId}/style.styl"
                    try
                        exists = fs.lstatSync path
                    catch e
                    if exists
                        # Read the file.
                        styl = fs.readFileSync path, "utf-8"

                        # Is it not empty?
                        if styl.length isnt 0
                            winston.info "Compiling custom .styl file".grey

                            stylus.render styl
                            , (err, css) ->
                                if err
                                    ( winston.info line.red for line in err.message.split("\n") )
                                    output "Widget `#{widgetId}` has Stylus error"
                                else
                                    cb css
                        else
                            cb null
                    else
                        # Do we have a custom CSS file?
                        path = "./widgets/#{widgetId}/style.css"
                        try
                            exists = fs.lstatSync path
                        catch e
                        if exists
                            # Read the file.
                            css = fs.readFileSync path, "utf-8"

                            cb css
                        else
                            cb null
                ) (css) ->
                    # Is it not empty?
                    if css.length isnt 0
                        winston.info "Adding custom .css file".grey

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

                    # Return the result.
                    output null, js.join "\n"

# Precompile all widgets in a directory for InterMine use.
exports.all = ->
    # Go through the source directory.
    fs.readdir './widgets', (err, files) ->
        throw err if err

        # Sync loop (so that messages from different widgets do not appear out of sync).
        do done = ->
            # Exit condition.
            if files.length isnt 0
                file = files.pop()

                fs.stat "./widgets/#{file}", (err, stat) ->
                    throw err if err
                    # If it is a directory...
                    if stat and stat.isDirectory()
                        # The id of the widget.
                        widgetId = file

                        # Valid name?
                        if encodeURIComponent(widgetId) isnt widgetId
                            winston.info "Widget id `#{widgetId}` is not a valid name and cannot be used, use encodeURIComponent() to check".red
                        else
                            # Create the placeholders.
                            config =
                                'title':       '#@+TITLE'
                                'author':      '#@+AUTHOR'
                                'description': '#@+DESCRIPTION'
                                'version':     '#@+VERSION'
                                'config':      '#@+CONFIG'
                            callback         = '#@+CALLBACK'

                            # Run the precompile.
                            exports.single widgetId, callback, config, (err, js) ->
                                # Catch all errors into messages.
                                if err
                                    winston.info err.red
                                else
                                    # Since we are writing the result into a file, make sure that the file begins with an exception if read directly.
                                    (js = js.split("\n")).splice 0, 0, 'new Error(\'This widget cannot be called directly\');\n'

                                    # Write the result.
                                    write "./build/#{widgetId}.js", js.join "\n"
                                    winston.info "Writing .js package".green

                                    # Run again.
                                    done()

# Async walk a directory recursively to return a list of files in a callback matching a particular file filter.
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
            cleanCss.process input

# Append to existing file.
write = (path, text, mode = "w") ->
    fs.open path, mode, 0o0666, (err, id) ->
        throw err if err
        fs.write id, text, null, "utf8"