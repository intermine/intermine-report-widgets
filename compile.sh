#!/usr/bin/env bash
set -e
clear
# Compile the client into public vendor dir
./node_modules/.bin/coffee -o public/js -c client.coffee
# Compile the service & run it
./node_modules/.bin/coffee -c service.coffee
node service.js