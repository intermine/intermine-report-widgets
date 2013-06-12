#!/usr/bin/env node
var app, connect, http, middleware, byggir;

require('coffee-script');
http = require('http');
connect = require('connect');
middleware = require('../middleware.coffee');
byggir = require('../byggir.coffee');

// Do the client first.
byggir.client(function() {
    // Setup the Connect middleware.
    app = connect().use(middleware({
        'apps': ['git://github.com/intermine/demo-fatapps.git'],
        'config': __dirname + '/config.json'
    })).use(connect["static"](__dirname + '/public'));

    // Serve.
    http.createServer(app).listen(process.env.PORT);
});