(function() {
  var FatAppsClient, root, _each, _extend, _setImmediate, _uid,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = this;

  if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
      _setImmediate = setImmediate;
    } else {
      _setImmediate = function(fn) {
        return setTimeout(fn, 0);
      };
    }
  } else {
    if (typeof setImmediate !== 'undefined') {
      _setImmediate = setImmediate;
    } else {
      _setImmediate = process.nextTick;
    }
  }

  _each = function(arr, iterator) {
    var key, value, _results;

    if (arr.forEach) {
      return arr.forEach(iterator);
    }
    _results = [];
    for (key in arr) {
      value = arr[key];
      _results.push(iterator(value, key, arr));
    }
    return _results;
  };

  _extend = function(obj) {
    _each(Array.prototype.slice.call(arguments, 1), function(source) {
      var prop, _results;

      if (source) {
        _results = [];
        for (prop in source) {
          _results.push(obj[prop] = source[prop]);
        }
        return _results;
      }
    });
    return obj;
  };

  _uid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r;

      r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 0x3 | 0x8).toString(16);
    });
  };

  root = this;

  if (!document.querySelector) {
    throw 'An old & unsupported browser detected';
  }

  FatAppsClient = (function() {
    FatAppsClient.prototype.selectorPrefix = 'w';

    function FatAppsClient(server) {
      this.load = __bind(this.load, this);
      var callback,
        _this = this;

      this.server = server.replace(/\/+$/, '');
      callback = 'rwc' + +(new Date);
      root[callback] = function(config) {
        _this.config = config;
      };
      root.intermine.load([
        {
          'path': "" + this.server + "/embedding/fatapps?callback=" + callback,
          'type': 'js'
        }
      ]);
    }

    FatAppsClient.prototype.load = function(appId, target, options) {
      var again, deps, run,
        _this = this;

      if (options == null) {
        options = {};
      }
      again = function() {
        return _this.load(appId, target, options);
      };
      if (!this.config) {
        return _setImmediate(again);
      }
      run = function(err) {
        var uid;

        if (err) {
          throw err;
        }
        uid = _uid();
        return root.intermine.load([
          {
            'path': "" + _this.server + "/embedding/fatapps/" + appId + "?callback=" + uid,
            'type': 'js'
          }
        ], function(err) {
          var app, article, config, div, fn, instance, templates;

          article = document.createElement('article');
          article.setAttribute('class', "-im-fatapps " + appId);
          div = document.createElement('div');
          div.setAttribute('id', 'w' + uid);
          div.appendChild(article);
          document.querySelector(target).appendChild(div);
          if (!root.intermine.temp) {
            throw '`intermine.temp` object cache does not exist';
          }
          if (!(app = root.intermine.temp.apps[uid])) {
            throw "Unknown app `" + uid + "`";
          }
          fn = app[0], config = app[1], templates = app[2];
          config = _extend(config, options);
          instance = new fn(config, templates);
          if (!(instance && typeof instance === 'object')) {
            throw 'Widget failed to instantiate';
          }
          if (!(instance.render && typeof instance.render === 'function')) {
            throw 'Widget does not implement `render` function';
          }
          return instance.render("#w" + uid + " article.-im-fatapps");
        });
      };
      deps = this.config[appId];
      if (deps != null) {
        return root.intermine.load(deps, run);
      } else {
        return run();
      }
    };

    return FatAppsClient;

  })();

  if (!root.intermine) {
    throw 'You need to include the InterMine API Loader first!';
  } else {
    root.intermine.fatApps = root.intermine.fatApps || FatAppsClient;
  }

}).call(this);
