#!/usr/bin/env bash
set -e
clear
./node_modules/.bin/coffee -c service.coffee
node service.js