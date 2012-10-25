new Error('This widget cannot be called directly');

/**
 *      _/_/_/  _/      _/   
 *       _/    _/_/  _/_/     InterMine Report Widget
 *      _/    _/  _/  _/      (C) 2012 InterMine, University of Cambridge.
 *     _/    _/      _/       http://intermine.org
 *  _/_/_/  _/      _/
 *
 *  Name: #@+TITLE
 *  Author: #@+AUTHOR
 *  Description: #@+DESCRIPTION
 *  Version: #@+VERSION
 *  Generated: Thu, 25 Oct 2012 13:56:53 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  /* Behavior of the widget.
  */
  
  var Grid, GridRow, Row, Rows, Widget,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  Widget = (function() {
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      this.service = new intermine.Service({
        'root': 'http://beta.flymine.org/beta'
      });
    }
  
    Widget.prototype.render = function(target) {
      var grid, organism, _i, _len, _ref,
        _this = this;
      this.target = target;
      target = $(this.target).html(this.templates.table());
      _ref = this.config.organisms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        organism = _ref[_i];
        target.find('.faux thead tr').append($('<th/>', {
          'text': organism
        }));
      }
      grid = new Grid(target.find('.wrapper'), this.config.organisms);
      return this.getHomologues(this.config.symbol, function(homologues) {
        var mine, url, _ref1, _results;
        _ref1 = _this.config.mines;
        _results = [];
        for (mine in _ref1) {
          url = _ref1[mine];
          _results.push((function(mine, url) {
            return _this.getPathways(homologues, url, function(pathways) {
              var isCurated, pathway, _j, _len1, _ref2, _results1;
              _results1 = [];
              for (_j = 0, _len1 = pathways.length; _j < _len1; _j++) {
                _ref2 = pathways[_j], pathway = _ref2[0], isCurated = _ref2[1], organism = _ref2[2];
                grid.add(pathway, organism, $('<span/>', {
                  'text': 'Yes',
                  'class': isCurated ? 'label success' : 'label secondary',
                  'title': mine
                }));
                _results1.push(target.find('.wrapper thead th').each(function(i, th) {
                  return $(target).find(".faux th:eq(" + i + ")").width($(th).outerWidth());
                }));
              }
              return _results1;
            });
          })(mine, url));
        }
        return _results;
      });
    };
  
    Widget.prototype.getHomologues = function(symbol, cb) {
      var pq, _ref;
      pq = JSON.parse(JSON.stringify(this.config.pathQueries.homologues));
      if ((_ref = pq.constraints) == null) {
        pq.constraints = [];
      }
      pq.constraints.push({
        'path': 'Gene',
        'op': 'LOOKUP',
        'value': symbol
      });
      return this.service.query(pq, function(q) {
        return q.rows(function(rows) {
          var g;
          return cb((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = rows.length; _i < _len; _i++) {
              g = rows[_i];
              if (g[0]) {
                _results.push(g[0]);
              }
            }
            return _results;
          })());
        });
      });
    };
  
    Widget.prototype.getPathways = function(identifiers, url, cb) {
      var pq, service, _ref;
      pq = JSON.parse(JSON.stringify(this.config.pathQueries.pathways));
      if ((_ref = pq.constraints) == null) {
        pq.constraints = [];
      }
      pq.constraints.push({
        'path': 'Gene.primaryIdentifier',
        'op': 'ONE OF',
        'values': identifiers
      });
      service = new intermine.Service({
        'root': url
      });
      return service.query(pq, function(q) {
        return q.rows(cb);
      });
    };
  
    return Widget;
  
  })();
  
  /* Our data.
  */
  
  
  Row = (function(_super) {
  
    __extends(Row, _super);
  
    function Row() {
      return Row.__super__.constructor.apply(this, arguments);
    }
  
    return Row;
  
  })(Backbone.Model);
  
  Rows = (function(_super) {
  
    __extends(Rows, _super);
  
    function Rows() {
      return Rows.__super__.constructor.apply(this, arguments);
    }
  
    Rows.prototype.model = Row;
  
    return Rows;
  
  })(Backbone.Collection);
  
  /* The table used to render the paginated view.
  */
  
  
  GridRow = (function(_super) {
  
    __extends(GridRow, _super);
  
    function GridRow() {
      return GridRow.__super__.constructor.apply(this, arguments);
    }
  
    GridRow.prototype.tagName = 'tr';
  
    GridRow.prototype.initialize = function() {
      $(this.el).addClass(this.model.get('slug')).append($('<td/>', {
        'text': this.model.get('text')
      }));
      return this;
    };
  
    return GridRow;
  
  })(Backbone.View);
  
  /* Maintain and dynamically update data in a grid/table.
  */
  
  
  Grid = (function(_super) {
  
    __extends(Grid, _super);
  
    Grid.prototype.columns = [];
  
    Grid.prototype.rows = [];
  
    Grid.prototype.grid = {};
  
    function Grid(el, head) {
      var column, columnS, row, _i, _len;
      this.collection = new Rows();
      $(el).append(el = $('<table/>'));
      $(el).append(this.body = $('<tbody/>'));
      row = $('<tr/>');
      row.append($('<th/>'));
      for (_i = 0, _len = head.length; _i < _len; _i++) {
        column = head[_i];
        this.columns.push(columnS = this.slugify(column));
        row.append($('<th/>', {
          'text': column,
          'class': columnS
        }));
      }
      row.appendTo($('<thead/>').appendTo($(el)));
    }
  
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
          'model': model
        });
        if (!this.rows.length) {
          this.body.append(view.el);
          this.rows = [rowS];
        } else {
          (function() {
            var index, _ref;
            _ref = _this.rows;
            for (index in _ref) {
              row = _ref[index];
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
          var _i, _len, _ref, _results;
          _this.grid[row] = {
            'el': view.el,
            'columns': {}
          };
          _ref = _this.columns;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            column = _ref[_i];
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
      return this.grid[rowS]['columns'][columnS].html(data);
    };
  
    Grid.prototype.slugify = function(text) {
      return text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase();
    };
  
    return Grid;
  
  })(Backbone.View);
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.table=function(e){e||(e={});var t=[],n=function(e){var n=t,r;return t=[],e.call(this),r=t.join(""),t=n,i(r)},r=function(e){return e&&e.ecoSafe?e:typeof e!="undefined"&&e!=null?o(e):""},i,s=e.safe,o=e.escape;return i=e.safe=function(e){if(e&&e.ecoSafe)return e;if(typeof e=="undefined"||e==null)e="";var t=new String(e);return t.ecoSafe=!0,t},o||(o=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<h4>G-ialpha65A</h4>\n<table class="faux">\n    <thead>\n        <tr>\n            <th></th>\n        </tr>\n    </thead>\n</table>\n<div class="wrapper"></div>')}).call(this)}.call(e),e.safe=s,e.escape=o,t.join("")};
  
  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK .faux{margin:0;border-bottom:0}div#w#@+CALLBACK .wrapper{overflow:auto;overflow-x:hidden;height:305px}div#w#@+CALLBACK .wrapper table{width:100%;margin-top:-39px}div#w#@+CALLBACK .wrapper table thead{visibility:hidden}';
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