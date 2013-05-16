new Error('This widget cannot be called directly');

/**
 *      _/_/_/  _/      _/   
 *       _/    _/_/  _/_/     InterMine Report Widget
 *      _/    _/  _/  _/      (C) 2013 InterMine, University of Cambridge.
 *     _/    _/      _/       http://intermine.org
 *  _/_/_/  _/      _/
 *
 *  Name: #@+TITLE
 *  Author: #@+AUTHOR
 *  Description: #@+DESCRIPTION
 *  Version: #@+VERSION
 *  Generated: Wed, 15 May 2013 16:53:56 GMT
 */
(function() {
  var clazz
    , root = this;

  /**#@+ the presenter */

  var Publication, Publications, Table, Widget, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  
  Publication = (function(_super) {
    __extends(Publication, _super);
  
    function Publication() {
      _ref = Publication.__super__.constructor.apply(this, arguments);
      return _ref;
    }
  
    return Publication;
  
  })(Backbone.Model);
  
  Publications = (function(_super) {
    __extends(Publications, _super);
  
    function Publications() {
      _ref1 = Publications.__super__.constructor.apply(this, arguments);
      return _ref1;
    }
  
    Publications.prototype.model = Publication;
  
    return Publications;
  
  })(Backbone.Collection);
  
  Table = (function(_super) {
    __extends(Table, _super);
  
    function Table() {
      _ref2 = Table.__super__.constructor.apply(this, arguments);
      return _ref2;
    }
  
    Table.prototype.page = 0;
  
    Table.prototype.size = 10;
  
    Table.prototype.events = {
      'click ul.pages a': 'changePage',
      'keyup input.symbol': 'changeSymbol'
    };
  
    Table.prototype.initialize = function(opts) {
      var k, v, _results;
  
      _results = [];
      for (k in opts) {
        v = opts[k];
        _results.push(this[k] = v);
      }
      return _results;
    };
  
    Table.prototype.render = function() {
      $(this.el).html(this.template({
        'rows': this.collection.length !== 0 ? this.collection.toJSON().splice(this.size * this.page, this.size) : [],
        'symbol': this.symbol,
        'pages': Math.ceil(this.collection.length / this.size),
        'current': this.page,
        'count': this.collection.length
      }));
      return this;
    };
  
    Table.prototype.changePage = function(e) {
      this.page = parseInt($(e.target).text()) - 1;
      return this.render();
    };
  
    Table.prototype.changeSymbol = function(e) {
      var done,
        _this = this;
  
      done = function() {
        var symbol;
  
        symbol = $(e.target).val();
        if (symbol !== '' && symbol !== _this.symbol) {
          return $.when(_this.data(symbol)).then(function(records) {
            _this.symbol = symbol;
            _this.collection = new Publications(records);
            return _this.render();
          });
        }
      };
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      return this.timeout = root.setTimeout(done, 500);
    };
  
    return Table;
  
  })(Backbone.View);
  
  Widget = (function() {
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      this.data = __bind(this.data, this);
      this.service = new intermine.Service({
        'root': this.config.mine
      });
    }
  
    Widget.prototype.data = function(symbol) {
      var error, fin, loading, pq, recordsP, serviceP;
  
      $(this.target).prepend(loading = $('<div class="alert-box">Loading &hellip;</div>'));
      pq = this.config.pathQueries.pubsForGene;
      pq.where = {
        'symbol': {
          '=': symbol
        }
      };
      serviceP = function(service, pq) {
        return service.query(pq);
      };
      recordsP = function(q) {
        return q.records();
      };
      fin = function(records) {
        var _ref3;
  
        loading.remove();
        return ((_ref3 = records.pop()) != null ? _ref3.publications : void 0) || [];
      };
      error = function(err) {
        return loading.text(err.statusText).addClass('alert');
      };
      return $.when(serviceP(this.service, pq)).then(recordsP).then(fin).fail(error);
    };
  
    Widget.prototype.render = function(target) {
      var _ref3,
        _this = this;
  
      this.target = target;
      $((_ref3 = this.view) != null ? _ref3.el : void 0).hide();
      return $.when(this.data(this.config.symbol)).then(function(records) {
        var _ref4;
  
        $((_ref4 = _this.view) != null ? _ref4.el : void 0).show();
        _this.view = new Table({
          'collection': new Publications(records),
          'template': _this.templates.table,
          'symbol': _this.config.symbol,
          'data': _this.data
        });
        return $(_this.target).html(_this.view.render().el);
      });
    };
  
    return Widget;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.table=function(e){e||(e={});var n,t=[],s=function(e){return e&&e.ecoSafe?e:e!==void 0&&null!=e?r(e):""},a=e.safe,r=e.escape;return n=e.safe=function(e){if(e&&e.ecoSafe)return e;(void 0===e||null==e)&&(e="");var n=new String(e);return n.ecoSafe=!0,n},r||(r=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){var e,n,a,r,l,i,o,c,u,p,h,d;if(t.push("<header>\n    <!-- pagination -->\n    "),this.pages>1){for(t.push('\n        <ul class="pages">\n            <li>Page:</li>\n        '),n=r=0,p=this.pages;p>=0?p>r:r>p;n=p>=0?++r:--r)t.push("\n            <li><a "),this.current===n&&t.push('class="current"'),t.push(">"),t.push(s(n+1)),t.push("</a></li>\n        ");t.push("\n        </ul>\n    ")}if(t.push("\n    \n    <h4>"),t.push(s(this.count)),t.push(' Publications for</h4> <input type="text" placeholder="zen" class="symbol three columns" value="'),t.push(s(this.symbol)),t.push('" />\n</header>\n\n'),0!==this.rows.length){for(t.push("\n    <table>\n        <thead>\n            <tr>\n                <th>Title</th>\n                <th>Author</th>\n            </tr>\n        </thead>\n        <tbody>\n            "),h=this.rows,l=0,c=h.length;c>l;l++){if(a=h[l],t.push("\n                <tr>\n                    <td>"),t.push(s(a.title)),t.push("</td>\n                    <td>\n                        "),a.authors){if(t.push("\n                            "),a.authors.length>5){for(t.push("\n                                "),n=i=0;5>i;n=++i)t.push('\n                                    <span class="author">'),t.push(s(a.authors[n].name)),t.push("</span>\n                                ");t.push("\n                                &hellip;\n                            ")}else{for(t.push("\n                                "),d=a.authors,o=0,u=d.length;u>o;o++)e=d[o],t.push('\n                                    <span class="author">'),t.push(s(e.name)),t.push("</span>\n                                ");t.push("\n                            ")}t.push("\n                        ")}t.push("\n                    </td>\n                </tr>\n            ")}t.push("\n        </tbody>\n    </table>\n")}else t.push('\n    <div class="alert-box alert">No results</div>\n')}).call(this)}.call(e),e.safe=a,e.escape=r,t.join("")};;

  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK h4{float:left}div#w#@+CALLBACK ul.pages{display:inline;list-style-type:none;float:right;margin:15px 0;max-width:500px}div#w#@+CALLBACK ul.pages li{display:inline-block}div#w#@+CALLBACK ul.pages a.current{font-weight:700}div#w#@+CALLBACK header:after{content:" ";display:block;clear:both}div#w#@+CALLBACK table{width:100%}div#w#@+CALLBACK span.author:not(:last-child):after{content:",";display:inline-block}div#w#@+CALLBACK input.symbol{float:left;color:#8E0022;background:0;border:0;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;font-family:\'Droid Serif\',serif;font-size:23px;font-weight:700;padding:0;margin:10px 0;margin-left:4px}';
  document.head.appendChild(style);

  /**#@+ callback */
  (function() {
    var parent, part, _i, _len, _ref;
    parent = this;
    _ref = 'intermine.temp.widgets'.split('.');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      part = _ref[_i];
      parent = parent[part] = parent[part] || {};
    }
  }).call(root);
  clazz = #@+CLASSEXPR;
  root.intermine.temp.widgets['#@+CALLBACK'] = [clazz, config, templates];


}).call(this);
