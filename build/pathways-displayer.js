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
 *  Generated: Wed, 15 May 2013 17:27:05 GMT
 */
(function() {
  var clazz
    , root = this;

  /**#@+ the presenter */

  var $, AssertException, Grid, GridMessages, GridRow, Row, Rows, Widget, _ref, _ref1, _ref2, _ref3,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  AssertException = (function() {
    function AssertException(message) {
      this.message = message;
    }
  
    AssertException.prototype.toString = function() {
      return "PathwaysDisplayerAssertException: " + this.message;
    };
  
    return AssertException;
  
  })();
  
  /*
  Set the assertion on the window object.
  @param {boolean} exp Expression to be truthy
  @param {string} message Exception text to show if `exp` is not truthy fruthy
  */
  
  
  this.assert = function(exp, message) {
    if (!exp) {
      throw new AssertException(message);
    }
  };
  
  $ = jQuery || Zepto;
  
  /* Behavior of the widget.
  */
  
  
  Widget = (function() {
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      this.getHomologues = __bind(this.getHomologues, this);
      this.service = new intermine.Service({
        'root': 'http://beta.flymine.org/beta'
      });
    }
  
    Widget.prototype.render = function(el) {
      var grid, launchAllP, launchOneP,
        _this = this;
  
      this.el = el;
      grid = new Grid({
        'el': this.el,
        'attributes': {
          'head': this.config.organisms,
          'title': this.config.symbol,
          'template': this.templates.grid
        }
      });
      grid.messages["new"]('Loading homologues &hellip;', 'homologues');
      launchOneP = function(mine, url, homologues) {
        grid.messages["new"]("Loading " + mine + " &hellip;", mine);
        return $.when(_this.getPathways(homologues, url)).then(function(pathways) {
          var isCurated, organism, pathway, _i, _len, _ref, _results;
  
          grid.messages.clear(mine);
          _results = [];
          for (_i = 0, _len = pathways.length; _i < _len; _i++) {
            _ref = pathways[_i], pathway = _ref[0], isCurated = _ref[1], organism = _ref[2];
            grid.add(pathway, organism, $('<span/>', {
              'text': 'Yes',
              'class': isCurated ? 'label success has-tip' : 'label secondary has-tip',
              'title': mine
            }));
            _results.push($(document).foundationTooltips());
          }
          return _results;
        });
      };
      launchAllP = function(homologues) {
        var all, mine, url, _fn, _ref;
  
        all = [];
        _ref = _this.config.mines;
        _fn = function(mine, url) {
          return all.push(launchOneP(mine, url, homologues));
        };
        for (mine in _ref) {
          url = _ref[mine];
          _fn(mine, url);
        }
        return $.when(all).done();
      };
      return $.when(this.getHomologues(this.config.symbol)).then(function(homologues) {
        grid.messages.clear('homologues');
        $(_this.el).find('p').html('Using <strong>homologues</strong>: ' + homologues.join(', '));
        grid.legend('<span class="label success"></span> Is curated <span class="label secondary"></span> Is not curated ');
        return homologues;
      }).then(launchAllP).fail(function(err) {
        return console.log(err);
      });
    };
  
    Widget.prototype.getHomologues = function(symbol) {
      var error, fin, pq, rowsP, serviceP, _ref;
  
      assert((symbol != null) && symbol !== '', 'Need to provide a symbol to constrain gene on');
      pq = JSON.parse(JSON.stringify(this.config.pathQueries.homologues));
      if ((_ref = pq.constraints) == null) {
        pq.constraints = [];
      }
      pq.constraints.push({
        'path': 'Gene',
        'op': 'LOOKUP',
        'value': symbol
      });
      serviceP = function(service, pq) {
        return service.query(pq);
      };
      rowsP = function(q) {
        return q.rows();
      };
      fin = function(rows) {
        var g, _i, _len, _results;
  
        _results = [];
        for (_i = 0, _len = rows.length; _i < _len; _i++) {
          g = rows[_i];
          if (g[0]) {
            _results.push(g[0]);
          }
        }
        return _results;
      };
      error = function(err) {
        return console.log(err);
      };
      return $.when(serviceP(this.service, pq)).then(rowsP).then(fin).fail(error);
    };
  
    Widget.prototype.getPathways = function(identifiers, url) {
      var error, pq, rowsP, serviceP, _ref;
  
      assert((identifiers != null) && identifiers instanceof Array, 'Need to provide an Array of gene identifiers to constrain pathways on');
      pq = JSON.parse(JSON.stringify(this.config.pathQueries.pathways));
      if ((_ref = pq.constraints) == null) {
        pq.constraints = [];
      }
      pq.constraints.push({
        'path': 'Gene.primaryIdentifier',
        'op': 'ONE OF',
        'values': identifiers
      });
      serviceP = function(url, pq) {
        return (new intermine.Service({
          'root': url
        })).query(pq);
      };
      rowsP = function(q) {
        return q.rows();
      };
      error = function(err) {
        return console.log(err);
      };
      return $.when(serviceP(url, pq)).then(rowsP).fail(error);
    };
  
    return Widget;
  
  })();
  
  /* Our data.
  */
  
  
  Row = (function(_super) {
    __extends(Row, _super);
  
    function Row() {
      _ref = Row.__super__.constructor.apply(this, arguments);
      return _ref;
    }
  
    Row.prototype.defaults = {
      'show': true
    };
  
    return Row;
  
  })(Backbone.Model);
  
  Rows = (function(_super) {
    __extends(Rows, _super);
  
    function Rows() {
      _ref1 = Rows.__super__.constructor.apply(this, arguments);
      return _ref1;
    }
  
    Rows.prototype.model = Row;
  
    Rows.prototype.filter = function(re) {
      var hidden, shown;
  
      shown = 0;
      hidden = 0;
      this.each(function(model) {
        if (model.get('text').match(re)) {
          if (!model.get('show')) {
            model.set({
              'show': true
            });
          }
          return shown++;
        } else {
          if (model.get('show')) {
            model.set({
              'show': false
            });
          }
          return hidden++;
        }
      });
      return [shown, hidden];
    };
  
    return Rows;
  
  })(Backbone.Collection);
  
  /* The table used to render the paginated view.
  */
  
  
  GridRow = (function(_super) {
    __extends(GridRow, _super);
  
    function GridRow() {
      this.className = __bind(this.className, this);    _ref2 = GridRow.__super__.constructor.apply(this, arguments);
      return _ref2;
    }
  
    GridRow.prototype.tagName = 'tr';
  
    GridRow.prototype.className = function() {
      return this.model.get('slug');
    };
  
    GridRow.prototype.initialize = function() {
      var td,
        _this = this;
  
      this.mediator = this.attributes.mediator;
      $(this.el).append(td = $('<td/>', {
        'html': this.model.get('text')
      }));
      this.model.bind('change', function() {
        return $(_this.el).toggle();
      });
      this.mediator.on('filter', function(re) {
        if (_this.model.get('show')) {
          return $(_this.el).find('td:first-child').html(_this.model.get('text').replace(re, function(str, g1, g2) {
            if (g1.length !== 0) {
              return "<span class='label'>" + g1 + "</span>";
            } else {
              return g1;
            }
          }));
        }
      });
      return this;
    };
  
    return GridRow;
  
  })(Backbone.View);
  
  /* Maintain and dynamically update data in a grid/table.
  */
  
  
  Grid = (function(_super) {
    __extends(Grid, _super);
  
    function Grid() {
      this.filterAction = __bind(this.filterAction, this);
      this.adjustFauxHeader = __bind(this.adjustFauxHeader, this);    _ref3 = Grid.__super__.constructor.apply(this, arguments);
      return _ref3;
    }
  
    Grid.prototype.columns = [];
  
    Grid.prototype.rows = [];
  
    Grid.prototype.grid = {};
  
    Grid.prototype.events = {
      'keyup input.filter': 'filterAction',
      'click .filterMessage a.show-all': 'clearFilterAction'
    };
  
    Grid.prototype.initialize = function() {
      var column, columnS, row, target, _i, _len, _ref4;
  
      this.el = $(this.el);
      _.extend(this.mediator = {}, Backbone.Events);
      target = $(this.el).html(this.attributes.template({
        'title': this.attributes.title
      }));
      this.messages = new GridMessages(this.el);
      this.collection = new Rows();
      this.body = this.el.find('.wrapper table tbody');
      row = $('<tr/>');
      row.append($('<th/>'));
      _ref4 = this.attributes.head;
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        column = _ref4[_i];
        this.columns.push(columnS = this.slugify(column));
        row.append($('<th/>', {
          'text': column,
          'class': columnS
        }));
        this.el.find('.faux thead tr').append($('<th/>', {
          'text': column
        }));
      }
      row.appendTo(this.el.find('.wrapper table thead'));
      this.collection.bind('change', this.adjustFauxHeader);
      this.collection.bind('add', this.adjustFauxHeader);
      return this;
    };
  
    Grid.prototype.add = function(row, column, data) {
      var columnS, model, rowS, view,
        _this = this;
  
      rowS = this.slugify(row);
      columnS = this.slugify(column);
      if (__indexOf.call(this.rows, rowS) < 0) {
        model = new Row({
          'text': row,
          'slug': rowS
        });
        this.collection.add(model);
        view = new GridRow({
          'model': model,
          'attributes': {
            'mediator': this.mediator
          }
        });
        if (!this.rows.length) {
          this.body.append(view.el);
          this.rows = [rowS];
        } else {
          (function() {
            var index, _ref4;
  
            _ref4 = _this.rows;
            for (index in _ref4) {
              row = _ref4[index];
              if (rowS.localeCompare(row) < 0) {
                _this.rows.splice(index, 0, rowS);
                $(_this.grid[row]['el']).before(view.el);
                return;
              }
            }
            _this.rows.push(rowS);
            return _this.body.append(view.el);
          })();
        }
        (function(row, column) {
          var _i, _len, _ref4, _results;
  
          _this.grid[row] = {
            'el': view.el,
            'columns': {}
          };
          _ref4 = _this.columns;
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            column = _ref4[_i];
            _results.push(_this.grid[row]['columns'][column] = (function() {
              var el;
  
              $(view.el).append(el = $('<td/>', {
                'class': column
              }));
              return el;
            })());
          }
          return _results;
        })(rowS, columnS);
      }
      this.grid[rowS]['columns'][columnS].html(data);
      if (this.collection.length >= 8) {
        return this.el.find('input.filter').show();
      }
    };
  
    Grid.prototype.slugify = function(text) {
      return text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase();
    };
  
    Grid.prototype.adjustFauxHeader = function() {
      var _this = this;
  
      if (this.fauxTimeout != null) {
        clearTimeout(this.fauxTimeout);
      }
      return this.fauxTimeout = setTimeout((function() {
        return _this.el.find('.wrapper thead th').each(function(i, th) {
          return _this.el.find(".faux th:eq(" + i + ")").width($(th).outerWidth());
        });
      }), 0);
    };
  
    Grid.prototype.filterAction = function(e) {
      var _this = this;
  
      if (this.filterTimeout != null) {
        clearTimeout(this.filterTimeout);
      }
      return this.filterTimeout = setTimeout((function() {
        var hidden, query, re, shown, _ref4;
  
        query = $.trim($(e.target).val());
        if (query !== _this.query) {
          _this.query = query;
          re = new RegExp("(" + query + ")", 'ig');
          _ref4 = _this.collection.filter(re), shown = _ref4[0], hidden = _ref4[1];
          _this.filterMessage(shown, hidden);
          return _this.mediator.trigger('filter', re);
        }
      }), 500);
    };
  
    Grid.prototype.clearFilterAction = function() {
      var hidden, re, shown, _ref4;
  
      this.el.find('input.filter').val('');
      _ref4 = this.collection.filter(), shown = _ref4[0], hidden = _ref4[1];
      this.filterMessage(shown, hidden);
      return this.mediator.trigger('filter', re = new RegExp('()', 'ig'));
    };
  
    Grid.prototype.filterMessage = function(shown, hidden) {
      var box, msg;
  
      box = this.body.find('.filterMessage');
      msg = this.body.find('.filterMessage .text');
      if (hidden !== 0) {
        box.show();
        if (shown !== 0) {
          return msg.text("" + hidden + " rows are hidden.");
        } else {
          return msg.text('All rows are hidden.');
        }
      } else {
        return box.hide();
      }
    };
  
    Grid.prototype.legend = function(html) {
      var l;
  
      (l = this.el.find('.legend')).html(html);
      return l.css({
        'top': -l.outerHeight() + 1
      });
    };
  
    return Grid;
  
  })(Backbone.View);
  
  /* Letting the user know as to what happens.
  */
  
  
  GridMessages = (function() {
    GridMessages.prototype.i = 0;
  
    GridMessages.prototype.msgs = {};
  
    function GridMessages(el) {
      this.el = $(el).find('.notifications');
    }
  
    GridMessages.prototype["new"] = function(text, key) {
      var m;
  
      this.el.append(m = $('<div/>', {
        'class': 'alert-box',
        'html': text
      }));
      key = key || i++;
      return this.msgs[key] = m;
    };
  
    GridMessages.prototype.clear = function(key) {
      var value, _ref4, _ref5, _results;
  
      if (key != null) {
        return (_ref4 = this.msgs[key]) != null ? _ref4.remove() : void 0;
      } else {
        _ref5 = this.msgs;
        _results = [];
        for (key in _ref5) {
          value = _ref5[key];
          _results.push(value.remove());
        }
        return _results;
      }
    };
  
    return GridMessages;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.grid=function(n){n||(n={});var t,e=[],a=function(n){return n&&n.ecoSafe?n:n!==void 0&&null!=n?l(n):""},s=n.safe,l=n.escape;return t=n.safe=function(n){if(n&&n.ecoSafe)return n;(void 0===n||null==n)&&(n="");var t=new String(n);return t.ecoSafe=!0,t},l||(l=n.escape=function(n){return(""+n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){e.push("<div>\n    <h4>Pathways for "),e.push(a(this.title)),e.push('</h4> <div class="notifications"></div>\n    <p></p>\n    <div class="grid">\n        <div class="legend"></div>\n        \n        <table class="faux">\n            <thead>\n                <tr>\n                    <th><input type="text" placeholder="Filter..." class="filter" /></th>\n                </tr>\n            </thead>\n        </table>\n        \n        <div class="wrapper">\n            <table>\n                <thead></thead>\n                <tbody>\n                    <!-- so we start with a white row... -->\n                    <tr></tr>\n                    <tr class="filterMessage">\n                        <td colspan="99">\n                            <div class="alert-box secondary"><span class="text"></span> <a class="show-all">Show all</a></div>\n                        </td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n    </div>\n</div>')}).call(this)}.call(n),n.safe=s,n.escape=l,e.join("")};;

  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK h4{width:100%}div#w#@+CALLBACK p{text-align:justify}div#w#@+CALLBACK .label{bottom:0}div#w#@+CALLBACK .grid{position:relative}div#w#@+CALLBACK .grid .legend{background:#fff;position:absolute;top:0;right:15px;padding:4px 8px;border:1px solid #ddd;border-bottom:0;border-radius:3px 3px 0 0;z-index:2}div#w#@+CALLBACK .grid .legend .label{display:inline-block;width:10px;height:10px}div#w#@+CALLBACK .grid .legend .label:not(:first-child){margin-left:6px}div#w#@+CALLBACK .faux{margin:0;border-bottom:0}div#w#@+CALLBACK .faux input.filter{display:none;margin:0}div#w#@+CALLBACK .wrapper{overflow:auto;overflow-x:hidden;height:305px}div#w#@+CALLBACK .wrapper table{width:100%;margin-top:-39px}div#w#@+CALLBACK .wrapper table thead{visibility:hidden}div#w#@+CALLBACK .wrapper table tbody .filterMessage{display:none;background:#fff}div#w#@+CALLBACK .wrapper table tbody td:first-child .label{padding-left:0;padding-right:0}div#w#@+CALLBACK .wrapper table tbody td:first-child a.show-all{cursor:pointer}';
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
