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
 *  Generated: Thu, 04 Oct 2012 15:07:52 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  var AssertException, Widget;
  
  AssertException = (function() {
  
    function AssertException(message) {
      this.message = message;
    }
  
    AssertException.prototype.toString = function() {
      return "AssertException: " + this.message;
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
  
  Widget = (function() {
  
    Widget.prototype.chartOptions = {
      fontName: 'Sans-Serif',
      fontSize: 9,
      colors: ['#8E0022'],
      legend: {
        position: 'none'
      },
      hAxis: {
        title: 'Log2 Ratios',
        titleTextStyle: {
          fontName: 'Sans-Serif'
        }
      },
      vAxis: {
        title: 'Number of Experiments',
        titleTextStyle: {
          fontName: 'Sans-Serif'
        }
      }
    };
  
    /*
        Have access to config and templates compiled in.
        This function needs to always be present and will always accept the following two Objects.
        By using the at sign I am saving the two parameters on `this` object.
        @param {Object} config A key value dictionary of config coming from the server.
        @param {Object} templates A key value dictionary of template functions.
    */
  
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      assert(this.config.mine != null, '`mine` needs to point to an InterMine instance');
      this.service = new intermine.Service({
        'root': "" + this.config.mine + "service/"
      });
    }
  
    /*
        Render accepts a target to draw results into.
        This function needs to always be present and will always accept the target string.
        @param {jQuery selector} target Either a string or a jQuery selected object where to draw the output to.
    */
  
  
    Widget.prototype.render = function(target) {
      var pq, replaceType, _ref,
        _this = this;
      this.target = target;
      assert((this.config.pathQueries != null) && (this.config.pathQueries.expressionScores != null), 'PathQuery of `expressionScores` not set');
      assert(this.config.type, 'an object `type` needs to be set');
      assert(this.config.symbol, 'an object `symbol` needs to be set');
      $(this.target).html(this.templates.chart());
      pq = (replaceType = function(obj, type) {
        var item, key, o, value, _i, _len, _results;
        if (typeof obj === 'object') {
          o = {};
          for (key in obj) {
            value = obj[key];
            o[key] = replaceType(value, type);
          }
          return o;
        } else if (obj instanceof Array) {
          _results = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            item = obj[_i];
            _results.push(replaceType(item, type));
          }
          return _results;
        } else if (typeof obj === 'string') {
          return obj.replace(/TYPE/g, type);
        }
      })(this.config.pathQueries.expressionScores, this.config.type);
      if ((_ref = pq.constraints) == null) {
        pq.constraints = [];
      }
      pq.constraints.push({
        'path': this.config.type,
        'op': 'LOOKUP',
        'value': this.config.symbol
      });
      return this.service.query(pq, function(q) {
        return q.rows(function(rows) {
          var data, twoDArray, x;
          rows = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = rows.length; _i < _len; _i++) {
              x = rows[_i];
              _results.push(x.pop());
            }
            return _results;
          })();
          x = d3.scale.linear().domain([-20, 20]).range([-20, 20]);
          data = d3.layout.histogram().bins(x.ticks(20))(rows);
          twoDArray = _(data).map(function(bin) {
            var from;
            from = x(bin.x);
            return ["" + from + " to " + (from + 2), bin.y];
          });
          return google.load('visualization', '1.0', {
            'packages': ['corechart'],
            callback: function() {
              var chart, t;
              (t = $(_this.target).find('.chart')).empty();
              chart = new google.visualization.ColumnChart(t[0]);
              return chart.draw(google.visualization.arrayToDataTable(twoDArray, false), _this.chartOptions);
            }
          });
        });
      });
    };
  
    return Widget;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.chart=function(e){e||(e={});var t=[],n=function(e){var n=t,r;return t=[],e.call(this),r=t.join(""),t=n,i(r)},r=function(e){return e&&e.ecoSafe?e:typeof e!="undefined"&&e!=null?o(e):""},i,s=e.safe,o=e.escape;return i=e.safe=function(e){if(e&&e.ecoSafe)return e;if(typeof e=="undefined"||e==null)e="";var t=new String(e);return t.ecoSafe=!0,t},o||(o=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<header>    \n    <h4>SPELL Expression Summary</h4>\n</header>\n\n<div class="chart">\n    <div class="alert-box">Loading &hellip;</div>\n</div>')}).call(this)}.call(e),e.safe=s,e.escape=o,t.join("")};
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