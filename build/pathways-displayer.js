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
 *  Generated: Wed, 24 Oct 2012 12:26:04 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  var Grid, Widget,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  Widget = (function() {
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
    }
  
    Widget.prototype.render = function(target) {
      var data, grid, mine, mines, _i, _len, _results;
      this.target = target;
      mines = ['FlyMine', 'CoalMine', 'GoldMine'];
      data = [
        {
          'name': "FlyMine",
          'pathways': ["glycoLysis", "Glucuronic acid", "Lipogenesis", "Citric acid cycle", "Oxidative phosphorylation"]
        }, {
          'name': "GoldMine",
          'pathways': ["Nitrogen metabolism", "Glycolysis", "Oxidative phosphorylation", "Inositol", "glucuronic acid"]
        }, {
          'name': "CoalMine",
          'pathways': ["citric acid CYCLE", "Lipogenesis", "inositol", "Nitrogen metabolism"]
        }
      ];
      $(this.target).append(target = $('<table/>'));
      grid = new Grid(target, mines);
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        mine = data[_i];
        _results.push((function(mine) {
          var pathway, _j, _len1, _ref, _results1;
          _ref = mine.pathways;
          _results1 = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            pathway = _ref[_j];
            _results1.push((function(mine, pathway) {
              return grid.add(pathway, mine['name'], $("<span/>", {
                'class': 'label label-success',
                'text': 'Yes'
              }));
            })(mine, pathway));
          }
          return _results1;
        })(mine));
      }
      return _results;
    };
  
    return Widget;
  
  })();
  
  /* Maintain and dynamically update data in a grid/table.
  */
  
  
  Grid = (function() {
  
    Grid.prototype.columns = [];
  
    Grid.prototype.rows = [];
  
    Grid.prototype.grid = {};
  
    function Grid(el, head) {
      var column, columnS, row, _i, _len;
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
      var columnS, rowEl, rowS,
        _this = this;
      rowS = this.slugify(row);
      columnS = this.slugify(column);
      if (__indexOf.call(this.rows, rowS) < 0) {
        rowEl = $("<tr/>", {
          'class': rowS
        }).append($("<td/>", {
          'text': row
        }));
        if (!this.rows.length) {
          this.body.append(rowEl);
          this.rows = [rowS];
        } else {
          (function() {
            var index, _ref;
            _ref = _this.rows;
            for (index in _ref) {
              row = _ref[index];
              if (rowS.localeCompare(row) < 0) {
                _this.rows.splice(index, 0, rowS);
                _this.grid[row]['el'].before(rowEl);
                return;
              }
            }
            _this.rows.push(rowS);
            return _this.body.append(rowEl);
          })();
        }
        (function() {
          var _i, _len, _ref, _results;
          _this.grid[rowS] = {
            'el': rowEl,
            'columns': {}
          };
          _ref = _this.columns;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            columnS = _ref[_i];
            _results.push(_this.grid[rowS]['columns'][columnS] = (function() {
              var el;
              rowEl.append(el = $('<td/>', {
                'class': columnS
              }));
              return el;
            })());
          }
          return _results;
        })();
      }
      return this.grid[rowS]['columns'][columnS].html(data);
    };
  
    Grid.prototype.slugify = function(text) {
      return text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').replace(/-/gi, "_").replace(/\s/gi, "-").toLowerCase();
    };
  
    return Grid;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
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