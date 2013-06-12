# InterMine FatApps Middleware (Node.js)

A [Node.js](http://nodejs.org/) reference implementation of a **middleware** for loading and rendering Fat Apps (previously called Report Widgets).

![image](https://github.com/intermine/intermine-fatapps-middleware/raw/master/example/example.png)

## Quickstart

```bash
$ npm install
$ PORT=1234 node example/index.js
```

And then visit [127.0.0.1:1234](http://127.0.0.1:1234).

## [Connect](http://www.senchalabs.org/connect/) Middleware

```coffeescript
#!/usr/bin/env coffee
http    = require 'http'
connect = require 'connect'

middleware = require '../middleware.coffee'

app = connect()
.use(middleware
    'apps': [
        'git://github.com/intermine/demo-fatapps.git'
    ]
    'config': __dirname + '/config.json'
)
.use(connect.static(__dirname + '/public'))

http.createServer(app).listen process.env.PORT
```

The middleware accepts two params. One, `apps` is an Array of paths to app sources. This can be any of the following:

1. Git paths on the net like: `git://github.com/intermine/demo-fatapps.git`
1. Local file paths: `/home/dev/demo-fatapps`

The other parameter, `config`, represents the configuration you want merged with the config from the apps sources. This can be one of the following:

1. Local file path: `/home/dev/demo-service/config.json`
1. A plain JS Object.

Only the first parameter is required.