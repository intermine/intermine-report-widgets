#!/usr/bin/env coffee
fs        = require 'fs'
eco       = require 'eco'
cs        = require 'coffee-script'
stylus    = require 'stylus'
uglifyJs  = require 'uglify-js'
cleanCss  = require 'clean-css'
parserlib = require 'parserlib'
prefix    = require 'prefix-css-node'
async     = require 'async'
{ exec }  = require 'child_process'

###
Precompile a single widget.
@param {string} widgetId A URL-valid widgetId.
@param {string} callback A string used to tell client that THIS widget has arrived.
@param {dict} config Configuration to be injected into the widget.
@param {fn} output Expects two parameters, 1. error string 2. JS string with the precompiled widget.
###
single = (widgetId, callback, config, output) ->

    # Does the dir actually exist?
    async.waterfall [ (cb) ->
        path = "./widgets/#{widgetId}/"
        fs.stat path, (err, stats) ->
            if not err and stats.isDirectory()
                cb null, path
            else
                cb "Widget path `#{widgetId}` does not exist"

    # Read all the files in the directory and categorize them.
    (dir, cb) ->
        fs.readdir dir, (err, list) ->
            return cb err if err

            log.data 'Reading source files'

            # Check each entry.
            check = (entry) ->
                (cb) ->
                    fs.stat (path = dir + '/' + entry), (err, stats) ->
                        return cb err if err or not stats
                        return cb "A directory in #{path} is not currently supported" if stats.isDirectory()
                        cb null, entry

            # Check them all at once.
            async.parallel ( check entry for entry in list ), (err, files) ->
                return cb err if err

                # Patterns for matching types.
                patterns = [ /^presenter\.(coffee|js|ls)$/, /^style\.styl|css$/, /\.eco$/ ]

                # Which is it?
                results = []
                for file in files then do (file) ->
                    for i, pattern of patterns
                        if file.match pattern
                            results[i] ?= []
                            return results[i].push file

                cb null, dir, results

    # Compile the files.
    (dir, [ presenter, style, templates ], cb) ->
        # Handle the presenter.
        async.parallel [ (cb) ->
            return cb 'Presenter either not provided or provided more than once' if not presenter or presenter.length isnt 1

            log.data 'Processing presenter'

            fs.readFile dir + (file = presenter[0]), 'utf-8', (err, src) ->
                return cb err if err

                # Which filetype?
                switch file.split('.').pop()
                    # A JavaScript presenter.
                    when 'js'
                        cb null, [ 'presenter', src ]
                    
                    # A CoffeeScript presenter needs to be bare-ly compiled first.
                    when 'coffee'
                        try
                            js = cs.compile src, 'bare': 'on'
                            cb null, [ 'presenter', js ]
                        catch err
                            cb err

                    # LiveScript then.
                    when 'ls'
                        exec './node_modules/.bin/lsc -bpc < ' + dir + file, (err, stdout, stderr) ->
                            return cb (''+err).replace('\n', '') if err
                            return cb stderr if stderr
                            cb null, [ 'presenter', stdout ]

        # The stylesheet.
        (cb) ->
            return cb null, [ 'style', null ] unless style
            return cb 'Only one stylesheet has to be defined' if style.length isnt 1

            log.data 'Processing stylesheet'

            fs.readFile dir + '/' + (file = style[0]), 'utf-8', (err, src) ->
                return cb err if err

                pack = (css) ->
                    # Prefix CSS selectors with a callback id.
                    css = prefix.css css, "div#w#{callback}"
                    # Escape all single quotes, minify & return.
                    cb null, [ 'style', minify(css.replace(/\'/g, "\\'"), 'css') ]

                # Which filetype?
                switch file.split('.').pop()
                    # A CSS file.
                    when 'css'
                        pack src
                    
                    # A Stylus file.
                    when 'styl'
                        stylus.render src, (err, css) ->
                            return cb err if err
                            pack css

        # Them templates.
        (cb) ->
            return cb null, [ 'templates', null ] unless templates

            log.data 'Processing templates'

            process = (file) ->
                (cb) ->
                    # Read the file.
                    fs.readFile dir + '/' + file, 'utf-8', (err, src) ->
                        return cb err if err

                        # Precompile template.
                        template = eco.precompile src

                        # Minify.
                        cb null, minify("templates['#{file[0...-4]}'] = #{template}") + ';'

            # Process all templates in parallel.
            async.parallel ( process file for file in templates  ), (err, results) ->
                return cb err if err
                cb null, [ 'templates', results ]

        ], (err, results) ->
            return cb err if err
            
            # Expand the data on us.
            ( @[key] = value for [ key, value ] in results )

            js = []

            # The signature.
            js.push """
                /**
                 *      _/_/_/  _/      _/   
                 *       _/    _/_/  _/_/     InterMine Report Widget
                 *      _/    _/  _/  _/      (C) 2013 InterMine, University of Cambridge.
                 *     _/    _/      _/       http://intermine.org
                 *  _/_/_/  _/      _/
                 *
                 *  Name: #{config.title}
                 *  Author: #{config.author}
                 *  Description: #{config.description}
                 *  Version: #{config.version}
                 *  Generated: #{(new Date()).toUTCString()}
                 */
                (function() {
                  var root = this;

                  /**#@+ the presenter */\n
                """

            # The presenter.
            js.push ("  #{line}" for line in @presenter.split('\n') ).join('\n')

            # Tack on any config.
            log.data 'Appending config'
            cfg = JSON.stringify(config.config) or '{}'
            # Leave out the quotes around the config (from stringify...).
            if cfg[0] is '"' and cfg[cfg.length - 1] is '"' then cfg = cfg[1...-1]
            js.push "  /**#@+ the config */\n  var config = #{cfg};\n"

            # Add on the templates.
            if @templates and @templates.length isnt 0
                tml = [ "  /**#@+ the templates */\n  var templates = {};" ]
                js.push (tml.concat ( "  #{line}" for line in @templates )).join '\n'

            # Embed the stylesheet.
            if @style
                js.push """
                    \n  /**#@+ css */
                      var style = document.createElement('style');
                      style.type = 'text/css';
                      style.innerHTML = '#{@style}';
                      document.head.appendChild(style);
                    """

            # Finally add us to the browser `cache` under the callback id.
            js.push """
                \n  /**#@+ callback */
                  (function() {
                    var parent, part, _i, _len, _ref;
                    parent = this;
                    _ref = 'intermine.temp.widgets'.split('.');
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                      part = _ref[_i];
                      parent = parent[part] = parent[part] || {};
                    }
                  }).call(root);
                  root.intermine.temp.widgets['#{callback}'] = new Widget(config, templates);\n\n}).call(this);
                """

            cb null, js.join '\n'

    ], output

# Precompile all widgets in a directory for InterMine use.
all = ->
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
                            log.error "Widget id `#{widgetId}` is not a valid name and cannot be used, use encodeURIComponent() to check".red
                        else
                            log.debug "Precompiling widget " + widgetId.bold

                            # Create the placeholders.
                            config =
                                'title':       '#@+TITLE'
                                'author':      '#@+AUTHOR'
                                'description': '#@+DESCRIPTION'
                                'version':     '#@+VERSION'
                                'config':      '#@+CONFIG'
                            callback         = '#@+CALLBACK'

                            # Run the precompile.
                            single widgetId, callback, config, (err, js) ->
                                # Catch all errors into messages.
                                if err
                                    log.error err.red
                                else
                                    # Since we are writing the result into a file, make sure that the file begins with an exception if read directly.
                                    (js = js.split("\n")).splice 0, 0, 'new Error(\'This widget cannot be called directly\');\n'

                                    # Write the result.
                                    write "./build/#{widgetId}.js", js.join "\n"
                                    log.data "Writing .js package".green

                                # Run again.
                                done()

# Export the precompilers after setting the logger.
module.exports = (@log) ->
    'all':    all
    'single': single

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