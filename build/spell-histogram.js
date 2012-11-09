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
 *  Generated: Fri, 09 Nov 2012 17:00:23 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  var AssertException, Widget,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  
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
      this.histogram = __bind(this.histogram, this);
  
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
      var _this = this;
      this.target = target;
      assert((this.config.pathQueries != null) && (this.config.pathQueries.expressionScores != null), 'PathQuery of `expressionScores` not set');
      assert(this.config.type, 'an object `type` needs to be set');
      assert(this.config.symbol, 'an object `symbol` needs to be set');
      $(this.target).html(this.templates.chart({
        'symbol': this.config.symbol
      }));
      $(this.target).find('input.symbol').keyup(function(e) {
        var symbol;
        symbol = $(e.target).val();
        if (symbol !== _this.config.symbol) {
          _this.config.symbol = symbol;
          return _this.histogram();
        }
      });
      return google.load('visualization', '1.0', {
        'packages': ['corechart'],
        callback: function() {
          return _this.histogram();
        }
      });
    };
  
    Widget.prototype.histogram = function() {
      var error, finP, loading, pq, replaceType, rowsP, serviceP, _ref,
        _this = this;
      $(this.target).prepend(loading = $('<div class="alert-box">Loading &hellip;</div>'));
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
      serviceP = function(service, pq) {
        return service.query(pq);
      };
      rowsP = function(q) {
        return q.rows();
      };
      error = function(err) {
        return loading.text(err.error).addClass('alert');
      };
      finP = function(rows) {
        var chart, data, twoDArray, x;
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
          from = Math.round(x(bin.x));
          return ["" + from + " to " + (from + 2), bin.y];
        });
        loading.remove();
        chart = new google.visualization.ColumnChart($(_this.target).find('.chart')[0]);
        return chart.draw(google.visualization.arrayToDataTable(twoDArray, false), _this.chartOptions);
      };
      return $.when(serviceP(this.service, pq)).then(rowsP).then(finP).fail(error);
    };
  
    return Widget;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.chart=function(e){e||(e={});var t=[],n=function(e){var n=t,r;return t=[],e.call(this),r=t.join(""),t=n,i(r)},r=function(e){return e&&e.ecoSafe?e:typeof e!="undefined"&&e!=null?o(e):""},i,s=e.safe,o=e.escape;return i=e.safe=function(e){if(e&&e.ecoSafe)return e;if(typeof e=="undefined"||e==null)e="";var t=new String(e);return t.ecoSafe=!0,t},o||(o=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<header>    \n    <h4>SPELL Expression Summary for</h4> <input type="text" placeholder="S000001855" class="symbol three columns" value="'),t.push(r(this.symbol)),t.push('" />\n</header>\n\n<div class="chart"></div>')}).call(this)}.call(e),e.safe=s,e.escape=o,t.join("")};
  
  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK h4{float:left}div#w#@+CALLBACK header:after{content:" ";display:block;clear:both}div#w#@+CALLBACK input.symbol{color:#8E0022;background:0;border:0;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;font-family:\'Droid Serif\',serif;font-size:23px;font-weight:700;padding:0;margin:10px 0;margin-left:4px}';
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