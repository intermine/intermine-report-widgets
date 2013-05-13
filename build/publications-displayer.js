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
 *  Generated: Mon, 13 May 2013 14:29:11 GMT
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
  templates.table=function(n){n||(n={});var e,s=[],t=function(n){return n&&n.ecoSafe?n:n!==void 0&&null!=n?u(n):""},a=n.safe,u=n.escape;return e=n.safe=function(n){if(n&&n.ecoSafe)return n;(void 0===n||null==n)&&(n="");var e=new String(n);return e.ecoSafe=!0,e},u||(u=n.escape=function(n){return(""+n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){var n,e,a,u,h,r,l,p,o,c,i,f;if(s.push("<header>\n    <!-- pagination -->\n    "),this.pages>1){for(s.push('\n        <ul class="pages">\n            <li>Page:</li>\n        '),e=u=0,c=this.pages;c>=0?c>u:u>c;e=c>=0?++u:--u)s.push("\n            <li><a "),this.current===e&&s.push('class="current"'),s.push(">"),s.push(t(e+1)),s.push("</a></li>\n        ");s.push("\n        </ul>\n    ")}if(s.push("\n    \n    <h4>"),s.push(t(this.count)),s.push(' Publications for</h4> <input type="text" placeholder="zen" class="symbol three columns" value="'),s.push(t(this.symbol)),s.push('" />\n</header>\n\n'),0!==this.rows.length){for(s.push("\n    <table>\n        <thead>\n            <tr>\n                <th>Title</th>\n                <th>Author</th>\n            </tr>\n        </thead>\n        <tbody>\n            "),i=this.rows,h=0,p=i.length;p>h;h++){if(a=i[h],s.push("\n                <tr>\n                    <td>"),s.push(t(a.title)),s.push("</td>\n                    <td>\n                        "),a.authors){if(s.push("\n                            "),a.authors.length>5){for(s.push("\n                                "),e=r=0;5>r;e=++r)s.push('\n                                    <span class="author">'),s.push(t(a.authors[e].name)),s.push("</span>\n                                ");s.push("\n                                &hellip;\n                            ")}else{for(s.push("\n                                "),f=a.authors,l=0,o=f.length;o>l;l++)n=f[l],s.push('\n                                    <span class="author">'),s.push(t(n.name)),s.push("</span>\n                                ");s.push("\n                            ")}s.push("\n                        ")}s.push("\n                    </td>\n                </tr>\n            ")}s.push("\n        </tbody>\n    </table>\n")}else s.push('\n    <div class="alert-box alert">No results</div>\n')}).call(this)}.call(n),n.safe=a,n.escape=u,s.join("")};;

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
  root.intermine.temp.widgets['#@+CALLBACK'] = new Widget(config, templates);

}).call(this);