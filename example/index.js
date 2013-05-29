#!/usr/bin/env node
var app, connect, http, middleware;

require('coffee-script');
http = require('http');
connect = require('connect');
middleware = require('../middleware.coffee');

app = connect().use(middleware({
    'widgets': ['git://github.com/intermine/demo-report-widgets.git'],
    'config': __dirname + '/config.json'
})).use(connect["static"](__dirname + '/public'));

http.createServer(app).listen(process.env.PORT);