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
 *  Generated: Wed, 15 May 2013 17:27:06 GMT
 */
(function() {
  var root = this;

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
  templates.table=function(n){n||(n={});var t,e=[],s=function(n){return n&&n.ecoSafe?n:n!==void 0&&null!=n?l(n):""},a=n.safe,l=n.escape;return t=n.safe=function(n){if(n&&n.ecoSafe)return n;(void 0===n||null==n)&&(n="");var t=new String(n);return t.ecoSafe=!0,t},l||(l=n.escape=function(n){return(""+n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){var n,t,a,l,r,h,u,p,i,o,c,d;if(e.push("<header>\n    <!-- pagination -->\n    "),this.pages>1){for(e.push('\n        <ul class="pages">\n            <li>Page:</li>\n        '),t=l=0,o=this.pages;o>=0?o>l:l>o;t=o>=0?++l:--l)e.push("\n            <li><a "),this.current===t&&e.push('class="current"'),e.push(">"),e.push(s(t+1)),e.push("</a></li>\n        ");e.push("\n        </ul>\n    ")}if(e.push("\n    \n    <h4>"),e.push(s(this.count)),e.push(' Publications for</h4> <input type="text" placeholder="zen" class="symbol three columns" value="'),e.push(s(this.symbol)),e.push('" />\n</header>\n\n'),0!==this.rows.length){for(e.push("\n    <table>\n        <thead>\n            <tr>\n                <th>Title</th>\n                <th>Author</th>\n            </tr>\n        </thead>\n        <tbody>\n            "),c=this.rows,r=0,p=c.length;p>r;r++){if(a=c[r],e.push("\n                <tr>\n                    <td>"),e.push(s(a.title)),e.push("</td>\n                    <td>\n                        "),a.authors){if(e.push("\n                            "),a.authors.length>5){for(e.push("\n                                "),t=h=0;5>h;t=++h)e.push('\n                                    <span class="author">'),e.push(s(a.authors[t].name)),e.push("</span>\n                                ");e.push("\n                                &hellip;\n                            ")}else{for(e.push("\n                                "),d=a.authors,u=0,i=d.length;i>u;u++)n=d[u],e.push('\n                                    <span class="author">'),e.push(s(n.name)),e.push("</span>\n                                ");e.push("\n                            ")}e.push("\n                        ")}e.push("\n                    </td>\n                </tr>\n            ")}e.push("\n        </tbody>\n    </table>\n")}else e.push('\n    <div class="alert-box alert">No results</div>\n')}).call(this)}.call(n),n.safe=a,n.escape=l,e.join("")};;

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
  root.intermine.temp.widgets['#@+CALLBACK'] = new (Widget)(config, templates);


}).call(this);