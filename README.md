# Report Widgets Service Reference

A node.js reference implementation of a service for loading and rendering Report Widgets (Displayers).

## Run

Make sure [node.js](https://github.com/joyent/node/wiki/Installation) is installed.

```bash
$ npm install -d
$ ./service.sh
```

## Requirements

1. Compile *templates* into their JS form and make them accessible within the context of the widget only.
2. Make use of [intermine-api-loader](https://github.com/radekstepan/intermine-api-loader) to efficiently load resources and libs only when needed.
3. Make *CSS* available only in the context of the widget, perhaps by prefixing each declaration with a dynamic *widget id* using [prefix-css-node](https://github.com/radekstepan/prefix-css-node).
4. Respond to the client with a list of *resources* that need to be loaded beforing rendering the widget.
5. Each widget consists of:
  1. One [CoffeeScript](http://coffeescript.org/) *presenter* containing the logic getting data from the *model* using [imjs](https://github.com/alexkalderimis/imjs).
  2. A number of [eco](https://github.com/sstephenson/eco/) *templates* precompiled.
  3. One *CSS* file specifically for the widget.
  4. Any extra *config* dynamically populated for the widget to consume. This could be the mine the Widget is to take data from or extra flags that specialize an otherwise generic Widget.
  5. Optional number of requirements (CSS, JS), loaded from the [CDN](https://github.com/intermine/CDN).
6. All of the previous are configured by the user.
7. *Data* requests are done from within the widget to speed up their initial loading.
8. Files are served as UTF-8.

### Optional

* Cache resources by, for example, not packaging resources on the fly but doing so on service startup.
* Allow the use of [LESS](http://lesscss.org/) instead of CSS.
* Check for the presence of `Displayer.prototype.render` and `Displayer.prototype.initialize` in the compiled *presenter*.
* Validate that callbacks are valid JavaScript identifiers. Should not be needed as we will use API loader and generate these automagically.

## Example

An example configuration for a Widget can be seen below:

```json
{
    "publications-displayer": {
        "title": "Publications for Gene",
        "description": "Shows a list of publications for a specific gene",
        "version": "0.0.1",
        "dependencies": [
            {
                "name": "jQuery",
                "path": "http://cdn.intermine.org/js/json3/3.2.2/json3.min.js",
                "type": "js"
            },
            {
                "name": "Backbone",
                "path": "http://cdn.intermine.org/js/backbone.js/0.9.2/backbone-min.js",
                "type": "js",
                "wait": true
            }
        ],
        "config": {
            "mine": "http://beta.flymine.org/beta"
        }
    }
}
```