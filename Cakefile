#!./node_modules/.bin/cake
winston = require 'winston'
winston.cli()

build = require('./build.coffee')(winston)

task 'start', 'compile client and start the service', (options) ->
    build.client ->
        require './service.coffee'

task 'client', 'compile client', (options) ->
    build.client()

task 'precompile', 'precompile widgets', (options) ->
    build.all()