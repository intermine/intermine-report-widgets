# InterMine Report Widgets Service Reference Implementation

A [node.js](http://nodejs.org/) reference implementation of a **service** and a **client** for loading and rendering Report Widgets (previously called Displayers).

![image](https://github.com/intermine/intermine-report-widgets/raw/master/example.png)

## [Develop a Widget](http://intermine.readthedocs.org/en/latest/embedding/report-widgets/?highlight=report%20widget#develop-a-widget)

## Quickstart

Make sure [node](https://github.com/joyent/node/wiki/Installation) is installed.

```bash
$ npm install
$ ./node_modules/.bin/cake [task]
```

Where `[task]` is one of:

1. `start`: compile client code and start service service widgets (demo mode); you can decide which port to start on by setting the environment variable `port`
1. `client`: compile client code to `./public/js/client.js`
1. `precompile`: precompile widgets so that they can be served by InterMine into `./build` directory

Remember that by default the service demo is connecting to whatever page you are looking at as seen here:

```javascript
var widgets = new intermine.reportWidgets(document.location.href);
```

If you want to see Growl-like notifications in your OS on specific events, install [node-growl](https://github.com/visionmedia/node-growl).

### On the client

The following snippet shows how one loads a specific widget on a page:

```javascript
// give us report widgets from a specific service in a callback `widgets`
intermine.load('report-widgets', 'http://127.0.0.1:1119', function(widgets) {
    // now load a specific widget and place it in a target element passing it extra config.
    widgets.load('publications-displayer', '#publications', { 'symbol': 'zen' });
});
```

The service does not cache the packaged widgets so that changes can be propagated in real time. There are two URLs that the service responds to:

<dl>
    <dt>/widgets</dt>
    <dd>returns a JSON representation of all widgets configured in <code>config.json</code></dd>
    <dt>/widget/[CALLBACK_ID]/[WIDGET_ID]</dt>
    <dd>returns the widget in a JavaScript package with a callback</dd>
</dl>

## [Files](https://github.com/intermine/intermine-report-widgets/blob/master/docs/FILES.md)

## [Requirements](https://github.com/intermine/intermine-report-widgets/blob/master/docs/REQUIREMENTS.md)

## [Java Systems](https://github.com/intermine/intermine-report-widgets/blob/master/docs/JAVA.md)