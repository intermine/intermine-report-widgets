#!/usr/bin/env node
require('coffee-script');

(require('./build.coffee')()).client(function() {
    require('./service.coffee');
});