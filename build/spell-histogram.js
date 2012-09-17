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
 *  Generated: Mon, 17 Sep 2012 13:54:48 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  var Widget;
  
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
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
    }
  
    Widget.prototype.data = function() {
      var columns, data, i;
      data = [0, 0, 0, 0, 0, 1, 5, 17, 115, 2028, 3347, 176, 50, 368, 692, 64, 155, 29, 9, 0];
      columns = [];
      i = -18;
      while (i !== 22) {
        columns.push("" + (i - 2) + " to " + i);
        i += 2;
      }
      return _(columns).map(function(label, i) {
        return [label, data[i]];
      });
    };
  
    Widget.prototype.render = function(target) {
      var twoDArray,
        _this = this;
      this.target = target;
      $(this.target).html(this.templates.chart());
      twoDArray = this.data();
      return google.load('visualization', '1.0', {
        'packages': ['corechart'],
        callback: function() {
          var chart;
          chart = new google.visualization.ColumnChart($(_this.target).find('.chart')[0]);
          return chart.draw(google.visualization.arrayToDataTable(twoDArray, false), _this.chartOptions);
        }
      });
    };
  
    return Widget;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.chart=function(e){e||(e={});var t=[],n=function(e){var n=t,r;return t=[],e.call(this),r=t.join(""),t=n,i(r)},r=function(e){return e&&e.ecoSafe?e:typeof e!="undefined"&&e!=null?o(e):""},i,s=e.safe,o=e.escape;return i=e.safe=function(e){if(e&&e.ecoSafe)return e;if(typeof e=="undefined"||e==null)e="";var t=new String(e);return t.ecoSafe=!0,t},o||(o=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<header>    \n    <h4>SPELL Expression Summary</h4>\n</header>\n\n<div class="chart"></div>')}).call(this)}.call(e),e.safe=s,e.escape=o,t.join("")};
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