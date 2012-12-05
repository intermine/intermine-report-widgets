#!/usr/bin/env node
var cs, fs, write;

fs = require('fs');
cs = require('coffee-script');

(function(path, text, mode) {
  if (mode == null) {
    mode = "w";
  }
  return fs.open(path, mode, 0x1b6, function(err, id) {
    if (err) {
      throw err;
    }
    return fs.write(id, text, null, "utf8");
  });
})('./public/js/client.js', cs.compile(fs.readFileSync('client.coffee', 'utf-8')));

require('./service.coffee');