#!./node_modules/.bin/cake

fs = require 'fs'
cs = require 'coffee-script'

task 'start', 'compile client and start the service', (options) ->
    './node_modules/.bin/coffee -c service.coffee'

"""
'./node_modules/.bin/coffee -o public/js -c client.coffee'
"""
task 'client', 'compile client', (options) ->
    write './public/js/client.js', cs.compile fs.readFileSync 'client.coffee', 'utf-8'

task 'precompile', 'precompile widgets', (options) ->
    console.log 'precompile'

# Append to existing file.
write = (path, text, mode = "w") ->
    fs.open path, mode, 0o0666, (err, id) ->
        throw err if err
        fs.write id, text, null, "utf8"