# InterMine Report Widgets Service Reference Implementation

A node.js reference implementation of a service for loading and rendering Report Widgets (Displayers).

## Run

Make sure [node.js](https://github.com/joyent/node/wiki/Installation) is installed.

```bash
$ npm install -d
$ ./compile.sh
```

## Requirements

### Service

1. Compile *templates* into their JS form and make them accessible within the context of the widget only.
2. Make *CSS* available only in the context of the widget, perhaps by prefixing each declaration with a dynamic *widget id* using [prefix-css-node](https://github.com/radekstepan/prefix-css-node).
3. Respond to the client with a list of *resources* that need to be loaded beforing rendering the widget.
4. Each widget consists of:
  1. One [CoffeeScript](http://coffeescript.org/) *presenter* containing the logic getting data from the *model* using [imjs](https://github.com/alexkalderimis/imjs).
  2. A number of [eco](https://github.com/sstephenson/eco/) *templates* precompiled.
  3. One *CSS* file specifically for the widget.
  4. Any extra *config* dynamically populated for the widget to consume. This could be the mine the Widget is to take data from or extra flags that specialize an otherwise generic Widget.
  5. Optional number of requirements (CSS, JS), loaded from the [CDN](https://github.com/intermine/CDN).
5. All of the previous are configured by the user.
6. *Data* requests are done from within the widget to speed up their initial loading.
7. Files are served as UTF-8.
8. Provide nice URL for fetching the widgets so it is easier to debug them in Network view, `/widget/24517/publications-displayer`.

#### Optional

* Cache resources by, for example, not packaging resources on the fly but doing so on service startup. Then, say the latest modification date.
* Allow the use of [LESS](http://lesscss.org/) instead of CSS.
* Allow the use of other templating languages.
* Check for the presence of `Displayer.prototype.render` and `Displayer.prototype.initialize` in the compiled *presenter*.
* Validate that callbacks are valid JavaScript identifiers. Should not be needed as we will use API loader and generate these automagically.
* Provide a signature in the generated output describing the title, author etc for the widget in question.
* Each block in the compiled result have a comment header so it is easier to find where things lie when debugging.
* Provide connection to [imjs](https://github.com/alexkalderimis/imjs) by default.

#### Issues

* If we want to split presenter across multiple CoffeScript files, how to maintain their order in the resulting JS version? Go alphabetically?

### Client

1. Make use of [intermine-api-loader](https://github.com/radekstepan/intermine-api-loader) to efficiently load resources and libs only when needed.
2. Generate *callbacks* that are unique for the page taking into account other clients that could exist on the page. As the service URL is unique per client, make use of that.
3. Dump error messages from the server into the target element where widget was supposed to have been.
4. Cache all of the widgets listing as we need to be resolving widget dependencies first.
5. Inject the name of the widget as a comment into HTML; opening and closing.

## Example

An example configuration for a Widget can be seen below:

```json
{
    "publications-displayer": {
        "author": "Radek",
        "title": "Publications for Gene",
        "description": "Shows a list of publications for a specific gene",
        "version": "0.0.1",
        "dependencies": [
            {
                "name": "JSON",
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