# InterMine Report Widgets (Node.js)

A [Node.js](http://nodejs.org/) reference implementation of a **service** and a **client** for loading and rendering Report Widgets (previously called Displayers).

![image](https://github.com/intermine/intermine-report-widgets/raw/master/example.png)

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
    'widgets': [
        'git://github.com/intermine/demo-report-widgets.git'
    ]
    'config': __dirname + '/config.json'
)
.use(connect.static(__dirname + '/public'))

http.createServer(app).listen process.env.PORT
```

The middleware accepts two params. One, `widgets` is an Array of paths to widgets sources. This can be any of the following:

1. Git paths on the net like: `git://github.com/intermine/demo-report-widgets.git`
1. Local file paths: `/home/dev/demo-report-widgets`

The other parameter, `config`, represents the configuration you want merged with the config from the widgets sources. This can be one of the following:

1. Local file path: `/home/dev/demo-service/config.json`
1. A plain JS Object.

Only the first parameter is required.