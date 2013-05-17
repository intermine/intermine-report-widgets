require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({"ontology-widget":[function(require,module,exports){
module.exports=require('FbWzRJ');
},{}],1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"FbWzRJ":[function(require,module,exports){
(function(process){(function(){
  var DEFAULT_GRAPH_STATE, $, dagify, ref$, map, id, each, first, zipAll, objectify, GraphState, getGraphState, OntologyWidget, Widget, slice$ = [].slice;
  DEFAULT_GRAPH_STATE = {
    view: 'Dag',
    smallGraphThreshold: 20,
    jiggle: null,
    spline: 'curved',
    dagDirection: 'LR',
    maxmarked: 20,
    tickK: 15,
    translate: [5, 5],
    elision: null
  };
  $ = jQuery;
  dagify = require('./dagify');
  ref$ = require('prelude-ls'), map = ref$.map, id = ref$.id, each = ref$.each, first = ref$.first, zipAll = ref$.zipAll;
  objectify = require('./util').objectify;
  GraphState = require('./state');
  getGraphState = function(config){
    var initVals, data;
    initVals = {
      root: null,
      animating: 'waiting'
    };
    data = import$(import$(import$({}, DEFAULT_GRAPH_STATE), initVals), config.graphState);
    if (data.query == null) {
      throw new Error("No query provided.");
    }
    return new GraphState(data);
  };
  OntologyWidget = (function(superclass){
    var prototype = extend$((import$(OntologyWidget, superclass).displayName = 'OntologyWidget', OntologyWidget), superclass).prototype, constructor = OntologyWidget;
    prototype.initialize = function(config, templates){
      var Service;
      this.config = config;
      this.templates = templates;
      Service = intermine.Service;
      this.service = new Service(this.config.service);
      this.model = getGraphState(this.config);
      return this.interopMines = objectify(function(it){
        return it.taxonId;
      }, function(grp){
        var name;
        name = grp.name;
        return (function(it){
          return it.name = name, it;
        })(new Service(grp));
      })(
      this.config.interop);
    };
    prototype.toString = function(){
      return "[OntologyWidget(" + this.cid + ")]";
    };
    prototype.render = function(target){
      var elem;
      elem = $(target)[0];
      this.setElement(elem);
      if (!this.model.has('dimensions')) {
        this.model.set({
          dimensions: {
            w: elem.offsetWidth,
            h: elem.offsetHeight || 600
          }
        });
      }
      this.renderChrome();
      this.startListening();
      this.loadData();
      return this;
    };
    OntologyWidget.BINDINGS = {
      tickK: '.min-ticks',
      jiggle: '.jiggle',
      spline: '.spline',
      view: '.graph-view',
      dagDirection: '.dag-direction'
    };
    prototype.startListening = function(){
      var key, ref$, sel, this$ = this;
      for (key in ref$ = constructor.BINDINGS) {
        sel = ref$[key];
        fn$();
      }
      this.listenTo(this.model, 'change:query', this.loadData);
      this.listenTo(this.model, 'change:query', bind$(this, 'resetHomologyButtons'));
      this.listenTo(this.model, 'change:heights', this.fillElisionSelector);
      this.listenTo(this.model, 'change:root', this.onRootChange);
      this.listenTo(this.model, 'change:elision', function(m, elision){
        return this$.$('.elision').val(elision);
      });
      this.listenTo(this.model, 'change:all', bind$(this, 'renderRoots'));
      this.listenTo(this.model, 'change:all', function(m, graph){
        return m.set({
          root: first(graph.getRoots())
        });
      });
      this.listenTo(this.model, 'change:graph change:view change:dagDirection', bind$(this, 'presentGraph'));
      this.listenTo(this.model, 'nodes:marked change:all', bind$(this, 'showOntologyTable'));
      this.on('controls:changed', function(){
        return this$.$el.foundation();
      });
      return this.on('graph:reset', function(){
        this$.model.get('all').unmark();
        return this$.model.trigger('nodes:marked');
      });
      function fn$(sel){
        return this$.listenTo(this$.model, 'change:' + key, function(m, v){
          return this$.$(sel).val(v);
        });
      }
    };
    prototype.onRootChange = function(){
      var root;
      root = this.model.get('root');
      console.log("Root is now " + (root != null ? root.id : void 8) + ": " + (root != null ? root.label : void 8));
      if (root != null) {
        return this.$('.graph-root').val(root.id);
      }
    };
    prototype.renderRoots = function(){
      var roots, select, i$, ref$, len$, r;
      roots = this.model.get('all').getRoots();
      select = this.$('select.graph-root').empty();
      for (i$ = 0, len$ = (ref$ = roots.concat({
        id: null,
        label: 'All'
      })).length; i$ < len$; ++i$) {
        r = ref$[i$];
        select.append("<option value=\"" + r.id + "\">" + r.label + "</option>");
      }
      return this.trigger('controls:changed');
    };
    prototype.presentGraph = function(){
      var view, render, this$ = this;
      console.log("Presenting graph to the world");
      view = this.model.get('view');
      render = dagify['render' + view] || dagify.renderDag;
      return process.nextTick(function(){
        return render(this$.model, this$.model.get('graph'));
      });
    };
    prototype.resetHomologyButtons = function(){
      return this.$('.interop-sources a').removeClass('disabled');
    };
    prototype.fillElisionSelector = function(){
      var elisionSelector, i$, ref$, len$, h, text, level;
      elisionSelector = this.$('select.elision');
      elisionSelector.empty();
      for (i$ = 0, len$ = (ref$ = this.model.get('heights')).length; i$ < len$; ++i$) {
        h = ref$[i$];
        text = h === 0
          ? "Show all terms"
          : h === 1
            ? "Show only direct terms, and the root term"
            : "Show all terms within " + h + " steps of a directly annotated term";
        elisionSelector.append("<option value=\"" + h + "\">" + text + "</option>");
      }
      this.trigger('controls:changed');
      if (level = this.model.get('elision')) {
        return elisionSelector.val(level);
      }
    };
    prototype.renderChrome = function(){
      var key, ref$, sel;
      this.$el.html(this.templates['widget.html']());
      for (key in ref$ = Widget.BINDINGS) {
        sel = ref$[key];
        this.$(sel).val(this.model.get(key));
      }
      this.model.set('svg', first(this.$el.find('svg')));
      this.setUpOntologyTable();
      return this.setupInterop();
    };
    prototype.setUpOntologyTable = function(){
      var ref$, w, h, table;
      ref$ = this.model.get('dimensions'), w = ref$.w, h = ref$.h;
      table = this.$('.ontology-table').addClass('open').css({
        top: 0.05 * h,
        left: w - 50,
        height: 0.9 * h,
        width: 0.6 * w
      });
      table.find('.scroll-container').css({
        'max-height': 0.8 * h
      });
      return table.find('table').addClass('tablesorter').tablesorter();
    };
    prototype.setupInterop = function(){
      var $ul, self, toOption;
      $ul = this.$('.interop-sources');
      self = this;
      toOption = function(group){
        var $li;
        $li = $("<li><a class=\"small button\">" + group.name + "</a></li>");
        return $li.find('a').on('click', function(){
          var $this;
          $this = $(this);
          if ($this.hasClass('disabled')) {
            return;
          }
          $this.addClass('disabled');
          return self.addDataFrom(group.taxonId);
        });
      };
      return each(compose$([bind$($ul, 'append'), toOption]), this.config.interop);
    };
    prototype.addDataFrom = function(taxonId){
      var service, graph, query, monitor, merging, this$ = this;
      service = this.interopMines[taxonId];
      graph = this.model.get('all');
      query = this.model.get('query');
      monitor = dagify.progressMonitor(this.$('.homologue-progress'));
      merging = dagify.fetchAndMergeHomology(monitor, this.service, service, graph, query, taxonId);
      merging.fail(this.reportError);
      merging.done(function(merged){
        return this$.annotate(merged);
      });
      merging.done(function(merged){
        return this$.model.set({
          all: merged
        });
      });
      return merging.done(function(merged){
        return this$.model.set({
          roots: merged.getRoots()
        });
      });
    };
    prototype.linkRow = function(link){
      var evt, $row, this$ = this;
      evt = 'relationship:highlight';
      $row = $(this.templates['ontologyRelationshipRow.html'](link));
      return $row.on('mouseout', function(){
        $row.removeClass('highlit');
        return this$.model.trigger(evt, null);
      }).on('mouseover', function(){
        $row.addClass('highlit');
        return this$.model.trigger(evt, link);
      });
    };
    prototype.termRow = function(term){
      var evt, $row, this$ = this;
      evt = 'term:highlight';
      $row = $(this.templates['ontologyTermRow.html'](term));
      return $row.on('mouseout', function(){
        $row.removeClass('highlit');
        return this$.model.trigger(evt, null);
      }).on('mouseover', function(){
        $row.addClass('highlit');
        return this$.model.trigger(evt, term);
      });
    };
    prototype.showOntologyTable = function(){
      var ref$, w, h, markedStatements, $tables, templates, filters, ontologyTable, i$, len$, ref1$, $el, tmpl, f;
      ref$ = this.model.get('dimensions'), w = ref$.w, h = ref$.h;
      markedStatements = this.model.get('all').getMarkedStatements();
      console.log("Got " + markedStatements.length + " marked statements");
      $tables = map(bind$(this, '$'), ['.marked-statements', '.marked-terms']);
      templates = [bind$(this, 'linkRow'), bind$(this, 'termRow')];
      filters = [id, dagify.edgesToNodes];
      each(function(it){
        return it.find('tbody').empty();
      }, $tables);
      ontologyTable = this.$('.ontology-table');
      if (markedStatements.length) {
        for (i$ = 0, len$ = (ref$ = zipAll($tables, templates, filters)).length; i$ < len$; ++i$) {
          ref1$ = ref$[i$], $el = ref1$[0], tmpl = ref1$[1], f = ref1$[2];
          each(compose$([bind$($el, 'append'), tmpl]), f(markedStatements));
        }
        ontologyTable.show().foundation('section', 'reflow').find('table').trigger('update');
        return this.toggleOntologyTable();
      } else {
        return ontologyTable.animate({
          left: w - 50
        }, function(){
          return ontologyTable.removeClass('open').hide();
        });
      }
    };
    prototype.events = function(){
      var state, evts, key, ref$, sel, this$ = this;
      state = this.model;
      evts = {
        'submit .graph-control': function(e){
          return e.preventDefault();
        },
        'click .graph-control .resizer': 'toggleDisplayOptions',
        'click .graph-reset': function(){
          return this$.trigger('graph:reset');
        },
        'click .marked-terms .description .more': function(it){
          return $(it.target).hide().prev().hide().end().next().show();
        }
      };
      for (key in ref$ = Widget.BINDINGS) {
        sel = ref$[key];
        evts['change ' + sel] = compose$([partialize$.apply(state, [state.set, [key, void 8], [1]]), fn$]);
      }
      evts['click .button.symbol'] = function(){
        var newSymbol;
        newSymbol = this.$('input.symbol').val();
        return state.set({
          query: newSymbol
        });
      };
      evts['change .graph-root'] = function(e){
        var rootId;
        rootId = $(e.target).val();
        return state.set({
          root: state.get('all').getNode(rootId)
        });
      };
      evts['change .elision'] = function(it){
        return state.set('elision', parseInt($(it.target).val(), 10));
      };
      evts['click .slide-control'] = bind$(this, 'toggleOntologyTable');
      return evts;
      function fn$(it){
        return $(it.target).val();
      }
    };
    prototype.toggleOntologyTable = function(event){
      var getLeft, table, wasOpen, icon, this$ = this;
      getLeft = function(isOpen){
        var w;
        w = $('body').outerWidth();
        return w - 50 - (isOpen
          ? 0
          : this$.$('.ontology-table .section-container').outerWidth());
      };
      table = this.$('.ontology-table');
      wasOpen = !event || table.hasClass('open');
      table.toggleClass('open').animate({
        left: getLeft(wasOpen)
      });
      return icon = $('.slide-control i').removeClass('icon-chevron-right icon-chevron-left').addClass(wasOpen ? 'icon-chevron-left' : 'icon-chevron-right');
    };
    prototype.toggleDisplayOptions = function(){
      this.$('.graph-control .resizer').toggleClass('icon-resize-small icon-resize-full');
      return this.$('.graph-control .hidable').slideToggle();
    };
    prototype.loadData = function(){
      var monitor, building, this$ = this;
      monitor = dagify.progressMonitor(this.$('.dag .progress'));
      building = dagify.graphify(monitor, this.service.rows, this.model.get('query'));
      building.fail(this.reportError);
      building.done(function(graph){
        return this$.annotate(graph);
      });
      building.done(function(graph){
        return this$.model.set({
          all: graph
        });
      });
      return building.done(function(graph){
        return this$.model.set({
          roots: graph.getRoots()
        });
      });
    };
    prototype.annotate = function(graph){
      var this$ = this;
      dagify.annotateForCounts(this.service.query, graph.nodes);
      return dagify.doHeightAnnotation(graph.nodes).done(function(){
        this$.model.set({
          heights: graph.getHeights()
        });
        return this$.model.trigger('annotated:height');
      });
    };
    prototype.reportError = function(e){
      return alert("Error: " + e);
    };
    function OntologyWidget(){
      this.loadData = bind$(this, 'loadData', prototype);
      this.fillElisionSelector = bind$(this, 'fillElisionSelector', prototype);
      this.onRootChange = bind$(this, 'onRootChange', prototype);
      OntologyWidget.superclass.apply(this, arguments);
    }
    return OntologyWidget;
  }(Backbone.View));
  Widget = OntologyWidget;
  module.exports = OntologyWidget;
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function partialize$(f, args, where){
    var context = this;
    return function(){
      var params = slice$.call(arguments), i,
          len = params.length, wlen = where.length,
          ta = args ? args.concat() : [], tw = where ? where.concat() : [];
      for(i = 0; i < len; ++i) { ta[tw[0]] = params[i]; tw.shift(); }
      return len < wlen && len ?
        partialize$.apply(context, [f, ta, tw]) : f.apply(context, ta);
    };
  }
}).call(this);

})(require("__browserify_process"))
},{"./dagify":2,"./state":3,"./util":4,"prelude-ls":5,"__browserify_process":1}],5:[function(require,module,exports){
var Func, List, Obj, Str, Num, id, isType, replicate, prelude, toString$ = {}.toString;
Func = require('./Func.js');
List = require('./List.js');
Obj = require('./Obj.js');
Str = require('./Str.js');
Num = require('./Num.js');
id = function(x){
  return x;
};
isType = curry$(function(type, x){
  return toString$.call(x).slice(8, -1) === type;
});
replicate = curry$(function(n, x){
  var i$, results$ = [];
  for (i$ = 0; i$ < n; ++i$) {
    results$.push(x);
  }
  return results$;
});
Str.empty = List.empty;
Str.slice = List.slice;
Str.take = List.take;
Str.drop = List.drop;
Str.splitAt = List.splitAt;
Str.takeWhile = List.takeWhile;
Str.dropWhile = List.dropWhile;
Str.span = List.span;
Str.breakStr = List.breakList;
prelude = {
  Func: Func,
  List: List,
  Obj: Obj,
  Str: Str,
  Num: Num,
  id: id,
  isType: isType,
  replicate: replicate
};
prelude.each = List.each;
prelude.map = List.map;
prelude.filter = List.filter;
prelude.compact = List.compact;
prelude.reject = List.reject;
prelude.partition = List.partition;
prelude.find = List.find;
prelude.head = List.head;
prelude.first = List.first;
prelude.tail = List.tail;
prelude.last = List.last;
prelude.initial = List.initial;
prelude.empty = List.empty;
prelude.reverse = List.reverse;
prelude.difference = List.difference;
prelude.intersection = List.intersection;
prelude.union = List.union;
prelude.countBy = List.countBy;
prelude.groupBy = List.groupBy;
prelude.fold = List.fold;
prelude.foldl = List.foldl;
prelude.fold1 = List.fold1;
prelude.foldl1 = List.foldl1;
prelude.foldr = List.foldr;
prelude.foldr1 = List.foldr1;
prelude.unfoldr = List.unfoldr;
prelude.andList = List.andList;
prelude.orList = List.orList;
prelude.any = List.any;
prelude.all = List.all;
prelude.unique = List.unique;
prelude.sort = List.sort;
prelude.sortWith = List.sortWith;
prelude.sortBy = List.sortBy;
prelude.sum = List.sum;
prelude.product = List.product;
prelude.mean = List.mean;
prelude.average = List.average;
prelude.concat = List.concat;
prelude.concatMap = List.concatMap;
prelude.flatten = List.flatten;
prelude.maximum = List.maximum;
prelude.minimum = List.minimum;
prelude.scan = List.scan;
prelude.scanl = List.scanl;
prelude.scan1 = List.scan1;
prelude.scanl1 = List.scanl1;
prelude.scanr = List.scanr;
prelude.scanr1 = List.scanr1;
prelude.slice = List.slice;
prelude.take = List.take;
prelude.drop = List.drop;
prelude.splitAt = List.splitAt;
prelude.takeWhile = List.takeWhile;
prelude.dropWhile = List.dropWhile;
prelude.span = List.span;
prelude.breakList = List.breakList;
prelude.zip = List.zip;
prelude.zipWith = List.zipWith;
prelude.zipAll = List.zipAll;
prelude.zipAllWith = List.zipAllWith;
prelude.apply = Func.apply;
prelude.curry = Func.curry;
prelude.flip = Func.flip;
prelude.fix = Func.fix;
prelude.split = Str.split;
prelude.join = Str.join;
prelude.lines = Str.lines;
prelude.unlines = Str.unlines;
prelude.words = Str.words;
prelude.unwords = Str.unwords;
prelude.chars = Str.chars;
prelude.unchars = Str.unchars;
prelude.values = Obj.values;
prelude.keys = Obj.keys;
prelude.pairsToObj = Obj.pairsToObj;
prelude.objToPairs = Obj.objToPairs;
prelude.listsToObj = Obj.listsToObj;
prelude.objToLists = Obj.objToLists;
prelude.max = Num.max;
prelude.min = Num.min;
prelude.negate = Num.negate;
prelude.abs = Num.abs;
prelude.signum = Num.signum;
prelude.quot = Num.quot;
prelude.rem = Num.rem;
prelude.div = Num.div;
prelude.mod = Num.mod;
prelude.recip = Num.recip;
prelude.pi = Num.pi;
prelude.tau = Num.tau;
prelude.exp = Num.exp;
prelude.sqrt = Num.sqrt;
prelude.ln = Num.ln;
prelude.pow = Num.pow;
prelude.sin = Num.sin;
prelude.tan = Num.tan;
prelude.cos = Num.cos;
prelude.acos = Num.acos;
prelude.asin = Num.asin;
prelude.atan = Num.atan;
prelude.atan2 = Num.atan2;
prelude.truncate = Num.truncate;
prelude.round = Num.round;
prelude.ceiling = Num.ceiling;
prelude.floor = Num.floor;
prelude.isItNaN = Num.isItNaN;
prelude.even = Num.even;
prelude.odd = Num.odd;
prelude.gcd = Num.gcd;
prelude.lcm = Num.lcm;
prelude.VERSION = '1.0.0';
module.exports = prelude;
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}

},{"./Func.js":6,"./List.js":7,"./Obj.js":8,"./Str.js":9,"./Num.js":10}],2:[function(require,module,exports){
/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */
(function(){
  var util, preludeLs, isType, map, concatMap, fold, sortBy, empty, filter, reject, find, flip, id, sort, mean, sum, sin, cos, values, any, each, join, all, zip, head, unique, minimum, maximum, min, max, ln, reverse, pairsToObj, markSubtree, anyTest, notify, failWhenEmpty, objectify, error, len, within, Graph, ref$, Node, newNode, renderDag, renderForce, GraphState, $, nonCuratedEvidenceCodes, directTerms, getHomologyWhereClause, directHomologyTerms, allGoTerms, flatten, flatRows, allHomologyTerms, wholeGraphQ, countQuery, homologueQuery, fetchNames, rowToNode, getGeneSymbol, graphify, _graphify, fetchAndMergeHomology, markDepth, annotateForHeight, doHeightAnnotation, setInto, cacheFunc, mergeGraphs, edgeToNodes, annotateForCounts, monitorProgress, progressMonitor, edgesToNodes, missingNodeMsg, makeGraph;
  util = require('./util.js');
  preludeLs = require('prelude-ls');
  isType = preludeLs.isType, map = preludeLs.map, concatMap = preludeLs.concatMap, fold = preludeLs.fold, sortBy = preludeLs.sortBy, empty = preludeLs.empty, filter = preludeLs.filter, reject = preludeLs.reject, find = preludeLs.find, flip = preludeLs.flip, id = preludeLs.id, sort = preludeLs.sort, mean = preludeLs.mean, sum = preludeLs.sum, sin = preludeLs.sin, cos = preludeLs.cos, values = preludeLs.values, any = preludeLs.any, each = preludeLs.each, join = preludeLs.join, all = preludeLs.all, zip = preludeLs.zip, head = preludeLs.head, unique = preludeLs.unique, minimum = preludeLs.minimum, maximum = preludeLs.maximum, min = preludeLs.min, max = preludeLs.max, ln = preludeLs.ln, reverse = preludeLs.reverse, pairsToObj = preludeLs.pairsToObj;
  markSubtree = util.markSubtree, anyTest = util.anyTest, notify = util.notify, failWhenEmpty = util.failWhenEmpty, objectify = util.objectify, error = util.error, len = util.len, within = util.within;
  Graph = require('./graph').Graph;
  ref$ = require('./node'), Node = ref$.Node, newNode = ref$.newNode;
  renderDag = require('./dag').renderDag;
  renderForce = require('./force').renderForce;
  GraphState = require('./state');
  $ = jQuery;
  nonCuratedEvidenceCodes = ['IBA', 'IBD', 'IEA', 'IGC', 'IKR', 'ISA', 'ISO', 'ISS', 'RCA'];
  directTerms = function(constraints){
    return {
      select: ['goAnnotation.ontologyTerm.identifier'],
      from: 'Gene',
      where: constraints
    };
  };
  getHomologyWhereClause = function(genes){
    return {
      primaryIdentifier: genes,
      'goAnnotation.evidence.code.code': {
        'NONE OF': nonCuratedEvidenceCodes
      }
    };
  };
  directHomologyTerms = function(genes){
    return {
      select: ['goAnnotation.ontologyTerm.identifier'],
      from: 'Gene',
      where: getHomologyWhereClause(genes)
    };
  };
  allGoTerms = function(constraints){
    return {
      name: 'ALL-TERMS',
      select: ['goAnnotation.ontologyTerm.identifier', 'goAnnotation.ontologyTerm.parents.identifier'],
      from: 'Gene',
      where: constraints
    };
  };
  flatten = concatMap(id);
  flatRows = curry$(function(getRows, q){
    return getRows(q).then(compose$([unique, flatten]));
  });
  allHomologyTerms = function(children){
    return {
      name: 'ALL-HOMOLOGY',
      select: ['parents.identifier'],
      from: 'OntologyTerm',
      where: {
        identifier: children
      }
    };
  };
  wholeGraphQ = function(terms){
    return {
      name: 'EDGES',
      select: ['childTerm.identifier', 'relationship', 'parentTerm.identifier'],
      from: 'OntologyRelation',
      where: {
        'childTerm.identifier': terms,
        direct: 'true'
      }
    };
  };
  countQuery = function(terms){
    return {
      select: ['symbol'],
      from: 'Gene',
      where: {
        'goAnnotation.ontologyTerm.parents.identifier': terms
      }
    };
  };
  homologueQuery = curry$(function(symbol, targetOrganism){
    return {
      select: ['homologues.homologue.primaryIdentifier'],
      from: 'Gene',
      where: {
        symbol: [symbol],
        "homologues.homologue.organism.taxonId": targetOrganism
      }
    };
  });
  fetchNames = curry$(function(source, getRows, symbols, identifier){
    var q, node;
    q = {
      select: ['identifier', 'name', 'description'],
      from: 'OntologyTerm',
      where: {
        identifier: identifier
      }
    };
    node = newNode(source, symbols);
    return getRows(q).then(objectify(function(it){
      return it[0];
    }, function(it){
      return node.apply(null, it);
    }));
  });
  rowToNode = function(arg$){
    var source, label, target;
    source = arg$[0], label = arg$[1], target = arg$[2];
    return {
      target: target,
      label: label,
      source: source
    };
  };
  getGeneSymbol = function(getRows, id){
    var ref$;
    switch (ref$ = [id], false) {
    case !isType('Number')(ref$[0]):
      return compose$([flatRows, getRows])(
      {
        select: ['Gene.symbol'],
        where: {
          id: id
        }
      });
    default:
      return compose$([flatRows, getRows])(
      {
        select: ['Gene.symbol'],
        where: id
      });
    }
  };
  graphify = curry$(function(monitor, getRows, symbol){
    var ref$;
    switch (ref$ = [symbol], false) {
    case !isType('String')(ref$[0]):
      return _graphify(monitor, getRows, [symbol], {
        symbol: [symbol]
      });
    case !isType('Number')(ref$[0]):
      return _graphify(monitor, getRows, getGeneSymbol(getRows, symbol), {
        id: [symbol]
      });
    default:
      return _graphify(monitor, getRows, getGeneSymbol(getRows, symbol), symbol);
    }
  });
  _graphify = function(monitor, getRows, symbols, query){
    var fetchFlat, gettingDirect, gettingAll, gettingNames, gettingEdges;
    console.log("Drawing graph for:", query);
    fetchFlat = flatRows(getRows);
    gettingDirect = failWhenEmpty("No annotation found for " + query)(
    fetchFlat(
    directTerms(
    query)));
    gettingAll = fetchFlat(
    allGoTerms(
    query));
    gettingNames = $.when(symbols, gettingAll).then(fetchNames('flymine', getRows));
    gettingEdges = gettingAll.then(compose$([getRows, wholeGraphQ])).then(map(rowToNode));
    monitor([gettingDirect, gettingAll, gettingNames, gettingEdges]);
    return function(it){
      return it.then(makeGraph);
    }($.when(gettingDirect, gettingEdges, gettingNames));
  };
  fetchAndMergeHomology = function(monitor, homologyService, dataService, graph, query, source){
    var rs, mergeGraph, gettingHomologues, gettingDirect, gettingAll, gettingNames, gettingEdges;
    rs = flatRows(bind$(dataService, 'rows'));
    mergeGraph = mergeGraphs(graph);
    gettingHomologues = failWhenEmpty("No homologues found")(
    flatRows(bind$(homologyService, 'rows'))(
    homologueQuery(query, source)));
    gettingDirect = failWhenEmpty("No annotations found")(
    function(it){
      return it.then(compose$([rs, directHomologyTerms]));
    }(
    gettingHomologues));
    gettingAll = gettingDirect.then(compose$([rs, allHomologyTerms]));
    gettingNames = $.when(gettingHomologues, gettingAll).then(fetchNames(dataService.name, bind$(dataService, 'rows')));
    gettingEdges = gettingAll.then(compose$([bind$(dataService, 'rows'), wholeGraphQ])).then(map(rowToNode));
    monitor([gettingHomologues, gettingDirect, gettingAll, gettingNames, gettingEdges]);
    return $.when(gettingDirect, gettingEdges, gettingNames).then(compose$([mergeGraph, makeGraph]));
  };
  markDepth = function(node, depthAtNode, maxDepth){
    var nextDepth, i$, ref$, len$, target, results$ = [];
    node.depths.push(depthAtNode);
    nextDepth = depthAtNode + 1;
    if (nextDepth > maxDepth) {
      return;
    }
    for (i$ = 0, len$ = (ref$ = map(fn$, node.edges)).length; i$ < len$; ++i$) {
      target = ref$[i$];
      if (node !== target) {
        results$.push(markDepth(target, nextDepth, maxDepth));
      }
    }
    return results$;
    function fn$(it){
      return it.target;
    }
  };
  annotateForHeight = function(nodes, level){
    var leaves, i$, len$, leaf;
    level == null && (level = 50);
    leaves = filter(function(it){
      return it.isDirect;
    }, nodes);
    for (i$ = 0, len$ = leaves.length; i$ < len$; ++i$) {
      leaf = leaves[i$];
      markDepth(leaf, 0, level);
    }
    return each(function(it){
      return it.stepsFromLeaf = minimum(it.depths), it;
    }, nodes);
  };
  doHeightAnnotation = function(nodes){
    var def;
    def = $.Deferred(function(){
      var this$ = this;
      return setTimeout(function(){
        annotateForHeight(nodes);
        return this$.resolve();
      }, 0);
    });
    return def.promise();
  };
  setInto = function(m, k, v){
    return import$(m, pairsToObj([[k, v]]));
  };
  cacheFunc = function(arg$){
    var mapping, keyFunc, ref$;
    mapping = arg$[0], keyFunc = (ref$ = arg$[1]) != null ? ref$ : id;
    return compose$([
      function(it){
        return mapping[it];
      }, keyFunc
    ]);
  };
  mergeGraphs = curry$(function(left, right){
    var eKey, addNodeToMapping, addEdgeToMapping, f, attr, ref$, nodesById, edgesByKey, realNodes, realEdges, i$, len$, ref1$, n, real, e, source, target;
    console.log("Starting with " + len(left.nodes) + " nodes and " + len(left.edges) + " edges");
    eKey = function(e){
      return e.source.id + e.label + e.target.id;
    };
    addNodeToMapping = function(m, n){
      if (m[n.id]) {
        return m;
      } else {
        return setInto(m, n.id, n);
      }
    };
    addEdgeToMapping = function(m, e){
      var key;
      key = eKey(e);
      if (m[key]) {
        return m;
      } else {
        return setInto(m, key, e);
      }
    };
    ref$ = (function(){
      var i$, ref$, len$, ref1$, results$ = [];
      for (i$ = 0, len$ = (ref$ = [[addNodeToMapping, fn$], [addEdgeToMapping, fn1$]]).length; i$ < len$; ++i$) {
        ref1$ = ref$[i$], f = ref1$[0], attr = ref1$[1];
        results$.push(fold(f, {}, concatMap(attr, [left, right])));
      }
      return results$;
      function fn$(it){
        return it.nodes;
      }
      function fn1$(it){
        return it.edges;
      }
    }()), nodesById = ref$[0], edgesByKey = ref$[1];
    ref$ = map(cacheFunc, [
      [
        nodesById, function(it){
          return it.id;
        }
      ], [edgesByKey, eKey]
    ]), realNodes = ref$[0], realEdges = ref$[1];
    for (i$ = 0, len$ = (ref$ = zip(right.nodes, map(realNodes, right.nodes))).length; i$ < len$; ++i$) {
      ref1$ = ref$[i$], n = ref1$[0], real = ref1$[1];
      if (n === real) {
        real.root = realNodes(real.root);
        real.edges = map(realEdges, real.edges);
      } else {
        real.sources = real.sources.concat(n.sources);
        real.symbols = real.symbols.concat(n.symbols);
        real.isDirect || (real.isDirect = n.isDirect);
        real.edges = unique(real.edges.concat(map(realEdges, n.edges)));
      }
    }
    for (i$ = 0, len$ = (ref$ = zip(right.edges, map(realEdges, right.edges))).length; i$ < len$; ++i$) {
      ref1$ = ref$[i$], e = ref1$[0], real = ref1$[1];
      if (e === real) {
        ref1$ = map(compose$([realNodes, fn$]), [fn1$, fn2$]), source = ref1$[0], target = ref1$[1];
        e.source = source;
        e.target = target;
      }
    }
    return new Graph({
      nodes: values(nodesById),
      edges: values(edgesByKey)
    });
    function fn$(it){
      return it(e);
    }
    function fn1$(it){
      return it.source;
    }
    function fn2$(it){
      return it.target;
    }
  });
  edgeToNodes = function(arg$){
    var source, target;
    source = arg$.source, target = arg$.target;
    return [source, target];
  };
  annotateForCounts = function(makeQuery, nodes){
    var makingQ, summarising;
    makingQ = makeQuery(countQuery(map(function(it){
      return it.id;
    }, nodes)));
    summarising = makingQ.then(function(it){
      return it.summarise('goAnnotation.ontologyTerm.parents.identifier');
    }).then(objectify(function(it){
      return it.item;
    }, function(it){
      return it.count;
    }));
    return summarising.done(function(summary){
      return each(function(it){
        return it.addCount(summary[it.id]);
      }, nodes);
    });
  };
  monitorProgress = curry$(function(report, stages){
    var nStages, complete, stageComplete, onError;
    nStages = stages.length;
    complete = 0;
    stageComplete = function(){
      return report(++complete / nStages);
    };
    onError = function(){
      return report(1);
    };
    report(complete);
    each(function(it){
      return it.done(stageComplete);
    }, stages);
    return each(function(it){
      return it.fail(onError);
    }, stages);
  });
  progressMonitor = function(selector){
    var $progress;
    $progress = $(selector);
    return monitorProgress(function(progress){
      $progress.find('.meter').css('width', progress * 100 + "%");
      return $progress.toggle(progress < 1);
    });
  };
  edgesToNodes = compose$([unique, concatMap(edgeToNodes)]);
  missingNodeMsg = function(e, prop){
    return "Could not find node: " + e[prop] + ", the " + prop + " of " + (prop === 'source'
      ? e.target
      : e.source);
  };
  makeGraph = function(directNodes, edges, nodeForIdent){
    var i$, len$, e, j$, ref$, len1$, prop, node, nodes, isRoot, isLeaf, n;
    for (i$ = 0, len$ = edges.length; i$ < len$; ++i$) {
      e = edges[i$];
      for (j$ = 0, len1$ = (ref$ = ['source', 'target']).length; j$ < len1$; ++j$) {
        prop = ref$[j$];
        node = nodeForIdent[e[prop]];
        if (node == null) {
          throw new Error(missingNodeMsg(e, prop));
        }
        node.edges.push(e);
      }
    }
    for (i$ = 0, len$ = edges.length; i$ < len$; ++i$) {
      e = edges[i$];
      e.source = nodeForIdent[e.source];
      e.target = nodeForIdent[e.target];
    }
    nodes = values(nodeForIdent);
    isRoot = function(n){
      return all((function(it){
        return it === n;
      }), map(function(it){
        return it.target;
      }, n.edges));
    };
    isLeaf = function(n){
      return all((function(it){
        return it === n;
      }), map(function(it){
        return it.source;
      }, n.edges));
    };
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      n = nodes[i$];
      n.isDirect = in$(n.id, directNodes);
      n.isLeaf = isLeaf(n);
      n.isRoot = isRoot(n);
      n.marked = n.muted = false;
      if (n.isRoot) {
        markSubtree(n, 'root', n);
      }
    }
    return new Graph({
      nodes: nodes,
      edges: edges
    });
  };
  module.exports = {
    progressMonitor: progressMonitor,
    graphify: graphify,
    fetchAndMergeHomology: fetchAndMergeHomology,
    annotateForCounts: annotateForCounts,
    doHeightAnnotation: doHeightAnnotation,
    edgesToNodes: edgesToNodes,
    renderDag: renderDag,
    renderForce: renderForce
  };
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
}).call(this);

},{"./util.js":4,"./graph":11,"./node":12,"./dag":13,"./force":14,"./state":3,"prelude-ls":5}],15:[function(require,module,exports){
/*
Copyright (c) 2012 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function() {
  dagre = {};
dagre.version = "0.0.6";
/*
 * Directed multi-graph used during layout.
 */
dagre.graph = {};

/*
 * Creates a new directed multi-graph. This should be invoked with
 * `var g = dagre.graph()` and _not_ `var g = new dagre.graph()`.
 */
dagre.graph = function() {
  var nodes = {},
      inEdges = {},
      outEdges = {},
      edges = {},
      graph = {},
      idCounter = 0;

  graph.addNode = function(u, value) {
    if (graph.hasNode(u)) {
      throw new Error("Graph already has node '" + u + "':\n" + graph.toString());
    }
    nodes[u] = { id: u, value: value };
    inEdges[u] = {};
    outEdges[u] = {};
  }

  graph.delNode = function(u) {
    strictGetNode(u);

    graph.edges(u).forEach(function(e) { graph.delEdge(e); });

    delete inEdges[u];
    delete outEdges[u];
    delete nodes[u];
  }

  graph.node = function(u) {
    return strictGetNode(u).value;
  }

  graph.hasNode = function(u) {
    return u in nodes;
  }

  graph.addEdge = function(e, source, target, value) {
    strictGetNode(source);
    strictGetNode(target);

    if (e === null) {
      e = "_ANON-" + ++idCounter;
    }
    else if (graph.hasEdge(e)) {
      throw new Error("Graph already has edge '" + e + "':\n" + graph.toString());
    }

    edges[e] = { id: e, source: source, target: target, value: value };
    addEdgeToMap(inEdges[target], source, e);
    addEdgeToMap(outEdges[source], target, e);
  }

  graph.delEdge = function(e) {
    var edge = strictGetEdge(e);
    delEdgeFromMap(inEdges[edge.target], edge.source, e)
    delEdgeFromMap(outEdges[edge.source], edge.target, e)
    delete edges[e];
  }

  graph.edge = function(e) {
    return strictGetEdge(e).value;
  }

  graph.source = function(e) {
    return strictGetEdge(e).source;
  }

  graph.target = function(e) {
    return strictGetEdge(e).target;
  }

  graph.hasEdge = function(e) {
    return e in edges;
  }

  graph.successors = function(u) {
    strictGetNode(u);
    return keys(outEdges[u]).map(function(v) { return nodes[v].id; });
  }

  graph.predecessors = function(u) {
    strictGetNode(u);
    return keys(inEdges[u]).map(function(v) { return nodes[v].id; });
  }

  graph.neighbors = function(u) {
    strictGetNode(u);
    var vs = {};
    keys(outEdges[u]).map(function(v) { vs[v] = true; });
    keys(inEdges[u]).map(function(v) { vs[v] = true; });
    return keys(vs).map(function(v) { return nodes[v].id; });
  }

  graph.nodes = function() {
    var nodes = [];
    graph.eachNode(function(id, _) { nodes.push(id); });
    return nodes;
  }

  graph.eachNode = function(func) {
    for (var k in nodes) {
      var node = nodes[k];
      func(node.id, node.value);
    }
  }

  /*
   * Return all edges with no arguments,
   * the ones that are incident on a node (one argument),
   * or all edges from a source to a target (two arguments)
   */
  graph.edges = function(u, v) {
    var es, sourceEdges;
    if (!arguments.length) {
      es = [];
      graph.eachEdge(function(id) { es.push(id); });
      return es;
    } else if (arguments.length === 1) {
      return union([graph.inEdges(u), graph.outEdges(u)]);
    } else if (arguments.length === 2) {
      strictGetNode(u);
      strictGetNode(v);
      sourceEdges = outEdges[u];
      es = (v in sourceEdges) ? keys(sourceEdges[v].edges) : [];
      return es.map(function(e) { return edges[e].id });
    }
  };

  graph.eachEdge = function(func) {
    for (var k in edges) {
      var edge = edges[k];
      func(edge.id, edge.source, edge.target, edge.value);
    }
  }

  /*
   * Return all in edges to a target node
   */
  graph.inEdges = function(target) {
    strictGetNode(target);
    return concat(values(inEdges[target]).map(function(es) { return keys(es.edges); }));
  };

  /*
   * Return all out edges from a source node
   */
  graph.outEdges = function(source) {
    strictGetNode(source);
    return concat(values(outEdges[source]).map(function(es) { return keys(es.edges); }));
  };

  graph.subgraph = function(us) {
    var g = dagre.graph();
    us.forEach(function(u) {
      g.addNode(u, graph.node(u));
    });
    values(edges).forEach(function(e) {
      if (g.hasNode(e.source) && g.hasNode(e.target)) {
        g.addEdge(e.id, e.source, e.target, graph.edge(e.id));
      }
    });
    return g;
  };

  graph.toString = function() {
    var str = "GRAPH:\n";
    str += "    Nodes:\n";
    keys(nodes).forEach(function(u) {
      str += "        " + u + ": " + JSON.stringify(nodes[u].value) + "\n";
    });
    str += "    Edges:\n";
    keys(edges).forEach(function(e) {
      var edge = edges[e];
      str += "        " + e + " (" + edge.source + " -> " + edge.target + "): " + JSON.stringify(edges[e].value) + "\n";
    });
    return str;
  };

  function addEdgeToMap(map, v, e) {
    var vEntry = map[v];
    if (!vEntry) {
      vEntry = map[v] = { count: 0, edges: {} };
    }
    vEntry.count++;
    vEntry.edges[e] = true;
  }

  function delEdgeFromMap(map, v, e) {
    var vEntry = map[v];
    if (--vEntry.count == 0) {
      delete map[v];
    } else {
      delete vEntry.edges[e];
    }
  }

  function strictGetNode(u) {
    var node = nodes[u];
    if (!(u in nodes)) {
      throw new Error("Node '" + u + "' is not in graph:\n" + graph.toString());
    }
    return node;
  }

  function strictGetEdge(e) {
    var edge = edges[e];
    if (!edge) {
      throw new Error("Edge '" + e + "' is not in graph:\n" + graph.toString());
    }
    return edge;
  }

  return graph;
}
dagre.layout = function() {
  // External configuration
  var config = {
      // Nodes to lay out. At minimum must have `width` and `height` attributes.
      nodes: [],
      // Edges to lay out. At mimimum must have `source` and `target` attributes.
      edges: [],
      // How much debug information to include?
      debugLevel: 0,
  };

  var timer = createTimer();

  // Phase functions
  var
      acyclic = dagre.layout.acyclic(),
      rank = dagre.layout.rank(),
      order = dagre.layout.order(),
      position = dagre.layout.position();

  // This layout object
  var self = {};

  self.nodes = propertyAccessor(self, config, "nodes");
  self.edges = propertyAccessor(self, config, "edges");

  self.orderIters = delegateProperty(order.iterations);

  self.nodeSep = delegateProperty(position.nodeSep);
  self.edgeSep = delegateProperty(position.edgeSep);
  self.universalSep = delegateProperty(position.universalSep);
  self.rankSep = delegateProperty(position.rankSep);
  self.rankDir = delegateProperty(position.rankDir);
  self.debugAlignment = delegateProperty(position.debugAlignment);

  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
    acyclic.debugLevel(x);
    rank.debugLevel(x);
    order.debugLevel(x);
    position.debugLevel(x);
  });

  self.run = timer.wrap("Total layout", run);

  return self;

  // Build graph and save mapping of generated ids to original nodes and edges
  function init() {
    var g = dagre.graph();
    var nextId = 0;

    // Tag each node so that we can properly represent relationships when
    // we add edges. Also copy relevant dimension information.
    config.nodes.forEach(function(u) {
      var id = "id" in u ? u.id : "_N" + nextId++;
      u.dagre = { id: id, width: u.width, height: u.height };
      g.addNode(id, u.dagre);
    });

    config.edges.forEach(function(e) {
      var source = e.source.dagre.id;
      if (!g.hasNode(source)) {
        throw new Error("Source node for '" + e + "' not in node list");
      }

      var target = e.target.dagre.id;
      if (!g.hasNode(target)) {
        throw new Error("Target node for '" + e + "' not in node list");
      }

      e.dagre = {
        points: []
      };

      // Track edges that aren't self loops - layout does nothing for self
      // loops, so they can be skipped.
      if (source !== target) {
        var id = "id" in e ? e.id : "_E" + nextId++;
        e.dagre.id = id;
        e.dagre.minLen = e.minLen || 1;
        e.dagre.width = e.width || 0;
        e.dagre.height = e.height || 0;
        g.addEdge(id, source, target, e.dagre);
      }
    });

    return g;
  }

  function run () {
    var rankSep = self.rankSep();
    try {
      if (!config.nodes.length) {
        return;
      }

      // Build internal graph
      var g = init();

      // Make space for edge labels
      g.eachEdge(function(e, s, t, a) {
        a.minLen *= 2;
      });
      self.rankSep(rankSep / 2);

      // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
      // state until the very end.
      acyclic.run(g);

      // Determine the rank for each node. Nodes with a lower rank will appear
      // above nodes of higher rank.
      rank.run(g);

      // Normalize the graph by ensuring that every edge is proper (each edge has
      // a length of 1). We achieve this by adding dummy nodes to long edges,
      // thus shortening them.
      normalize(g);

      // Order the nodes so that edge crossings are minimized.
      order.run(g);

      // Find the x and y coordinates for every node in the graph.
      position.run(g);

      // De-normalize the graph by removing dummy nodes and augmenting the
      // original long edges with coordinate information.
      undoNormalize(g);

      // Reverses points for edges that are in a reversed state.
      fixupEdgePoints(g);

      // Reverse edges that were revered previously to get an acyclic graph.
      acyclic.undo(g);
    } finally {
      self.rankSep(rankSep);
    }

    return self;
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function normalize(g) {
    var dummyCount = 0;
    g.eachEdge(function(e, s, t, a) {
      var sourceRank = g.node(s).rank;
      var targetRank = g.node(t).rank;
      if (sourceRank + 1 < targetRank) {
        for (var u = s, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
          var v = "_D" + ++dummyCount;
          var node = {
            width: a.width,
            height: a.height,
            edge: { id: e, source: s, target: t, attrs: a },
            rank: rank,
            dummy: true
          };

          // If this node represents a bend then we will use it as a control
          // point. For edges with 2 segments this will be the center dummy
          // node. For edges with more than two segments, this will be the
          // first and last dummy node.
          if (i === 0) node.index = 0;
          else if (rank + 1 === targetRank) node.index = 1;

          g.addNode(v, node);
          g.addEdge(null, u, v, {});
          u = v;
        }
        g.addEdge(null, u, t, {});
        g.delEdge(e);
      }
    });
  }

  function undoNormalize(g) {
    var visited = {};

    g.eachNode(function(u, a) {
      if (a.dummy && "index" in a) {
        var edge = a.edge;
        if (!g.hasEdge(edge.id)) {
          g.addEdge(edge.id, edge.source, edge.target, edge.attrs);
        }
        var points = g.edge(edge.id).points;
        points[a.index] = { x: a.x, y: a.y, ul: a.ul, ur: a.ur, dl: a.dl, dr: a.dr };
        g.delNode(u);
      }
    });
  }

  function fixupEdgePoints(g) {
    g.eachEdge(function(e, s, t, a) { if (a.reversed) a.points.reverse(); });
  }

  function delegateProperty(f) {
    return function() {
      if (!arguments.length) return f();
      f.apply(null, arguments);
      return self;
    }
  }
}
dagre.layout.acyclic = function() {
  // External configuration
  var config = {
    debugLevel: 0
  }

  var timer = createTimer();

  var self = {};

  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Acyclic Phase", run);

  self.undo = function(g) {
    g.eachEdge(function(e, s, t, a) {
      if (a.reversed) {
        delete a.reversed;
        g.delEdge(e);
        g.addEdge(e, t, s, a);
      }
    });
  }

  return self;

  function run(g) {
    var onStack = {},
        visited = {},
        reverseCount = 0;

    function dfs(u) {
      if (u in visited) return;

      visited[u] = onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var t = g.target(e),
            a;

        if (t in onStack) {
          a = g.edge(e);
          g.delEdge(e);
          a.reversed = true;
          ++reverseCount;
          g.addEdge(e, t, u, a);
        } else {
          dfs(t);
        }
      });

      delete onStack[u];
    }

    g.eachNode(function(u) { dfs(u); });

    if (config.debugLevel >= 2) console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
  }
};
dagre.layout.rank = function() {
  // External configuration
  var config = {
    debugLevel: 0
  };

  var timer = createTimer();

  var self = {};

  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Rank Phase", run);

  return self;

  function run(g) {
    initRank(g);
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      feasibleTree(subgraph);
      normalize(subgraph);
    });
  };


  function initRank(g) {
    var minRank = {};
    var pq = priorityQueue();

    g.eachNode(function(u) {
      pq.add(u, g.inEdges(u).length);
      minRank[u] = 0;
    });

    while (pq.size() > 0) {
      var minId = pq.min();
      if (pq.priority(minId) > 0) {
        throw new Error("Input graph is not acyclic: " + g.toString());
      }
      pq.removeMin();

      var rank = minRank[minId];
      g.node(minId).rank = rank;

      g.outEdges(minId).forEach(function(e) {
        var target = g.target(e);
        minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
        pq.decrease(target, pq.priority(target) - 1);
      });
    }
  }

  function feasibleTree(g) {
    // Precompute minimum lengths for each directed edge
    var minLen = {};
    g.eachEdge(function(e, source, target, edge) {
      var id = incidenceId(source, target);
      minLen[id] = Math.max(minLen[id] || 1, edge.minLen || 1);
    });

    var tree = dagre.util.prim(g, function(u, v) {
      return Math.abs(g.node(u).rank - g.node(v).rank) - minLen[incidenceId(u, v)];
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u] = true;
      g.node(u).rank = rank;

      tree[u].forEach(function(v) {
        if (!(v in visited)) {
          var delta = minLen[incidenceId(u, v)];
          dfs(v, rank + (g.edges(u, v).length ? delta : -delta));
        }
      });
    }

    dfs(g.nodes()[0], 0);

    return tree;
  }

  function normalize(g) {
    var m = min(g.nodes().map(function(u) { return g.node(u).rank; }));
    g.eachNode(function(u, node) { node.rank -= m; });
  }

  /*
   * This id can be used to group (in an undirected manner) multi-edges
   * incident on the same two nodes.
   */
  function incidenceId(u, v) {
    return u < v ?  u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u;
  }
}
dagre.layout.order = function() {
  var config = {
    iterations: 24, // max number of iterations
    debugLevel: 0
  };

  var timer = createTimer();

  var self = {};

  self.iterations = propertyAccessor(self, config, "iterations");

  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Order Phase", run);

  // Expose barycenterLayer for testing
  self._barycenterLayer = barycenterLayer;

  return self;

  function run(g) {
    var layering = initOrder(g);
    var bestLayering = copyLayering(layering);
    var bestCC = crossCount(g, layering);

    if (config.debugLevel >= 2) {
      console.log("Order phase start cross count: " + bestCC);
    }

    var cc, i, lastBest;
    for (i = 0, lastBest = 0; lastBest < 4 && i < config.iterations; ++i, ++lastBest) {
      cc = sweep(g, i, layering);
      if (cc < bestCC) {
        bestLayering = copyLayering(layering);
        bestCC = cc;
        lastBest = 0;
      }
      if (config.debugLevel >= 3) {
        console.log("Order phase iter " + i + " cross count: " + bestCC);
      }
    }

    bestLayering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        g.node(u).order = i;
      });
    });

    if (config.debugLevel >= 2) {
      console.log("Order iterations: " + i);
      console.log("Order phase best cross count: " + bestCC);
    }

    return bestLayering;
  }

  function initOrder(g) {
    var layering = [];
    g.eachNode(function(n, a) {
      var layer = layering[a.rank] || (layering[a.rank] = []);
      layer.push(n);
    });
    return layering;
  }

  /*
   * Returns a function that will return the predecessors for a node. This
   * function differs from `g.predecessors(u)` in that a predecessor appears
   * for each incident edge (`g.predecessors(u)` treats predecessors as a set).
   * This allows pseudo-weighting of predecessor nodes.
   */
  function multiPredecessors(g) {
    return function(u) {
      var preds = [];
      g.inEdges(u).forEach(function(e) {
        preds.push(g.source(e));
      });
      return preds;
    }
  }

  /*
   * Same as `multiPredecessors(g)` but for successors.
   */
  function multiSuccessors(g) {
    return function(u) {
      var sucs = [];
      g.outEdges(u).forEach(function(e) {
        sucs.push(g.target(e));
      });
      return sucs;
    }
  }

  function sweep(g, iter, layering) {
    if (iter % 2 === 0) {
      for (var i = 1; i < layering.length; ++i) {
        barycenterLayer(layering[i - 1], layering[i], multiPredecessors(g));
      }
    } else {
      for (var i = layering.length - 2; i >= 0; --i) {
        barycenterLayer(layering[i + 1], layering[i], multiSuccessors(g));
      }
    }
    return crossCount(g, layering);
  }

  /*
   * Given a fixed layer and a movable layer in a graph this function will
   * attempt to find an improved ordering for the movable layer such that
   * edge crossings may be reduced.
   *
   * This algorithm is based on the barycenter method.
   */
  function barycenterLayer(fixed, movable, predecessors) {
    var pos = layerPos(movable);
    var bs = barycenters(fixed, movable, predecessors);

    var toSort = movable.filter(function(u) { return bs[u] !== -1; });
    toSort.sort(function(x, y) {
      return bs[x] - bs[y] || pos[x] - pos[y];
    });

    for (var i = movable.length - 1; i >= 0; --i) {
      if (bs[movable[i]] !== -1) {
        movable[i] = toSort.pop();
      }
    }
  }

  /*
   * Given a fixed layer and a movable layer in a graph, this function will
   * return weights for the movable layer that can be used to reorder the layer
   * for potentially reduced edge crossings.
   */
  function barycenters(fixed, movable, predecessors) {
    var pos = layerPos(fixed), // Position of node in fixed list
        bs = {};               // Barycenters for each node

    movable.forEach(function(u) {
      var b = -1;
      var preds = predecessors(u);
      if (preds.length > 0) {
        b = 0;
        preds.forEach(function(v) { b += pos[v]; });
        b = b / preds.length;
      }
      bs[u] = b;
    });

    return bs;
  }

  function copyLayering(layering) {
    return layering.map(function(l) { return l.slice(0); });
  }
}

var crossCount = dagre.layout.order.crossCount = function(g, layering) {
  var cc = 0;
  var prevLayer;
  layering.forEach(function(layer) {
    if (prevLayer) {
      cc += bilayerCrossCount(g, prevLayer, layer);
    }
    prevLayer = layer;
  });
  return cc;
}

/*
 * This function searches through a ranked and ordered graph and counts the
 * number of edges that cross. This algorithm is derived from:
 *
 *    W. Barth et al., Bilayer Cross Counting, JGAA, 8(2) 179–194 (2004)
 */
var bilayerCrossCount = dagre.layout.order.bilayerCrossCount = function(g, layer1, layer2) {
  var layer2Pos = layerPos(layer2);

  var indices = [];
  layer1.forEach(function(u) {
    var nodeIndices = [];
    g.outEdges(u).forEach(function(e) { nodeIndices.push(layer2Pos[g.target(e)]); });
    nodeIndices.sort(function(x, y) { return x - y; });
    indices = indices.concat(nodeIndices);
  });

  var firstIndex = 1;
  while (firstIndex < layer2.length) firstIndex <<= 1;

  var treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;

  var tree = [];
  for (var i = 0; i < treeSize; ++i) { tree[i] = 0; }

  var cc = 0;
  indices.forEach(function(i) {
    var treeIndex = i + firstIndex;
    ++tree[treeIndex];
    var weightSum = 0;
    while (treeIndex > 0) {
      if (treeIndex % 2) {
        cc += tree[treeIndex + 1];
      }
      treeIndex = (treeIndex - 1) >> 1;
      ++tree[treeIndex];
    }
  });

  return cc;
}

function layerPos(layer) {
  var pos = {};
  layer.forEach(function(u, i) { pos[u] = i; });
  return pos;
}
/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
dagre.layout.position = function() {
  // External configuration
  var config = {
    nodeSep: 50,
    edgeSep: 10,
    universalSep: null,
    rankSep: 30,
    rankDir: "TB",
    debugLevel: 0
  };

  var timer = createTimer();

  var self = {};

  self.nodeSep = propertyAccessor(self, config, "nodeSep");
  self.edgeSep = propertyAccessor(self, config, "edgeSep");
  // If not null this separation value is used for all nodes and edges
  // regardless of their widths. `nodeSep` and `edgeSep` are ignored with this
  // option.
  self.universalSep = propertyAccessor(self, config, "universalSep");
  self.rankSep = propertyAccessor(self, config, "rankSep");
  self.rankDir = propertyAccessor(self, config, "rankDir");
  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Position Phase", run);

  return self;

  function run(g) {
    var layering = [];
    g.eachNode(function(u, node) {
      var layer = layering[node.rank] || (layering[node.rank] = []);
      layer[node.order] = u;
    });

    var conflicts = findConflicts(g, layering);

    var xss = {};
    ["u", "d"].forEach(function(vertDir) {
      if (vertDir === "d") layering.reverse();

      ["l", "r"].forEach(function(horizDir) {
        if (horizDir === "r") reverseInnerOrder(layering);

        var dir = vertDir + horizDir;
        var align = verticalAlignment(g, layering, conflicts, vertDir === "u" ? "predecessors" : "successors");
        xss[dir]= horizontalCompaction(g, layering, align.pos, align.root, align.align);
        if (horizDir === "r") flipHorizontally(xss[dir]);

        if (horizDir === "r") reverseInnerOrder(layering);
      });

      if (vertDir === "d") layering.reverse();
    });

    balance(g, layering, xss);
    g.eachNode(function(v) {
      var xs = [];
      for (var alignment in xss) {
        xDebug(alignment, g, v, xss[alignment][v]);
        xs.push(xss[alignment][v]);
      }
      xs.sort(function(x, y) { return x - y; });
      x(g, v, (xs[1] + xs[2]) / 2);
    });

    // Translate layout so left edge of bounding rectangle has coordinate 0
    var minX = min(g.nodes().map(function(u) { return x(g, u) - width(g, u) / 2; }));
    g.eachNode(function(u) { x(g, u, x(g, u) - minX); });

    // Align y coordinates with ranks
    var posY = 0;
    layering.forEach(function(layer) {
      var maxHeight = max(layer.map(function(u) { return height(g, u); }));
      posY += maxHeight / 2;
      layer.forEach(function(u) { y(g, u, posY); });
      posY += maxHeight / 2 + config.rankSep;
    });
  };

  /*
   * Generate an ID that can be used to represent any undirected edge that is
   * incident on `u` and `v`.
   */
  function undirEdgeId(u, v) {
    return u < v
      ? u.toString().length + ":" + u + "-" + v
      : v.toString().length + ":" + v + "-" + u;
  }

  function findConflicts(g, layering) {
    var conflicts = {}, // Set of conflicting edge ids
        pos = {};       // Position of node in its layer

    if (layering.length <= 2) return conflicts;

    layering[1].forEach(function(u, i) { pos[u] = i; });
    for (var i = 1; i < layering.length - 1; ++i) {
      var prevLayer = layering[i];
      var currLayer = layering[i+1];
      var k0 = 0; // Position of the last inner segment in the previous layer
      var l = 0;  // Current position in the current layer (for iteration up to `l1`)

      // Scan current layer for next node that is incident to an inner segement
      // between layering[i+1] and layering[i].
      for (var l1 = 0; l1 < currLayer.length; ++l1) {
        var u = currLayer[l1]; // Next inner segment in the current layer or
                               // last node in the current layer
        pos[u] = l1;

        var k1 = undefined; // Position of the next inner segment in the previous layer or
                            // the position of the last element in the previous layer
        if (g.node(u).dummy) {
          var uPred = g.predecessors(u)[0];
          if (g.node(uPred).dummy)
            k1 = pos[uPred];
        }
        if (k1 === undefined && l1 === currLayer.length - 1)
          k1 = prevLayer.length - 1;

        if (k1 !== undefined) {
          for (; l <= l1; ++l) {
            g.predecessors(currLayer[l]).forEach(function(v) {
              var k = pos[v];
              if (k < k0 || k > k1)
                conflicts[undirEdgeId(currLayer[l], v)] = true;
            });
          }
          k0 = k1;
        }
      }
    }

    return conflicts;
  }

  function verticalAlignment(g, layering, conflicts, relationship) {
    var pos = {},   // Position for a node in its layer
        root = {},  // Root of the block that the node participates in
        align = {}; // Points to the next node in the block or, if the last
                    // element in the block, points to the first block's root

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        root[u] = u;
        align[u] = u;
        pos[u] = i;
      });
    });

    layering.forEach(function(layer) {
      var prevIdx = -1;
      layer.forEach(function(v) {
        var related = g[relationship](v), // Adjacent nodes from the previous layer
            mid;                          // The mid point in the related array

        if (related.length > 0) {
          related.sort(function(x, y) { return pos[x] - pos[y]; });
          mid = (related.length - 1) / 2;
          related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function(u) {
            if (align[v] === v) {
              if (!conflicts[undirEdgeId(u, v)] && prevIdx < pos[u]) {
                align[u] = v;
                align[v] = root[v] = root[u];
                prevIdx = pos[u];
              }
            }
          });
        }
      });
    });

    return { pos: pos, root: root, align: align };
  }

  // This function deviates from the standard BK algorithm in two ways. First
  // it takes into account the size of the nodes. Second it includes a fix to
  // the original algorithm that is described in Carstens, "Node and Label
  // Placement in a Layered Layout Algorithm".
  function horizontalCompaction(g, layering, pos, root, align) {
    var sink = {},  // Mapping of node id -> sink node id for class
        shift = {}, // Mapping of sink node id -> x delta
        pred = {},  // Mapping of node id -> predecessor node (or null)
        xs = {};    // Calculated X positions

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        sink[u] = u;
        if (i > 0)
          pred[u] = layer[i - 1];
      });
    });

    function placeBlock(v) {
      if (!(v in xs)) {
        xs[v] = 0;
        var w = v;
        do {
          if (pos[w] > 0) {
            var u = root[pred[w]];
            placeBlock(u);
            if (sink[v] === v) {
              sink[v] = sink[u];
            }
            var delta = sep(g, pred[w]) + sep(g, w);
            if (sink[v] !== sink[u]) {
              shift[sink[u]] = Math.min(shift[sink[u]] || Number.POSITIVE_INFINITY, xs[v] - xs[u] - delta);
            } else {
              xs[v] = Math.max(xs[v], xs[u] + delta);
            }
          }
          w = align[w];
        } while (w !== v);
      }
    }

    // Root coordinates relative to sink
    values(root).forEach(function(v) {
      placeBlock(v);
    });

    // Absolute coordinates
    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] = xs[root[v]];
        var xDelta = shift[sink[v]];
        if (root[v] === v && xDelta < Number.POSITIVE_INFINITY)
          xs[v] += xDelta;
      });
    });

    return xs;
  }

  function findMinCoord(g, layering, xs) {
    return min(layering.map(function(layer) {
      var u = layer[0];
      return xs[u];
    }));
  }

  function findMaxCoord(g, layering, xs) {
    return max(layering.map(function(layer) {
      var u = layer[layer.length - 1];
      return xs[u];
    }));
  }

  function balance(g, layering, xss) {
    var min = {},                            // Min coordinate for the alignment
        max = {},                            // Max coordinate for the alginment
        smallestAlignment,
        shift = {};                          // Amount to shift a given alignment

    var smallest = Number.POSITIVE_INFINITY;
    for (var alignment in xss) {
      var xs = xss[alignment];
      min[alignment] = findMinCoord(g, layering, xs);
      max[alignment] = findMaxCoord(g, layering, xs);
      var w = max[alignment] - min[alignment];
      if (w < smallest) {
        smallest = w;
        smallestAlignment = alignment;
      }
    }

    // Determine how much to adjust positioning for each alignment
    ["u", "d"].forEach(function(vertDir) {
      ["l", "r"].forEach(function(horizDir) {
        var alignment = vertDir + horizDir;
        shift[alignment] = horizDir === "l"
            ? min[smallestAlignment] - min[alignment]
            : max[smallestAlignment] - max[alignment];
      });
    });

    // Find average of medians for xss array
    for (var alignment in xss) {
      g.eachNode(function(v) {
        xss[alignment][v] += shift[alignment];
      });
    };
  }

  function flipHorizontally(xs) {
    for (var u in xs) {
      xs[u] = -xs[u];
    }
  }

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }

  function width(g, u) {
    switch (config.rankDir) {
      case "LR": return g.node(u).height;
      default:   return g.node(u).width;
    }
  }

  function height(g, u) {
    switch(config.rankDir) {
      case "LR": return g.node(u).width;
      default:   return g.node(u).height;
    }
  }

  function sep(g, u) {
    if (config.universalSep !== null) {
      return config.universalSep;
    }
    var w = width(g, u);
    var s = g.node(u).dummy ? config.edgeSep : config.nodeSep;
    return (w + s) / 2;
  }

  function x(g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = x;
        }
    }
  }

  function xDebug(name, g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
    }
  }

  function y(g, u, y) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = y;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = y;
        }
    }
  }
}
dagre.util = {};

/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
function mergeAttributes(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
}

function min(values) {
  return Math.min.apply(null, values);
}

function max(values) {
  return Math.max.apply(null, values);
}

function concat(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

var keys = dagre.util.keys = Object.keys;

/*
 * Returns an array of all values in the given object.
 */
function values(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
}

function union(arrays) {
  var obj = {};
  for (var i = 0; i < arrays.length; ++i) {
    var a = arrays[i];
    for (var j = 0; j < a.length; ++j) {
      var v = a[j];
      obj[v] = v;
    }
  }

  var results = [];
  for (var k in obj) {
    results.push(obj[k]);
  }

  return results;
}

/*
 * Returns all components in the graph using undirected navigation.
 */
var components = dagre.util.components = function(g) {
  var results = [];
  var visited = {};

  function dfs(u, component) {
    if (!(u in visited)) {
      visited[u] = true;
      component.push(u);
      g.neighbors(u).forEach(function(v) {
        dfs(v, component);
      });
    }
  };

  g.eachNode(function(u) {
    var component = [];
    dfs(u, component);
    if (component.length > 0) {
      results.push(component);
    }
  });

  return results;
};

/*
 * This algorithm uses undirected traversal to find a miminum spanning tree
 * using the supplied weight function. The algorithm is described in
 * Cormen, et al., "Introduction to Algorithms". The returned structure
 * is an array of node id to an array of adjacent nodes.
 */
var prim = dagre.util.prim = function(g, weight) {
  var result = {};
  var parent = {};
  var q = priorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.eachNode(function(u) {
    q.add(u, Number.POSITIVE_INFINITY);
    result[u] = [];
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0], 0);

  var u;
  var init = false;
  while (q.size() > 0) {
    u = q.removeMin();
    if (u in parent) {
      result[u].push(parent[u]);
      result[parent[u]].push(u);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + g.toString());
    } else {
      init = true;
    }

    g.neighbors(u).forEach(function(v) {
      var pri = q.priority(v);
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parent[v] = u;
          q.decrease(v, edgeWeight);
        }
      }
    });
  }

  return result;
};

var intersectRect = dagre.util.intersectRect = function(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {x: x + sx, y: y + sy};
}

var pointStr = dagre.util.pointStr = function(point) {
  return point.x + "," + point.y;
}

var createTimer = function() {
  var self = {},
      enabled = false;

  self.enabled = function(x) {
    if (!arguments.length) return enabled;
    enabled = x;
    return self;
  };

  self.wrap = function(name, func) {
    return function() {
      var start = enabled ? new Date().getTime() : null;
      try {
        return func.apply(null, arguments);
      } finally {
        if (start) console.log(name + " time: " + (new Date().getTime() - start) + "ms");
      }
    }
  };

  return self;
}

function propertyAccessor(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
}
function priorityQueue() {
  var _arr = [];
  var _keyIndices = {};

  function _heapify(i) {
    var arr = _arr;
    var l = 2 * i,
        r = l + 1,
        largest = i;
    if (l < arr.length) {
      largest = arr[l].pri < arr[largest].pri ? l : largest;
      if (r < arr.length) {
        largest = arr[r].pri < arr[largest].pri ? r : largest;
      }
      if (largest !== i) {
        _swap(i, largest);
        _heapify(largest);
      }
    }
  }

  function _decrease(index) {
    var arr = _arr;
    var pri = arr[index].pri;
    var parent;
    while (index > 0) {
      parent = index >> 1;
      if (arr[parent].pri < pri) {
        break;
      }
      _swap(index, parent);
      index = parent;
    }
  }

  function _swap(i, j) {
    var arr = _arr;
    var keyIndices = _keyIndices;
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    keyIndices[arr[i].key] = i;
    keyIndices[arr[j].key] = j;
  }

  function size() { return _arr.length; }

  function keys() { return Object.keys(_keyIndices); }

  function has(key) { return key in _keyIndices; }

  function priority(key) {
    var index = _keyIndices[key];
    if (index !== undefined) {
      return _arr[index].pri;
    }
  }

  function add(key, pri) {
    if (!(key in _keyIndices)) {
      var entry = {key: key, pri: pri};
      var index = _arr.length;
      _keyIndices[key] = index;
      _arr.push(entry);
      _decrease(index);
      return true;
    }
    return false;
  }

  function min() {
    if (size() > 0) {
      return _arr[0].key;
    }
  }

  function removeMin() {
    _swap(0, _arr.length - 1);
    var min = _arr.pop();
    delete _keyIndices[min.key];
    _heapify(0);
    return min.key;
  }

  function decrease(key, pri) {
    var index = _keyIndices[key];
    if (pri > _arr[index].pri) {
      throw new Error("New priority is greater than current priority. " +
          "Key: " + key + " Old: " + _arr[index].pri + " New: " + pri);
    }
    _arr[index].pri = pri;
    _decrease(index);
  }

  return {
    size: size,
    keys: keys,
    has: has,
    priority: priority,
    add: add,
    min: min,
    removeMin: removeMin,
    decrease: decrease
  };
}
dagre.dot = {};

dagre.dot.toGraph = function(str) {
  var parseTree = dot_parser.parse(str);
  var g = dagre.graph();
  var undir = parseTree.type === "graph";

  function createNode(id, attrs) {
    if (!(g.hasNode(id))) {
      // We only apply default attributes to a node when it is first defined.
      // If the node is subsequently used in edges, we skip apply default
      // attributes.
      g.addNode(id, defaultAttrs.get("node", { id: id }));

      // The "label" attribute is given special treatment: if it is not
      // defined we set it to the id of the node.
      if (g.node(id).label === undefined) {
        g.node(id).label = id;
      }
    }
    if (attrs) {
      mergeAttributes(attrs, g.node(id));
    }
  }

  var edgeCount = {};
  function createEdge(source, target, attrs) {
    var edgeKey = source + "-" + target;
    var count = edgeCount[edgeKey];
    if (!count) {
      count = edgeCount[edgeKey] = 0;
    }
    edgeCount[edgeKey]++;

    var id = attrs.id || edgeKey + "-" + count;
    var edge = {};
    mergeAttributes(defaultAttrs.get("edge", attrs), edge);
    mergeAttributes({ id: id }, edge);
    g.addEdge(id, source, target, edge);
  }

  function collectNodeIds(stmt) {
    var ids = {},
        stack = [],
        curr;
    stack.push(stmt);
    while (stack.length != 0) {
      curr = stack.pop();
      switch (curr.type) {
        case "node": ids[curr.id] = true; break;
        case "edge":
          curr.elems.forEach(function(e) { stack.push(e); });
          break;
        case "subgraph":
          curr.stmts.forEach(function(s) { stack.push(s); });
          break;
      }
    }
    return dagre.util.keys(ids);
  }

  /*
   * We use a chain of prototypes to maintain properties as we descend into
   * subgraphs. This allows us to simply get the value for a property and have
   * the VM do appropriate resolution. When we leave a subgraph we simply set
   * the current context to the prototype of the current defaults object.
   * Alternatively, this could have been written using a stack.
   */
  var defaultAttrs = {
    _default: {},

    get: function get(type, attrs) {
      if (typeof this._default[type] !== "undefined") {
        var mergedAttrs = {};
        // clone default attributes so they won't get overwritten in the next step
        mergeAttributes(this._default[type], mergedAttrs);
        // merge statement attributes with default attributes, precedence give to stmt attributes
        mergeAttributes(attrs, mergedAttrs);
        return mergedAttrs;
      } else {
        return attrs;
      }
    },

    set: function set(type, attrs) {
      this._default[type] = this.get(type, attrs);
    },

    enterSubGraph: function() {
      function SubGraph() {}
      SubGraph.prototype = this._default;
      var subgraph = new SubGraph();
      this._default = subgraph;
    },

    exitSubGraph: function() {
      this._default = Object.getPrototypeOf(this._default);
    }
  };

  function handleStmt(stmt) {
    var attrs = stmt.attrs;
    switch (stmt.type) {
      case "node":
        createNode(stmt.id, attrs);
        break;
      case "edge":
        var prev,
            curr;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node": curr = [elem.id]; break;
            case "subgraph": curr = collectNodeIds(elem); break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }

          if (prev) {
            prev.forEach(function(p) {
              curr.forEach(function(c) {
                createEdge(p, c, attrs);
                if (undir) {
                  createEdge(c, p, attrs);
                }
              });
            });
          }
          prev = curr;
        });
        break;
      case "subgraph":
        defaultAttrs.enterSubGraph();
        stmt.stmts.forEach(function(s) { handleStmt(s); });
        defaultAttrs.exitSubGraph();
        break;
      case "attr":
        defaultAttrs.set(stmt.attrType, attrs);
        break;
      default:
        throw new Error("Unsupported statement type: " + stmt.type);
    }
  }

  if (parseTree.stmts) {
    parseTree.stmts.forEach(function(stmt) {
      handleStmt(stmt);
    });
  }

  return g;
};

dagre.dot.toObjects = function(str) {
  var g = dagre.dot.toGraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};
dot_parser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "stmtList": parse_stmtList,
        "stmt": parse_stmt,
        "attrStmt": parse_attrStmt,
        "inlineAttrStmt": parse_inlineAttrStmt,
        "nodeStmt": parse_nodeStmt,
        "edgeStmt": parse_edgeStmt,
        "subgraphStmt": parse_subgraphStmt,
        "attrList": parse_attrList,
        "attrListBlock": parse_attrListBlock,
        "aList": parse_aList,
        "edgeRHS": parse_edgeRHS,
        "idDef": parse_idDef,
        "nodeIdOrSubgraph": parse_nodeIdOrSubgraph,
        "nodeId": parse_nodeId,
        "port": parse_port,
        "compassPt": parse_compassPt,
        "id": parse_id,
        "node": parse_node,
        "edge": parse_edge,
        "graph": parse_graph,
        "digraph": parse_digraph,
        "subgraph": parse_subgraph,
        "strict": parse_strict,
        "graphType": parse_graphType,
        "whitespace": parse_whitespace,
        "comment": parse_comment,
        "_": parse__
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11, result12;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse__();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse__();
        }
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_strict();
          if (result1 !== null) {
            result2 = parse__();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_graphType();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse__();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse__();
                  }
                  if (result5 !== null) {
                    if (input.charCodeAt(pos) === 123) {
                      result6 = "{";
                      pos++;
                    } else {
                      result6 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"{\"");
                      }
                    }
                    if (result6 !== null) {
                      result7 = [];
                      result8 = parse__();
                      while (result8 !== null) {
                        result7.push(result8);
                        result8 = parse__();
                      }
                      if (result7 !== null) {
                        result8 = parse_stmtList();
                        result8 = result8 !== null ? result8 : "";
                        if (result8 !== null) {
                          result9 = [];
                          result10 = parse__();
                          while (result10 !== null) {
                            result9.push(result10);
                            result10 = parse__();
                          }
                          if (result9 !== null) {
                            if (input.charCodeAt(pos) === 125) {
                              result10 = "}";
                              pos++;
                            } else {
                              result10 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"}\"");
                              }
                            }
                            if (result10 !== null) {
                              result11 = [];
                              result12 = parse__();
                              while (result12 !== null) {
                                result11.push(result12);
                                result12 = parse__();
                              }
                              if (result11 !== null) {
                                result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11];
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, type, id, stmts) {
                return {type: type, id: id, stmts: stmts};
              })(pos0, result0[2], result0[4], result0[8]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stmtList() {
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_stmt();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 59) {
              result2 = ";";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = [];
              pos2 = pos;
              result4 = [];
              result5 = parse__();
              while (result5 !== null) {
                result4.push(result5);
                result5 = parse__();
              }
              if (result4 !== null) {
                result5 = parse_stmt();
                if (result5 !== null) {
                  result6 = [];
                  result7 = parse__();
                  while (result7 !== null) {
                    result6.push(result7);
                    result7 = parse__();
                  }
                  if (result6 !== null) {
                    if (input.charCodeAt(pos) === 59) {
                      result7 = ";";
                      pos++;
                    } else {
                      result7 = null;
                      if (reportFailures === 0) {
                        matchFailed("\";\"");
                      }
                    }
                    result7 = result7 !== null ? result7 : "";
                    if (result7 !== null) {
                      result4 = [result4, result5, result6, result7];
                    } else {
                      result4 = null;
                      pos = pos2;
                    }
                  } else {
                    result4 = null;
                    pos = pos2;
                  }
                } else {
                  result4 = null;
                  pos = pos2;
                }
              } else {
                result4 = null;
                pos = pos2;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos2 = pos;
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  result5 = parse_stmt();
                  if (result5 !== null) {
                    result6 = [];
                    result7 = parse__();
                    while (result7 !== null) {
                      result6.push(result7);
                      result7 = parse__();
                    }
                    if (result6 !== null) {
                      if (input.charCodeAt(pos) === 59) {
                        result7 = ";";
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("\";\"");
                        }
                      }
                      result7 = result7 !== null ? result7 : "";
                      if (result7 !== null) {
                        result4 = [result4, result5, result6, result7];
                      } else {
                        result4 = null;
                        pos = pos2;
                      }
                    } else {
                      result4 = null;
                      pos = pos2;
                    }
                  } else {
                    result4 = null;
                    pos = pos2;
                  }
                } else {
                  result4 = null;
                  pos = pos2;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = [first];
                for (var i = 0; i < rest.length; ++i) {
                    result.push(rest[i][1]);
                }
                return result;
              })(pos0, result0[0], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stmt() {
        var result0;
        
        result0 = parse_attrStmt();
        if (result0 === null) {
          result0 = parse_edgeStmt();
          if (result0 === null) {
            result0 = parse_subgraphStmt();
            if (result0 === null) {
              result0 = parse_inlineAttrStmt();
              if (result0 === null) {
                result0 = parse_nodeStmt();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_attrStmt() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_graph();
        if (result0 === null) {
          result0 = parse_node();
          if (result0 === null) {
            result0 = parse_edge();
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_attrList();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, type, attrs) {
                return { type: "attr", attrType: type, attrs: attrs || {}};
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_inlineAttrStmt() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 61) {
              result2 = "=";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, k, v) {
                var attrs = {};
                attrs[k] = v;
                return { type: "inlineAttr", attrs: attrs };
              })(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nodeStmt() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_nodeId();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_attrList();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id, attrs) { return {type: "node", id: id, attrs: attrs || {}}; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edgeStmt() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_nodeIdOrSubgraph();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_edgeRHS();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_attrList();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, lhs, rhs, attrs) {
                var elems = [lhs];
                for (var i = 0; i < rhs.length; ++i) {
                    elems.push(rhs[i]);
                }
                return { type: "edge", elems: elems, attrs: attrs || {} };
              })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_subgraphStmt() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2, pos3;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        result0 = parse_subgraph();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            pos3 = pos;
            result2 = parse_id();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos3;
              }
            } else {
              result2 = null;
              pos = pos3;
            }
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos2;
            }
          } else {
            result0 = null;
            pos = pos2;
          }
        } else {
          result0 = null;
          pos = pos2;
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 123) {
            result1 = "{";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"{\"");
            }
          }
          if (result1 !== null) {
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              result3 = parse_stmtList();
              if (result3 !== null) {
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 125) {
                    result5 = "}";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"}\"");
                    }
                  }
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id, stmts) {
                id = id[2] || [];
                return { type: "subgraph", id: id[0], stmts: stmts };
              })(pos0, result0[0], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_attrList() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_attrListBlock();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = [];
          result3 = parse__();
          while (result3 !== null) {
            result2.push(result3);
            result3 = parse__();
          }
          if (result2 !== null) {
            result3 = parse_attrListBlock();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              result3 = parse_attrListBlock();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = first;
                for (var i = 0; i < rest.length; ++i) {
                    result = rightBiasedMerge(result, rest[i][1]);
                }
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_attrListBlock() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_aList();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                if (input.charCodeAt(pos) === 93) {
                  result4 = "]";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"]\"");
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, aList) { return aList; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_aList() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_idDef();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = [];
          result3 = parse__();
          while (result3 !== null) {
            result2.push(result3);
            result3 = parse__();
          }
          if (result2 !== null) {
            if (input.charCodeAt(pos) === 44) {
              result3 = ",";
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\",\"");
              }
            }
            result3 = result3 !== null ? result3 : "";
            if (result3 !== null) {
              result4 = [];
              result5 = parse__();
              while (result5 !== null) {
                result4.push(result5);
                result5 = parse__();
              }
              if (result4 !== null) {
                result5 = parse_idDef();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 44) {
                result3 = ",";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\",\"");
                }
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  result5 = parse_idDef();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = first;
                for (var i = 0; i < rest.length; ++i) {
                    result = rightBiasedMerge(result, rest[i][3]);
                }
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edgeRHS() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        if (input.substr(pos, 2) === "--") {
          result0 = "--";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"--\"");
          }
        }
        if (result0 !== null) {
          result1 = (function(offset) { return directed; })(pos) ? null : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos2;
          }
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 === null) {
          pos2 = pos;
          if (input.substr(pos, 2) === "->") {
            result0 = "->";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"->\"");
            }
          }
          if (result0 !== null) {
            result1 = (function(offset) { return directed; })(pos) ? "" : null;
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos2;
            }
          } else {
            result0 = null;
            pos = pos2;
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_nodeIdOrSubgraph();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_edgeRHS();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, rhs, rest) {
                var result = [rhs];
                for (var i = 0; i < rest.length; ++i) {
                    result.push(rest[i]);
                }
                return result;
              })(pos0, result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_idDef() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          pos2 = pos;
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 61) {
              result2 = "=";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                if (result4 !== null) {
                  result1 = [result1, result2, result3, result4];
                } else {
                  result1 = null;
                  pos = pos2;
                }
              } else {
                result1 = null;
                pos = pos2;
              }
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, k, v) {
                var result = {};
                result[k] = v[3];
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nodeIdOrSubgraph() {
        var result0;
        var pos0;
        
        result0 = parse_subgraphStmt();
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_nodeId();
          if (result0 !== null) {
            result0 = (function(offset, id) { return { type: "node", id: id, attrs: {} }; })(pos0, result0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_nodeId() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_port();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id) { return id; })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_port() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 58) {
          result0 = ":";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\":\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_id();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                pos1 = pos;
                if (input.charCodeAt(pos) === 58) {
                  result4 = ":";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\":\"");
                  }
                }
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse__();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse__();
                  }
                  if (result5 !== null) {
                    result6 = parse_compassPt();
                    if (result6 !== null) {
                      result4 = [result4, result5, result6];
                    } else {
                      result4 = null;
                      pos = pos1;
                    }
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_compassPt() {
        var result0;
        
        if (input.charCodeAt(pos) === 110) {
          result0 = "n";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"n\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "ne") {
            result0 = "ne";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"ne\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 101) {
              result0 = "e";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"e\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 2) === "se") {
                result0 = "se";
                pos += 2;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"se\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 115) {
                  result0 = "s";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"s\"");
                  }
                }
                if (result0 === null) {
                  if (input.substr(pos, 2) === "sw") {
                    result0 = "sw";
                    pos += 2;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"sw\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 119) {
                      result0 = "w";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"w\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.substr(pos, 2) === "nw") {
                        result0 = "nw";
                        pos += 2;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"nw\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 99) {
                          result0 = "c";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"c\"");
                          }
                        }
                        if (result0 === null) {
                          if (input.charCodeAt(pos) === 95) {
                            result0 = "_";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"_\"");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_id() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2, pos3;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (/^[a-zA-Z\u0200-\u0377_]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z\\u0200-\\u0377_]");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z\u0200-\u0377_0-9]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\u0200-\\u0377_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z\u0200-\u0377_0-9]/.test(input.charAt(pos))) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z\\u0200-\\u0377_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, fst, rest) { return fst + rest.join(""); })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          result0 = result0 !== null ? result0 : "";
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 46) {
              result1 = ".";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result1 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result3 !== null) {
                result2 = [];
                while (result3 !== null) {
                  result2.push(result3);
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result3 = input.charAt(pos);
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                }
              } else {
                result2 = null;
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, sign, dot, after) { return sign + dot + after.join(""); })(pos0, result0[0], result0[1], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.charCodeAt(pos) === 45) {
              result0 = "-";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"-\"");
              }
            }
            result0 = result0 !== null ? result0 : "";
            if (result0 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result2 !== null) {
                result1 = [];
                while (result2 !== null) {
                  result1.push(result2);
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result2 = input.charAt(pos);
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                }
              } else {
                result1 = null;
              }
              if (result1 !== null) {
                pos2 = pos;
                if (input.charCodeAt(pos) === 46) {
                  result2 = ".";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result2 !== null) {
                  result3 = [];
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result4 = input.charAt(pos);
                    pos++;
                  } else {
                    result4 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                  while (result4 !== null) {
                    result3.push(result4);
                    if (/^[0-9]/.test(input.charAt(pos))) {
                      result4 = input.charAt(pos);
                      pos++;
                    } else {
                      result4 = null;
                      if (reportFailures === 0) {
                        matchFailed("[0-9]");
                      }
                    }
                  }
                  if (result3 !== null) {
                    result2 = [result2, result3];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
                result2 = result2 !== null ? result2 : "";
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, sign, before, after) { return sign + before.join("") + (after[0] || "") + (after[1] || []).join(""); })(pos0, result0[0], result0[1], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              if (input.charCodeAt(pos) === 34) {
                result0 = "\"";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\\"\"");
                }
              }
              if (result0 !== null) {
                result1 = [];
                pos2 = pos;
                if (input.substr(pos, 2) === "\\\"") {
                  result2 = "\\\"";
                  pos += 2;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"\\\\\\\"\"");
                  }
                }
                if (result2 !== null) {
                  result2 = (function(offset) { return '"'; })(pos2);
                }
                if (result2 === null) {
                  pos = pos2;
                }
                if (result2 === null) {
                  pos2 = pos;
                  pos3 = pos;
                  if (input.charCodeAt(pos) === 92) {
                    result2 = "\\";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\\\"");
                    }
                  }
                  if (result2 !== null) {
                    if (/^[^"]/.test(input.charAt(pos))) {
                      result3 = input.charAt(pos);
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("[^\"]");
                      }
                    }
                    if (result3 !== null) {
                      result2 = [result2, result3];
                    } else {
                      result2 = null;
                      pos = pos3;
                    }
                  } else {
                    result2 = null;
                    pos = pos3;
                  }
                  if (result2 !== null) {
                    result2 = (function(offset, ch) { return "\\" + ch; })(pos2, result2[1]);
                  }
                  if (result2 === null) {
                    pos = pos2;
                  }
                  if (result2 === null) {
                    if (/^[^"]/.test(input.charAt(pos))) {
                      result2 = input.charAt(pos);
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("[^\"]");
                      }
                    }
                  }
                }
                while (result2 !== null) {
                  result1.push(result2);
                  pos2 = pos;
                  if (input.substr(pos, 2) === "\\\"") {
                    result2 = "\\\"";
                    pos += 2;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\\\\\"\"");
                    }
                  }
                  if (result2 !== null) {
                    result2 = (function(offset) { return '"'; })(pos2);
                  }
                  if (result2 === null) {
                    pos = pos2;
                  }
                  if (result2 === null) {
                    pos2 = pos;
                    pos3 = pos;
                    if (input.charCodeAt(pos) === 92) {
                      result2 = "\\";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"\\\\\"");
                      }
                    }
                    if (result2 !== null) {
                      if (/^[^"]/.test(input.charAt(pos))) {
                        result3 = input.charAt(pos);
                        pos++;
                      } else {
                        result3 = null;
                        if (reportFailures === 0) {
                          matchFailed("[^\"]");
                        }
                      }
                      if (result3 !== null) {
                        result2 = [result2, result3];
                      } else {
                        result2 = null;
                        pos = pos3;
                      }
                    } else {
                      result2 = null;
                      pos = pos3;
                    }
                    if (result2 !== null) {
                      result2 = (function(offset, ch) { return "\\" + ch; })(pos2, result2[1]);
                    }
                    if (result2 === null) {
                      pos = pos2;
                    }
                    if (result2 === null) {
                      if (/^[^"]/.test(input.charAt(pos))) {
                        result2 = input.charAt(pos);
                        pos++;
                      } else {
                        result2 = null;
                        if (reportFailures === 0) {
                          matchFailed("[^\"]");
                        }
                      }
                    }
                  }
                }
                if (result1 !== null) {
                  if (input.charCodeAt(pos) === 34) {
                    result2 = "\"";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\"\"");
                    }
                  }
                  if (result2 !== null) {
                    result0 = [result0, result1, result2];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, id) { return id.join(""); })(pos0, result0[1]);
              }
              if (result0 === null) {
                pos = pos0;
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_node() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 4).toLowerCase() === "node") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"node\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edge() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 4).toLowerCase() === "edge") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"edge\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_graph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "graph") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"graph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_digraph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 7).toLowerCase() === "digraph") {
          result0 = input.substr(pos, 7);
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"digraph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_subgraph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 8).toLowerCase() === "subgraph") {
          result0 = input.substr(pos, 8);
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"subgraph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_strict() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "strict") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"strict\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_graphType() {
        var result0;
        var pos0;
        
        result0 = parse_graph();
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_digraph();
          if (result0 !== null) {
            result0 = (function(offset, graph) {
                  directed = graph === "digraph";
                  return graph;
                })(pos0, result0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_whitespace() {
        var result0, result1;
        
        reportFailures++;
        if (/^[ \t\r\n]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\t\\r\\n]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[ \t\r\n]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[ \\t\\r\\n]");
              }
            }
          }
        } else {
          result0 = null;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        reportFailures++;
        pos0 = pos;
        if (input.substr(pos, 2) === "//") {
          result0 = "//";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"//\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[^\n]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[^\\n]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[^\n]/.test(input.charAt(pos))) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[^\\n]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 2) === "/*") {
            result0 = "/*";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/*\"");
            }
          }
          if (result0 !== null) {
            result1 = [];
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              if (input.length > pos) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
            while (result2 !== null) {
              result1.push(result2);
              pos1 = pos;
              pos2 = pos;
              reportFailures++;
              if (input.substr(pos, 2) === "*/") {
                result2 = "*/";
                pos += 2;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"*/\"");
                }
              }
              reportFailures--;
              if (result2 === null) {
                result2 = "";
              } else {
                result2 = null;
                pos = pos2;
              }
              if (result2 !== null) {
                if (input.length > pos) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("any character");
                  }
                }
                if (result3 !== null) {
                  result2 = [result2, result3];
                } else {
                  result2 = null;
                  pos = pos1;
                }
              } else {
                result2 = null;
                pos = pos1;
              }
            }
            if (result1 !== null) {
              if (input.substr(pos, 2) === "*/") {
                result2 = "*/";
                pos += 2;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"*/\"");
                }
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comment");
        }
        return result0;
      }
      
      function parse__() {
        var result0;
        
        result0 = parse_whitespace();
        if (result0 === null) {
          result0 = parse_comment();
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
          var directed;
      
          function rightBiasedMerge(lhs, rhs) {
              var result = {};
              for (var k in lhs) {
                  result[k] = lhs[k];
              }
              for (var k in rhs) {
                  result[k] = rhs[k];
              }
              return result;     
          }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
})();

},{}],3:[function(require,module,exports){
(function(){
  var ref$, all, any, map, filter, anyTest, isRoot, trimGraphToHeight, GraphState;
  ref$ = require('prelude-ls'), all = ref$.all, any = ref$.any, map = ref$.map, filter = ref$.filter;
  anyTest = require('./util').anyTest;
  isRoot = function(it){
    return it.isRoot;
  };
  trimGraphToHeight = function(arg$, level){
    var nodes, edges, atOrBelowHeight, acceptable, filtered, i$, ref$, len$, n, elision;
    nodes = arg$.nodes, edges = arg$.edges;
    if (!level) {
      return {
        nodes: nodes,
        edges: edges
      };
    }
    atOrBelowHeight = compose$([
      (function(it){
        return it <= level;
      }), function(it){
        return it.stepsFromLeaf;
      }
    ]);
    acceptable = anyTest([isRoot, atOrBelowHeight]);
    filtered = {
      nodes: filter(acceptable, nodes),
      edges: filter(function(it){
        return all(acceptable, [it.source, it.target]);
      }, edges)
    };
    for (i$ = 0, len$ = (ref$ = filtered.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (!n.isRoot && any(compose$([not$, acceptable]), map(fn$, n.edges))) {
        elision = {
          source: n,
          target: n.root,
          label: 'elision'
        };
        filtered.edges.push(elision);
      }
    }
    return filtered;
    function fn$(it){
      return it.target;
    }
  };
  GraphState = (function(superclass){
    var prototype = extend$((import$(GraphState, superclass).displayName = 'GraphState', GraphState), superclass).prototype, constructor = GraphState;
    prototype.toString = function(){
      return "[GraphState " + this.cid + "]";
    };
    prototype.initialize = function(){
      console.log("Listening to myself");
      return this.on('annotated:height change:elision change:root change:all', bind$(this, 'updateGraph'));
    };
    prototype.updateGraph = function(){
      var level, currentRoot, ref$, allNodes, allEdges, nodes, edges, graph;
      console.log("Updating presented graph");
      level = this.get('elision');
      currentRoot = this.get('root');
      ref$ = this.get('all'), allNodes = ref$.nodes, allEdges = ref$.edges;
      nodes = (function(){
        switch (false) {
        case !currentRoot:
          return filter(compose$([
            (function(it){
              return it === currentRoot;
            }), function(it){
              return it.root;
            }
          ]), allNodes);
        default:
          return allNodes.slice();
        }
      }());
      edges = (function(){
        switch (false) {
        case !currentRoot:
          return filter(compose$([
            (function(it){
              return it === currentRoot;
            }), function(it){
              return it.root;
            }, function(it){
              return it.target;
            }
          ]), allEdges);
        default:
          return allEdges.slice();
        }
      }());
      graph = (function(){
        switch (false) {
        case !(level && any(function(it){
          return it.stepsFromLeaf;
        }, nodes)):
          return trimGraphToHeight({
            nodes: nodes,
            edges: edges
          }, level);
        default:
          return {
            nodes: nodes,
            edges: edges
          };
        }
      }());
      return this.set({
        graph: graph
      });
    };
    function GraphState(){
      GraphState.superclass.apply(this, arguments);
    }
    return GraphState;
  }(Backbone.Model));
  module.exports = GraphState;
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function not$(x){ return !x; }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);

},{"./util":4,"prelude-ls":5}],4:[function(require,module,exports){
(function(){
  var ref$, reject, empty, any, min, max, each, map, pairsToObj, objectify, error, len, within, notify, failWhenEmpty, doTo, anyTest, relationshipTest;
  ref$ = require('prelude-ls'), reject = ref$.reject, empty = ref$.empty, any = ref$.any, min = ref$.min, max = ref$.max, each = ref$.each, map = ref$.map, pairsToObj = ref$.pairsToObj;
  objectify = curry$(function(key, value, list){
    return compose$([
      pairsToObj, map(function(it){
        return [key(it), value(it)];
      })
    ])(
    list);
  });
  error = function(msg){
    return $.Deferred(function(){
      return this.reject(msg);
    });
  };
  len = function(it){
    return it.length;
  };
  within = curry$(function(upper, lower, actual){
    return min(upper, max(lower, actual));
  });
  notify = function(it){
    return alert(it);
  };
  failWhenEmpty = curry$(function(msg, promise){
    return promise.then(function(it){
      if (empty(it)) {
        return error(msg);
      } else {
        return it;
      }
    });
  });
  doTo = function(f, x){
    return f(x);
  };
  anyTest = curry$(function(tests, x){
    return any(flip$(doTo)(x), tests);
  });
  relationshipTest = curry$(function(link, defVal, x){
    switch (false) {
    case !(link && link.label):
      return link === x;
    case !link:
      return link === x.label;
    default:
      return defVal;
    }
  });
  module.exports = {
    toLtrb: toLtrb,
    toXywh: toXywh,
    markSubtree: markSubtree,
    objectify: objectify,
    error: error,
    len: len,
    within: within,
    notify: notify,
    failWhenEmpty: failWhenEmpty,
    doTo: doTo,
    anyTest: anyTest,
    relationshipTest: relationshipTest
  };
  function markSubtree(root, prop, val){
    var queue, moar, n;
    queue = [root];
    moar = function(arg$){
      var edges;
      edges = arg$.edges;
      return reject(compose$([
        (function(it){
          return it === val;
        }), function(it){
          return it[prop];
        }
      ]))(
      map(function(it){
        return it.source;
      }, edges));
    };
    while (n = queue.shift()) {
      n[prop] = val;
      each(bind$(queue, 'push'), moar(n));
    }
    return root;
  }
  function toLtrb(arg$, k){
    var x, y, height, width;
    x = arg$.x, y = arg$.y, height = arg$.height, width = arg$.width;
    k == null && (k = 1);
    return {
      l: x - k * width / 2,
      t: y - k * height / 2,
      r: x + k * width / 2,
      b: y + k * height / 2
    };
  }
  function toXywh(arg$){
    var l, t, r, b;
    l = arg$.l, t = arg$.t, r = arg$.r, b = arg$.b;
    return {
      x: l + (r - l) / 2,
      y: t + (b - t) / 2,
      height: b - t,
      width: r - l
    };
  }
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
  function flip$(f){
    return curry$(function (x, y) { return f(y, x); });
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);

},{"prelude-ls":5}],6:[function(require,module,exports){
var curry, flip, fix, apply;
curry = function(f){
  return curry$(f);
};
flip = curry$(function(f, x, y){
  return f(y, x);
});
fix = function(f){
  return function(g, x){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  }(function(g, x){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  });
};
apply = curry$(function(f, list){
  return f.apply(null, list);
});
module.exports = {
  curry: curry,
  flip: flip,
  fix: fix,
  apply: apply
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}

},{}],7:[function(require,module,exports){
var each, map, compact, filter, reject, partition, find, head, first, tail, last, initial, empty, reverse, unique, fold, foldl, fold1, foldl1, foldr, foldr1, unfoldr, concat, concatMap, flatten, difference, intersection, union, countBy, groupBy, andList, orList, any, all, sort, sortWith, sortBy, sum, product, mean, average, maximum, minimum, scan, scanl, scan1, scanl1, scanr, scanr1, slice, take, drop, splitAt, takeWhile, dropWhile, span, breakList, zip, zipWith, zipAll, zipAllWith, slice$ = [].slice;
each = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    f(x);
  }
  return xs;
});
map = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    results$.push(f(x));
  }
  return results$;
});
compact = curry$(function(xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      results$.push(x);
    }
  }
  return results$;
});
filter = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
reject = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
partition = curry$(function(f, xs){
  var passed, failed, i$, len$, x;
  passed = [];
  failed = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    (f(x) ? passed : failed).push(x);
  }
  return [passed, failed];
});
find = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return x;
    }
  }
});
head = first = function(xs){
  if (!xs.length) {
    return;
  }
  return xs[0];
};
tail = function(xs){
  if (!xs.length) {
    return;
  }
  return xs.slice(1);
};
last = function(xs){
  if (!xs.length) {
    return;
  }
  return xs[xs.length - 1];
};
initial = function(xs){
  var len;
  len = xs.length;
  if (!len) {
    return;
  }
  return xs.slice(0, len - 1);
};
empty = function(xs){
  return !xs.length;
};
reverse = function(xs){
  return xs.concat().reverse();
};
unique = function(xs){
  var result, i$, len$, x;
  result = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!in$(x, result)) {
      result.push(x);
    }
  }
  return result;
};
fold = foldl = curry$(function(f, memo, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    memo = f(memo, x);
  }
  return memo;
});
fold1 = foldl1 = curry$(function(f, xs){
  return fold(f, xs[0], xs.slice(1));
});
foldr = curry$(function(f, memo, xs){
  return fold(f, memo, xs.concat().reverse());
});
foldr1 = curry$(function(f, xs){
  var ys;
  ys = xs.concat().reverse();
  return fold(f, ys[0], ys.slice(1));
});
unfoldr = curry$(function(f, b){
  var result, x, that;
  result = [];
  x = b;
  while ((that = f(x)) != null) {
    result.push(that[0]);
    x = that[1];
  }
  return result;
});
concat = function(xss){
  return [].concat.apply([], xss);
};
concatMap = curry$(function(f, xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(f(x));
    }
    return results$;
  }()));
});
flatten = curry$(function(xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      if (x.length != null) {
        results$.push(flatten(x));
      } else {
        results$.push(x);
      }
    }
    return results$;
  }()));
});
difference = function(xs){
  var yss, results, i$, len$, x, j$, len1$, ys;
  yss = slice$.call(arguments, 1);
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
intersection = function(xs){
  var yss, results, i$, len$, x, j$, len1$, ys;
  yss = slice$.call(arguments, 1);
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (!in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
union = function(){
  var xss, results, i$, len$, xs, j$, len1$, x;
  xss = slice$.call(arguments);
  results = [];
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    for (j$ = 0, len1$ = xs.length; j$ < len1$; ++j$) {
      x = xs[j$];
      if (!in$(x, results)) {
        results.push(x);
      }
    }
  }
  return results;
};
countBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key] += 1;
    } else {
      results[key] = 1;
    }
  }
  return results;
});
groupBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key].push(x);
    } else {
      results[key] = [x];
    }
  }
  return results;
});
andList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!x) {
      return false;
    }
  }
  return true;
};
orList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      return true;
    }
  }
  return false;
};
any = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return true;
    }
  }
  return false;
});
all = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      return false;
    }
  }
  return true;
});
sort = function(xs){
  return xs.concat().sort(function(x, y){
    if (x > y) {
      return 1;
    } else if (x < y) {
      return -1;
    } else {
      return 0;
    }
  });
};
sortWith = curry$(function(f, xs){
  if (!xs.length) {
    return [];
  }
  return xs.concat().sort(f);
});
sortBy = curry$(function(f, xs){
  if (!xs.length) {
    return [];
  }
  return xs.concat().sort(function(x, y){
    if (f(x) > f(y)) {
      return 1;
    } else if (f(x) < f(y)) {
      return -1;
    } else {
      return 0;
    }
  });
});
sum = function(xs){
  var result, i$, len$, x;
  result = 0;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result += x;
  }
  return result;
};
product = function(xs){
  var result, i$, len$, x;
  result = 1;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result *= x;
  }
  return result;
};
mean = average = function(xs){
  var sum, len, i$, i;
  sum = 0;
  len = xs.length;
  for (i$ = 0; i$ < len; ++i$) {
    i = i$;
    sum += xs[i];
  }
  return sum / len;
};
maximum = function(xs){
  var max, i$, ref$, len$, x;
  max = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x > max) {
      max = x;
    }
  }
  return max;
};
minimum = function(xs){
  var min, i$, ref$, len$, x;
  min = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x < min) {
      min = x;
    }
  }
  return min;
};
scan = scanl = curry$(function(f, memo, xs){
  var last, x;
  last = memo;
  return [memo].concat((function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(last = f(last, x));
    }
    return results$;
  }()));
});
scan1 = scanl1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  return scan(f, xs[0], xs.slice(1));
});
scanr = curry$(function(f, memo, xs){
  xs = xs.concat().reverse();
  return scan(f, memo, xs).reverse();
});
scanr1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  xs = xs.concat().reverse();
  return scan(f, xs[0], xs.slice(1)).reverse();
});
slice = curry$(function(x, y, xs){
  return xs.slice(x, y);
});
take = curry$(function(n, xs){
  if (n <= 0) {
    return xs.slice(0, 0);
  } else if (!xs.length) {
    return xs;
  } else {
    return xs.slice(0, n);
  }
});
drop = curry$(function(n, xs){
  if (n <= 0 || !xs.length) {
    return xs;
  } else {
    return xs.slice(n);
  }
});
splitAt = curry$(function(n, xs){
  return [take(n, xs), drop(n, xs)];
});
takeWhile = curry$(function(p, xs){
  var len, i$, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  for (i$ = 0; i$ < len; ++i$) {
    i = i$;
    if (!p(xs[i])) {
      break;
    }
  }
  return xs.slice(0, i);
});
dropWhile = curry$(function(p, xs){
  var len, i$, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  for (i$ = 0; i$ < len; ++i$) {
    i = i$;
    if (!p(xs[i])) {
      break;
    }
  }
  return xs.slice(i);
});
span = curry$(function(p, xs){
  return [takeWhile(p, xs), dropWhile(p, xs)];
});
breakList = curry$(function(p, xs){
  return span(compose$([not$, p]), xs);
});
zip = curry$(function(xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push([x, ys[i]]);
  }
  return result;
});
zipWith = curry$(function(f, xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push(f(x, ys[i]));
  }
  return result;
});
zipAll = function(){
  var xss, minLength, i$, len$, xs, ref$, i, lresult$, j$, results$ = [];
  xss = slice$.call(arguments);
  minLength = 9e9;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    lresult$ = [];
    for (j$ = 0, len$ = xss.length; j$ < len$; ++j$) {
      xs = xss[j$];
      lresult$.push(xs[i]);
    }
    results$.push(lresult$);
  }
  return results$;
};
zipAllWith = function(f){
  var xss, minLength, i$, len$, xs, ref$, i, results$ = [];
  xss = slice$.call(arguments, 1);
  minLength = 9e9;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    results$.push(f.apply(null, (fn$())));
  }
  return results$;
  function fn$(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xss).length; i$ < len$; ++i$) {
      xs = ref$[i$];
      results$.push(xs[i]);
    }
    return results$;
  }
};
module.exports = {
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  partition: partition,
  find: find,
  head: head,
  first: first,
  tail: tail,
  last: last,
  initial: initial,
  empty: empty,
  reverse: reverse,
  difference: difference,
  intersection: intersection,
  union: union,
  countBy: countBy,
  groupBy: groupBy,
  fold: fold,
  fold1: fold1,
  foldl: foldl,
  foldl1: foldl1,
  foldr: foldr,
  foldr1: foldr1,
  unfoldr: unfoldr,
  andList: andList,
  orList: orList,
  any: any,
  all: all,
  unique: unique,
  sort: sort,
  sortWith: sortWith,
  sortBy: sortBy,
  sum: sum,
  product: product,
  mean: mean,
  average: average,
  concat: concat,
  concatMap: concatMap,
  flatten: flatten,
  maximum: maximum,
  minimum: minimum,
  scan: scan,
  scan1: scan1,
  scanl: scanl,
  scanl1: scanl1,
  scanr: scanr,
  scanr1: scanr1,
  slice: slice,
  take: take,
  drop: drop,
  splitAt: splitAt,
  takeWhile: takeWhile,
  dropWhile: dropWhile,
  span: span,
  breakList: breakList,
  zip: zip,
  zipWith: zipWith,
  zipAll: zipAll,
  zipAllWith: zipAllWith
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
function in$(x, arr){
  var i = -1, l = arr.length >>> 0;
  while (++i < l) if (x === arr[i] && i in arr) return true;
  return false;
}
function compose$(fs){
  return function(){
    var i, args = arguments;
    for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
    return args[0];
  };
}
function not$(x){ return !x; }

},{}],8:[function(require,module,exports){
var values, keys, pairsToObj, objToPairs, listsToObj, objToLists, empty, each, map, compact, filter, reject, partition, find;
values = function(object){
  var i$, x, results$ = [];
  for (i$ in object) {
    x = object[i$];
    results$.push(x);
  }
  return results$;
};
keys = function(object){
  var x, results$ = [];
  for (x in object) {
    results$.push(x);
  }
  return results$;
};
pairsToObj = function(object){
  var i$, len$, x, results$ = {};
  for (i$ = 0, len$ = object.length; i$ < len$; ++i$) {
    x = object[i$];
    results$[x[0]] = x[1];
  }
  return results$;
};
objToPairs = function(object){
  var key, value, results$ = [];
  for (key in object) {
    value = object[key];
    results$.push([key, value]);
  }
  return results$;
};
listsToObj = curry$(function(keys, values){
  var i$, len$, i, key, results$ = {};
  for (i$ = 0, len$ = keys.length; i$ < len$; ++i$) {
    i = i$;
    key = keys[i$];
    results$[key] = values[i];
  }
  return results$;
});
objToLists = function(objectect){
  var keys, values, key, value;
  keys = [];
  values = [];
  for (key in objectect) {
    value = objectect[key];
    keys.push(key);
    values.push(value);
  }
  return [keys, values];
};
empty = function(object){
  var x;
  for (x in object) {
    return false;
  }
  return true;
};
each = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    f(x);
  }
  return object;
});
map = curry$(function(f, object){
  var k, x, results$ = {};
  for (k in object) {
    x = object[k];
    results$[k] = f(x);
  }
  return results$;
});
compact = curry$(function(object){
  var k, x, results$ = {};
  for (k in object) {
    x = object[k];
if (x) {
      results$[k] = x;
    }
  }
  return results$;
});
filter = curry$(function(f, object){
  var k, x, results$ = {};
  for (k in object) {
    x = object[k];
if (f(x)) {
      results$[k] = x;
    }
  }
  return results$;
});
reject = curry$(function(f, object){
  var k, x, results$ = {};
  for (k in object) {
    x = object[k];
if (!f(x)) {
      results$[k] = x;
    }
  }
  return results$;
});
partition = curry$(function(f, object){
  var passed, failed, k, x;
  passed = {};
  failed = {};
  for (k in object) {
    x = object[k];
    (f(x) ? passed : failed)[k] = x;
  }
  return [passed, failed];
});
find = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    if (f(x)) {
      return x;
    }
  }
});
module.exports = {
  values: values,
  keys: keys,
  pairsToObj: pairsToObj,
  objToPairs: objToPairs,
  listsToObj: listsToObj,
  objToLists: objToLists,
  empty: empty,
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  partition: partition,
  find: find
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}

},{}],9:[function(require,module,exports){
var split, join, lines, unlines, words, unwords, chars, unchars, reverse, repeat;
split = curry$(function(sep, str){
  return str.split(sep);
});
join = curry$(function(sep, xs){
  return xs.join(sep);
});
lines = function(str){
  if (!str.length) {
    return [];
  }
  return str.split('\n');
};
unlines = function(it){
  return it.join('\n');
};
words = function(str){
  if (!str.length) {
    return [];
  }
  return str.split(/[ ]+/);
};
unwords = function(it){
  return it.join(' ');
};
chars = function(it){
  return it.split('');
};
unchars = function(it){
  return it.join('');
};
reverse = function(str){
  return str.split('').reverse().join('');
};
repeat = curry$(function(n, str){
  var out, res$, i$;
  res$ = [];
  for (i$ = 0; i$ < n; ++i$) {
    res$.push(str);
  }
  out = res$;
  return out.join('');
});
module.exports = {
  split: split,
  join: join,
  lines: lines,
  unlines: unlines,
  words: words,
  unwords: unwords,
  chars: chars,
  unchars: unchars,
  reverse: reverse,
  repeat: repeat
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}

},{}],10:[function(require,module,exports){
var max, min, negate, abs, signum, quot, rem, div, mod, recip, pi, tau, exp, sqrt, ln, pow, sin, tan, cos, asin, acos, atan, atan2, truncate, round, ceiling, floor, isItNaN, even, odd, gcd, lcm;
max = curry$(function(x$, y$){
  return x$ > y$ ? x$ : y$;
});
min = curry$(function(x$, y$){
  return x$ < y$ ? x$ : y$;
});
negate = function(x){
  return -x;
};
abs = Math.abs;
signum = function(x){
  if (x < 0) {
    return -1;
  } else if (x > 0) {
    return 1;
  } else {
    return 0;
  }
};
quot = curry$(function(x, y){
  return ~~(x / y);
});
rem = curry$(function(x$, y$){
  return x$ % y$;
});
div = curry$(function(x, y){
  return Math.floor(x / y);
});
mod = curry$(function(x$, y$){
  var ref$;
  return ((x$) % (ref$ = y$) + ref$) % ref$;
});
recip = (function(it){
  return 1 / it;
});
pi = Math.PI;
tau = pi * 2;
exp = Math.exp;
sqrt = Math.sqrt;
ln = Math.log;
pow = curry$(function(x$, y$){
  return Math.pow(x$, y$);
});
sin = Math.sin;
tan = Math.tan;
cos = Math.cos;
asin = Math.asin;
acos = Math.acos;
atan = Math.atan;
atan2 = curry$(function(x, y){
  return Math.atan2(x, y);
});
truncate = function(x){
  return ~~x;
};
round = Math.round;
ceiling = Math.ceil;
floor = Math.floor;
isItNaN = function(x){
  return x !== x;
};
even = function(x){
  return x % 2 === 0;
};
odd = function(x){
  return x % 2 !== 0;
};
gcd = curry$(function(x, y){
  var z;
  x = Math.abs(x);
  y = Math.abs(y);
  while (y !== 0) {
    z = x % y;
    x = y;
    y = z;
  }
  return x;
});
lcm = curry$(function(x, y){
  return Math.abs(Math.floor(x / gcd(x, y) * y));
});
module.exports = {
  max: max,
  min: min,
  negate: negate,
  abs: abs,
  signum: signum,
  quot: quot,
  rem: rem,
  div: div,
  mod: mod,
  recip: recip,
  pi: pi,
  tau: tau,
  exp: exp,
  sqrt: sqrt,
  ln: ln,
  pow: pow,
  sin: sin,
  tan: tan,
  cos: cos,
  acos: acos,
  asin: asin,
  atan: atan,
  atan2: atan2,
  truncate: truncate,
  round: round,
  ceiling: ceiling,
  floor: floor,
  isItNaN: isItNaN,
  even: even,
  odd: odd,
  gcd: gcd,
  lcm: lcm
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}

},{}],11:[function(require,module,exports){
(function(){
  var ref$, unique, filter, sort, map, join, find, each, Graph;
  ref$ = require('prelude-ls'), unique = ref$.unique, filter = ref$.filter, sort = ref$.sort, map = ref$.map, join = ref$.join, find = ref$.find, each = ref$.each;
  Graph = (function(){
    Graph.displayName = 'Graph';
    var onlyMarked, heights, relationships, sources, roots, deMark, prototype = Graph.prototype, constructor = Graph;
    function Graph(arg$){
      this.nodes = arg$.nodes, this.edges = arg$.edges;
    }
    onlyMarked = filter(compose$([
      function(it){
        return it.marked;
      }, function(it){
        return it.source;
      }
    ]));
    heights = compose$([
      sort, unique, map(function(it){
        return it.stepsFromLeaf;
      })
    ]);
    relationships = compose$([
      unique, (function(it){
        return it.concat(['elision']);
      }), map(function(it){
        return it.label;
      })
    ]);
    sources = compose$([
      sort, unique, map(join('-')), function(it){
        return it.sources;
      }
    ]);
    roots = filter(function(it){
      return it.isRoot;
    });
    deMark = function(n){
      return n.marked = n.isReachable = n.isFocus = n.isSource = n.isTarget = false;
    };
    prototype.getMarkedStatements = function(){
      return onlyMarked(this.edges);
    };
    prototype.unmark = function(){
      return each(deMark, this.nodes);
    };
    prototype.getHeights = function(){
      return heights(this.nodes);
    };
    prototype.getRelationships = function(){
      return relationships(this.edges);
    };
    prototype.getSources = function(){
      return sources(this.nodes);
    };
    prototype.getRoots = function(){
      return roots(this.nodes);
    };
    prototype.getNode = function(nodeId){
      return find(compose$([
        (function(it){
          return it === nodeId;
        }), function(it){
          return it.id;
        }
      ]), this.nodes);
    };
    return Graph;
  }());
  module.exports = {
    Graph: Graph
  };
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
}).call(this);

},{"prelude-ls":5}],12:[function(require,module,exports){
(function(){
  var ref$, empty, ln, sum, isRoot, isLeaf, isDirect, Node, newNode;
  ref$ = require('prelude-ls'), empty = ref$.empty, ln = ref$.ln, sum = ref$.sum;
  isRoot = function(it){
    return it.isRoot;
  };
  isLeaf = function(it){
    return it.isLeaf;
  };
  isDirect = function(it){
    return it.isDirect;
  };
  Node = (function(){
    Node.displayName = 'Node';
    var prototype = Node.prototype, constructor = Node;
    function Node(label, id, description, origin, syms){
      var this$ = this instanceof ctor$ ? this : new ctor$;
      this$.label = label;
      this$.id = id;
      this$.description = description;
      this$.counts = [];
      this$.sources = [origin];
      this$.symbols = syms.slice();
      this$.edges = [];
      this$.depths = [];
      return this$;
    } function ctor$(){} ctor$.prototype = prototype;
    prototype.marked = false;
    prototype.muted = false;
    prototype.isLeaf = false;
    prototype.isRoot = false;
    prototype.isDirect = false;
    prototype.radius = function(){
      var k, countPortion, markedFac;
      k = 5;
      countPortion = empty(this.counts)
        ? 0
        : 1.5 * ln(this.getTotalCount());
      markedFac = this.marked ? 2 : 1;
      return (k + countPortion) * markedFac;
    };
    prototype.getTotalCount = function(){
      return sum(this.counts);
    };
    prototype.addCount = function(c){
      if (c != null) {
        return this.counts.push(c);
      }
    };
    return Node;
  }());
  newNode = curry$(function(src, syms, id, label, desc){
    return Node(label, id, desc, src, syms);
  });
  module.exports = {
    Node: Node,
    newNode: newNode,
    isLeaf: isLeaf,
    isRoot: isRoot,
    isDirect: isDirect
  };
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);

},{"prelude-ls":5}],13:[function(require,module,exports){
(function(process){(function(){
  var ref$, termPalette, getMinMaxSize, linkFill, drawRootLabels, relationshipPalette, mvTowards, brighten, BRIGHTEN, colourFilter, termColor, linkStroke, centreAndZoom, drawRelationshipLegend, drawSourceLegend, toXywh, within, toLtrb, relationshipTest, sortBy, unique, id, reverse, reject, each, mean, fold, sort, join, filter, map, any, DAGRE, nodePadding, len, rectColor, toNodeId, doUpdate, invertLayout, separateColliding, deDup, toCombos, getOverlapping, explodify, addLabels, onlyMarked, markReachable, getNodeDragPos, doLine, calculateSpline, translateEdge, respondToMarking, renderDag;
  ref$ = require('./svg'), termPalette = ref$.termPalette, getMinMaxSize = ref$.getMinMaxSize, linkFill = ref$.linkFill, drawRootLabels = ref$.drawRootLabels, relationshipPalette = ref$.relationshipPalette, mvTowards = ref$.mvTowards, brighten = ref$.brighten, BRIGHTEN = ref$.BRIGHTEN, colourFilter = ref$.colourFilter, termColor = ref$.termColor, linkStroke = ref$.linkStroke, centreAndZoom = ref$.centreAndZoom, drawRelationshipLegend = ref$.drawRelationshipLegend, drawSourceLegend = ref$.drawSourceLegend;
  ref$ = require('./util'), toXywh = ref$.toXywh, within = ref$.within, toLtrb = ref$.toLtrb, relationshipTest = ref$.relationshipTest;
  ref$ = require('prelude-ls'), sortBy = ref$.sortBy, unique = ref$.unique, id = ref$.id, reverse = ref$.reverse, reject = ref$.reject, each = ref$.each, mean = ref$.mean, fold = ref$.fold, sort = ref$.sort, join = ref$.join, filter = ref$.filter, map = ref$.map, any = ref$.any;
  DAGRE = require('../vendor/dagre');
  nodePadding = 20;
  len = function(it){
    return it.length;
  };
  rectColor = compose$([BRIGHTEN, termColor]);
  toNodeId = compose$([
    (function(it){
      return 'node' + it;
    }), function(it){
      return it.replace(/:/g, '_');
    }, function(it){
      return it.id;
    }
  ]);
  doUpdate = function(group){
    var labelG;
    group.selectAll('circle.cp').attr('r', 10).attr('cx', function(it){
      return it.x;
    }).attr('cy', function(it){
      return it.y;
    });
    labelG = group.selectAll('g.label');
    return labelG.attr('dx', function(arg$){
      var points;
      points = arg$.dagre.points;
      return mean(map(function(it){
        return it.x;
      }, points));
    }).attr('dy', function(arg$){
      var points;
      points = arg$.dagre.points;
      return mean(map(function(it){
        return it.y;
      }, points));
    }).attr('width', function(it){
      return it.width;
    }).attr('height', function(it){
      return it.height;
    }).attr('transform', function(arg$){
      var points, bbox, x, y;
      points = arg$.dagre.points, bbox = arg$.bbox;
      x = mean(map(function(it){
        return it.x;
      }, points));
      y = mean(map(function(it){
        return it.y;
      }, points));
      return "translate(" + x + "," + y + ")";
    });
  };
  invertLayout = function(dimensions, nodes, edges){
    var yStats, invertScale, invertNode, invertPoints, i$, len$, n, e, results$ = [];
    yStats = getMinMaxSize(function(it){
      return it.dagre.y;
    }, nodes);
    invertScale = d3.scale.linear().domain([yStats.min, yStats.max]).range([dimensions.h * 0.9, 0]);
    invertNode = compose$([
      invertScale, function(it){
        return it.dagre.y;
      }
    ]);
    invertPoints = compose$([
      reverse, map(function(pt){
        var y;
        y = pt.y;
        return pt.y = invertScale(y), pt;
      })
    ]);
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      n = nodes[i$];
      n.dagre.y = invertNode(n);
    }
    for (i$ = 0, len$ = edges.length; i$ < len$; ++i$) {
      e = edges[i$];
      results$.push(e.dagre.points = invertPoints(e.dagre.points));
    }
    return results$;
  };
  separateColliding = function(left, right){
    var ref$, ptA, ptB, speed;
    ref$ = map(compose$([
      toXywh, function(it){
        return it.bounds;
      }
    ]), [left, right]), ptA = ref$[0], ptB = ref$[1];
    speed = 0.1;
    if (!right.isCentre) {
      mvTowards(-speed, ptA, ptB);
    }
    if (!left.isCentre) {
      mvTowards(-speed, ptB, ptA);
    }
    import$(left.bounds, toLtrb(ptA));
    return import$(right.bounds, toLtrb(ptB));
  };
  deDup = function(f){
    return fold(function(ls, e){
      if (any((function(it){
        return it === f(e);
      }), map(f, ls))) {
        return ls.slice();
      } else {
        return ls.concat([e]);
      }
    }, []);
  };
  toCombos = deDup(compose$([
    join('-'), sort, map(function(it){
      return it.id;
    })
  ]));
  getOverlapping = function(things){
    var t, tt;
    return toCombos((function(){
      var i$, ref$, len$, j$, ref1$, len1$, results$ = [];
      for (i$ = 0, len$ = (ref$ = things).length; i$ < len$; ++i$) {
        t = ref$[i$];
        for (j$ = 0, len1$ = (ref1$ = things).length; j$ < len1$; ++j$) {
          tt = ref1$[j$];
          if (t !== tt && overlaps(t, tt)) {
            results$.push([t, tt]);
          }
        }
      }
      return results$;
    }()));
  };
  explodify = function(highlit, i, roundsPerRun, maxRounds, done){
    var collisions, nextBreak, i$, len$, ref$, left, right;
    collisions = getOverlapping(highlit);
    nextBreak = i + roundsPerRun;
    while (collisions.length && i++ < maxRounds && i < nextBreak) {
      for (i$ = 0, len$ = collisions.length; i$ < len$; ++i$) {
        ref$ = collisions[i$], left = ref$[0], right = ref$[1];
        separateColliding(left, right);
      }
      collisions = getOverlapping(highlit);
    }
    if (collisions.length && i < maxRounds) {
      done();
      return process.nextTick(function(){
        return explodify(highlit, i, roundsPerRun, maxRounds, done);
      });
    } else {
      console.log(collisions.length + " collisions left after " + i + " rounds");
      return done();
    }
  };
  addLabels = function(selection){
    var x$, labelG;
    x$ = labelG = selection.append('g');
    x$.attr('class', 'label');
    x$.append('rect');
    x$.append('text');
    labelG.each(function(d){
      var ref$;
      d.bbox = this.getBBox();
      if ((ref$ = d.label) != null && ref$.length) {
        d.width = d.bbox.width + 2 * nodePadding;
        return d.height = d.bbox.height + 2 * nodePadding;
      } else {
        return d.width = d.height = 0;
      }
    });
    labelG.select('text').attr('text-anchor', 'left').append('tspan').attr('dy', '1em').text(function(it){
      return it.label;
    });
    labelG.attr('dx', function(arg$){
      var points;
      points = arg$.dagre.points;
      return mean(map(function(it){
        return it.x;
      }, points));
    }).attr('dy', function(arg$){
      var points;
      points = arg$.dagre.points;
      return mean(map(function(it){
        return it.y;
      }, points));
    }).attr('width', function(it){
      return it.width;
    }).attr('height', function(it){
      return it.height;
    });
    return labelG.attr('transform', function(arg$){
      var points, x, y;
      points = arg$.dagre.points;
      x = mean(map(function(it){
        return it.x;
      }, points));
      y = mean(map(function(it){
        return it.y;
      }, points));
      return "translate(" + x + "," + y + ")";
    });
  };
  onlyMarked = function(nodes, edges){
    return {
      nodes: filter(function(it){
        return it.marked;
      }, nodes),
      edges: filter(compose$([
        function(it){
          return it.marked;
        }, function(it){
          return it.source;
        }
      ]), edges)
    };
  };
  markReachable = function(node){
    var queue, moar, n, results$ = [];
    node.isFocus = true;
    queue = [node];
    moar = function(n){
      return reject((function(it){
        return it === n;
      }), map(function(it){
        return it.target;
      }, n.edges));
    };
    while (n = queue.shift()) {
      n.marked = true;
      results$.push(each(bind$(queue, 'push'), moar(n)));
    }
    return results$;
  };
  getNodeDragPos = function(posProp){
    return function(){
      return d3.event[posProp];
    };
  };
  doLine = d3.svg.line().x(function(it){
    return it.x;
  }).y(function(it){
    return it.y;
  }).interpolate('basis');
  calculateSpline = curry$(function(dir, arg$){
    var source, target, points, p0, p1, pNminus1, pN, ps;
    source = arg$.source.dagre, target = arg$.target.dagre, points = arg$.dagre.points;
    p0 = (function(){
      switch (false) {
      case dir !== 'LR':
        return {
          x: source.x + source.width / 2,
          y: source.y
        };
      default:
        return {
          x: target.x,
          y: target.y + target.height / 2
        };
      }
    }());
    p1 = (function(){
      switch (false) {
      case dir !== 'LR':
        return {
          x: source.x + source.width / 2 + 10,
          y: source.y
        };
      default:
        return {
          x: target.x,
          y: target.y + 10 + target.height / 2
        };
      }
    }());
    pNminus1 = (function(){
      switch (false) {
      case dir !== 'LR':
        return {
          x: target.x - 15 - target.width / 2,
          y: target.y
        };
      default:
        return {
          x: source.x,
          y: source.y - 15 - source.height / 2
        };
      }
    }());
    pN = (function(){
      switch (false) {
      case dir !== 'LR':
        return {
          x: target.x - target.width / 2,
          y: target.y
        };
      default:
        return {
          x: source.x,
          y: source.y - source.height / 2
        };
      }
    }());
    ps = [p0, p1].concat(points, [pNminus1, pN]);
    return doLine(dir === 'LR'
      ? ps
      : reverse(ps));
  });
  translateEdge = curry$(function(svg, e, dx, dy){
    var i$, ref$, len$, p, results$ = [];
    for (i$ = 0, len$ = (ref$ = e.dagre.points).length; i$ < len$; ++i$) {
      p = ref$[i$];
      p.x = p.x + dx;
      results$.push(p.y = p.y + dy);
    }
    return results$;
  });
  respondToMarking = function(){
    var filtered;
    if (this.state.get('view') !== 'Dag') {
      return;
    }
    filtered = onlyMarked(this.nodes, this.edges);
    if (filtered.nodes.length) {
      return this.reRender((filtered.reset = this.reset, filtered));
    } else {
      return this.reset();
    }
  };
  renderDag = function(state, arg$){
    var reset, nodes, edges, svg, dimensions, svgGroup, update, spline, reRender, getDescale, svgBBox, mvEdge, svgEdges, edgesEnter, svgNodes, nodesEnter, markerEnd, rects, dragCp, lineWrap, labels, applyLayout, zoom, fixDagBoxCollisions, cooldown, focusEdges, animateFocus, highlightTargets, getDragX, getDragY, dragHandler, nodeDrag, edgeDrag;
    reset = arg$.reset, nodes = arg$.nodes, edges = arg$.edges;
    svg = d3.select(state.get('svg'));
    svg.selectAll('g').remove();
    dimensions = state.get('dimensions');
    state.off('nodes:marked', respondToMarking);
    svg.attr('width', dimensions.w).attr('height', dimensions.h).call(drawRelationshipLegend(state, relationshipPalette)).call(drawRootLabels({
      nodes: nodes
    }, dimensions)).call(drawSourceLegend(state, termPalette));
    svgGroup = svg.append('g').attr('transform', 'translate(5, 5)');
    update = function(){
      return doUpdate(svgGroup);
    };
    spline = calculateSpline(state.get('dagDirection'));
    reRender = function(it){
      return renderDag(state, it);
    };
    reset == null && (reset = function(){
      if (state.get('view') === 'Dag') {
        return state.set('graph', {
          nodes: nodes,
          edges: edges
        });
      }
    });
    getDescale = function(){
      return 1 / state.get('zoom');
    };
    state.on('nodes:marked', respondToMarking, {
      state: state,
      reset: reset,
      reRender: reRender,
      nodes: nodes,
      edges: edges
    });
    console.log("Rendering " + len(nodes) + " nodes and " + len(edges) + " edges");
    svgBBox = svg.node().getBBox();
    mvEdge = translateEdge(svg);
    svgGroup.selectAll('*').remove();
    svgEdges = svgGroup.selectAll('g .edge').data(edges);
    edgesEnter = svgEdges.enter().append('g').attr('id', function(it){
      return (it.source.id + it.label + it.target.id).replace(/:/g, '_');
    }).attr('class', 'edge');
    svgEdges.exit().remove();
    svgNodes = svgGroup.selectAll('g .node').data(nodes);
    nodesEnter = svgNodes.enter().append('g').attr('class', 'node').attr('id', toNodeId);
    svgNodes.exit().remove();
    nodesEnter.on('click', function(node){
      var wasFiltered, filtered;
      wasFiltered = node.isFocus;
      (function(it){
        return it.unmark();
      })(state.get('all'));
      if (wasFiltered) {
        console.log("Resetting");
        reset();
      } else {
        markReachable(node);
        filtered = onlyMarked(nodes, edges);
        reRender((filtered.reset = reset, filtered));
      }
      return state.trigger('nodes:marked');
    });
    state.on('relationship:highlight', function(link){
      var scale, test, nodeTest, colFilt;
      scale = getDescale();
      test = relationshipTest(link, true);
      nodeTest = compose$([
        any(test), function(it){
          return it.edges;
        }
      ]);
      colFilt = colourFilter(test);
      nodesEnter.classed('highlight', link
        ? nodeTest
        : function(){
          return false;
        }).transition().duration(100).attr('opacity', function(node){
        if (nodeTest(node)) {
          return 1;
        } else {
          return 0.5;
        }
      });
      return edgesEnter.transition().duration(100).attr('opacity', function(e){
        if (test(e)) {
          return 0.8;
        } else {
          return 0.2;
        }
      }).attr('stroke', function(e){
        return colFilt(e)(
        linkStroke(e));
      });
    });
    state.on('term:highlight', function(node){
      var scale;
      scale = getDescale();
      return nodesEnter.classed('highlight', (function(it){
        return it === node;
      })).attr('opacity', function(datum){
        if (!node || datum === node) {
          return 1;
        } else {
          return 0.5;
        }
      }).attr('transform', function(it){
        switch (false) {
        case it !== node:
          return "translate(" + it.dagre.x + "," + it.dagre.y + "), scale(" + scale + ")";
        default:
          return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
        }
      });
    });
    state.on('source:highlight', function(sources){
      var pattern, test, scale;
      pattern = new RegExp(sources);
      test = compose$([
        bind$(pattern, 'test'), join('-'), function(it){
          return it.sources;
        }
      ]);
      scale = within(2, 1, getDescale());
      return nodesEnter.classed('highlight', test).attr('opacity', function(it){
        if (!sources || test(it)) {
          return 1;
        } else {
          return 0.5;
        }
      }).attr('transform', function(it){
        switch (false) {
        case !test(it):
          return "translate(" + it.dagre.x + "," + it.dagre.y + "), scale(" + scale + ")";
        default:
          return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
        }
      });
    });
    markerEnd = state.get('dagDirection') === 'LR' ? 'url(#Triangle)' : 'url(#TriangleDown)';
    edgesEnter.append('path').attr('stroke-width', 5).attr('opacity', 0.8).attr('stroke', linkStroke);
    rects = nodesEnter.append('rect');
    dragCp = d3.behavior.drag().on('drag', function(d){
      d.y += d3.event.dy;
      mvEdge(d.parent, d3.event.dx, 0);
      return d3.select('#' + d.parent.dagre.id).attr('d', spline);
    });
    lineWrap = function(str){
      var buff, maxLl, i$, ref$, len$, word;
      buff = [''];
      maxLl = 25;
      for (i$ = 0, len$ = (ref$ = str.split(' ')).length; i$ < len$; ++i$) {
        word = ref$[i$];
        if (buff[buff.length - 1].length + word.length + 1 > maxLl) {
          buff.push('');
        }
        buff[buff.length - 1] += ' ' + word;
      }
      return map(function(it){
        return it.substring(1);
      }, buff);
    };
    labels = nodesEnter.append('text').attr('class', 'dag-label').attr('text-anchor', 'middle').attr('x', 0).classed('direct', function(it){
      return it.isDirect;
    });
    labels.each(function(n){
      var text, el, i$, len$, line, bbox;
      text = lineWrap(n.label);
      el = d3.select(this);
      for (i$ = 0, len$ = text.length; i$ < len$; ++i$) {
        line = text[i$];
        el.append('tspan').text(line).attr('dy', '1em').attr('x', 0);
      }
      bbox = this.getBBox();
      n.bbox = bbox;
      n.width = bbox.width + 2 * nodePadding;
      return n.height = bbox.height + 2 * nodePadding;
    });
    rects.attr('class', function(arg$){
      var sources;
      sources = arg$.sources;
      return join(' ', ['dag-term'].concat(sources));
    }).attr('width', function(it){
      return it.width;
    }).attr('height', function(it){
      return it.height;
    }).attr('x', compose$([
      (function(it){
        return 1 - it;
      }), (function(it){
        return it / 2;
      }), function(it){
        return it.width;
      }
    ])).attr('y', compose$([
      (function(it){
        return 1 - it;
      }), (function(it){
        return it / 2;
      }), function(it){
        return it.height;
      }
    ])).attr('fill', rectColor).attr('opacity', 0.8).classed('focus', function(it){
      return it.isFocus;
    }).classed('direct', function(it){
      return it.isDirect;
    }).classed('root', function(it){
      return it.isRoot;
    });
    labels.attr('x', function(it){
      return -it.bbox.width;
    }).attr('y', function(it){
      return -it.bbox.height / 2;
    });
    dagre.layout().nodeSep(50).edgeSep(50).rankSep(75).rankDir(state.get('dagDirection')).nodes(nodes).edges(edges).debugLevel(1).run();
    if (state.get('dagDirection') !== 'LR') {
      invertLayout(state.get('dimensions'), nodes, edges);
    }
    (applyLayout = function(){
      return nodesEnter.attr('transform', function(it){
        return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
      });
    })();
    zoom = d3.behavior.zoom().scale(state.get('zoom')).on('zoom', function(){
      return state.set({
        zoom: d3.event.scale,
        translate: d3.event.translate.slice()
      });
    });
    state.on('change:translate', function(s, currentTranslation){
      return svgGroup.attr('transform', "translate(" + currentTranslation + ") scale(" + s.get('zoom') + ")");
    });
    state.on('change:zoom', function(s, currentZoom){
      return svgGroup.attr('transform', "translate(" + s.get('translate') + ") scale(" + currentZoom + ")");
    });
    svg.call(zoom);
    centreAndZoom(compose$([
      function(it){
        return it.x;
      }, function(it){
        return it.dagre;
      }
    ]), compose$([
      function(it){
        return it.y;
      }, function(it){
        return it.dagre;
      }
    ]), state, nodes, zoom);
    fixDagBoxCollisions = curry$(function(maxI, d, i){
      var scale, halfPad, isFocussed, highlit, maxRounds, round, roundsPerRun, focussedNodes, affectedEdges, reroute;
      if (i < maxI) {
        return;
      }
      scale = getDescale();
      halfPad = nodePadding / 2;
      isFocussed = function(it){
        return any(function(it){
          return it.highlight;
        }, it.edges);
      };
      highlit = map(function(it){
        var ref$;
        return it.bounds = toLtrb({
          x: (ref$ = it.dagre).x,
          y: ref$.y,
          height: ref$.height,
          width: ref$.width
        }, scale), it;
      }, filter(isFocussed, nodes));
      maxRounds = 80;
      round = 0;
      roundsPerRun = 6;
      focussedNodes = nodesEnter.filter(isFocussed);
      affectedEdges = edgesEnter.filter(function(it){
        return it.highlight;
      }).selectAll('path');
      reroute = function(arg$){
        var source, target, dagre, ref$, s, t;
        source = arg$.source, target = arg$.target, dagre = arg$.dagre;
        ref$ = map(function(it){
          return {
            dagre: toXywh(it.bounds)
          };
        }, [source, target]), s = ref$[0], t = ref$[1];
        return spline({
          dagre: dagre,
          source: s,
          target: t
        });
      };
      return explodify(highlit, round, roundsPerRun, maxRounds, function(){
        focussedNodes.attr('transform', function(n){
          var ref$, x, y;
          ref$ = toXywh(n.bounds), x = ref$.x, y = ref$.y;
          return "translate(" + x + "," + y + ") scale(" + scale + ")";
        });
        focussedNodes.selectAll('rect').attr('fill', function(n){
          return (n.isCentre ? brighten : id)(
          rectColor(
          n));
        });
        return affectedEdges.each(function(edge, i){
          var f, this$ = this;
          f = function(){
            return d3.select(this$).attr('d', reroute(edge));
          };
          return setTimeout(f, 0);
        });
      });
    });
    focusEdges = function(){
      var someLit, delay;
      someLit = any(function(it){
        return it.highlight;
      }, edges);
      if (cooldown != null && !someLit) {
        clearTimeout(cooldown);
      }
      delay = someLit ? 250 : 0;
      return cooldown = setTimeout(animateFocus(someLit), delay);
    };
    animateFocus = function(someLit){
      return function(){
        var duration, deScale, maxI, notFocussed, edgePaths;
        duration = 100;
        deScale = Math.max(1, getDescale());
        maxI = nodes.length - 1;
        notFocussed = function(it){
          return !someLit || !any(function(it){
            return it.highlight;
          }, it.edges);
        };
        nodesEnter.transition().duration(duration * 2).attr('transform', function(it){
          switch (false) {
          case !notFocussed(it):
            return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
          default:
            return "translate(" + it.dagre.x + "," + it.dagre.y + ") scale(" + deScale + ")";
          }
        }).attr('opacity', function(it){
          switch (false) {
          case !!someLit:
            return 1;
          case !any(function(it){
              return it.highlight;
            }, it.edges):
            return 1;
          default:
            return 0.3;
          }
        }).each('end', someLit && deScale > 1
          ? fixDagBoxCollisions(maxI)
          : function(){});
        edgePaths = svgEdges.selectAll('path').transition().duration(duration).attr('stroke-width', function(it){
          if (it.highlight) {
            return 10 * deScale;
          } else {
            return 5;
          }
        }).attr('stroke', function(it){
          switch (false) {
          case !it.highlight:
            return BRIGHTEN(linkStroke(it));
          default:
            return linkStroke(it);
          }
        }).attr('fill', function(it){
          switch (false) {
          case !it.highlight:
            return BRIGHTEN(linkFill(it));
          default:
            return linkFill(it);
          }
        }).attr('opacity', function(it){
          switch (false) {
          case !(!someLit || it.highlight):
            return 0.8;
          case !someLit:
            return 0.2;
          default:
            return 0.5;
          }
        });
        if (!someLit) {
          edgePaths.attr('d', spline);
          nodesEnter.selectAll('rect').attr('fill', rectColor);
        }
        return svgEdges.selectAll('text').transition().duration(duration).attr('font-weight', function(it){
          if (it.highlight) {
            return 'bold';
          } else {
            return 'normal';
          }
        }).attr('font-size', function(it){
          if (it.highlight) {
            return 28;
          } else {
            return 14;
          }
        });
      };
    };
    highlightTargets = function(node){
      var moar, queue, maxMarked, marked, n;
      svgGroup.node().appendChild(this);
      moar = function(n){
        return reject((function(it){
          return it === n;
        }), map(function(it){
          return it.target;
        }, n.edges));
      };
      node.isCentre = true;
      queue = [node];
      maxMarked = 15;
      marked = 0;
      while ((n = queue.shift()) && marked++ < maxMarked) {
        each((fn$), reject(compose$([(fn1$), fn2$]), n.edges));
        each(bind$(queue, 'push'), moar(n));
      }
      return focusEdges();
      function fn$(it){
        return it.highlight = true, it;
      }
      function fn1$(it){
        return it === n;
      }
      function fn2$(it){
        return it.target;
      }
    };
    nodesEnter.on('mouseover', highlightTargets);
    nodesEnter.on('mouseout', function(node){
      var i$, ref$, len$, e;
      for (i$ = 0, len$ = (ref$ = edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
        e.source.isCentre = e.target.isCentre = false;
        e.highlight = false;
      }
      return focusEdges();
    });
    edgesEnter.each(function(d){
      var points, s, t, ref$;
      points = d.dagre.points;
      if (!points.length) {
        s = d.source.dagre;
        t = d.target.dagre;
        points.push({
          x: (s.x + t.x) / 2,
          y: (s.y + t.y) / 2
        });
      }
      if (points.length === 1) {
        return points.push({
          x: (ref$ = points[0]).x,
          y: ref$.y
        });
      }
    });
    addLabels(edgesEnter);
    edgesEnter.selectAll('circle.cp').data(function(d){
      each((function(it){
        return it.parent = d, it;
      }), d.dagre.points);
      return d.dagre.points.slice().reverse();
    }).enter().append('circle').attr('class', 'cp').call(dragCp);
    svgEdges.selectAll('path').attr('id', compose$([
      function(it){
        return it.id;
      }, function(it){
        return it.dagre;
      }
    ])).attr('d', spline).attr('stroke', linkStroke);
    update();
    getDragX = getNodeDragPos('x');
    getDragY = getNodeDragPos('y');
    dragHandler = function(d, i){
      var prevX, prevY, dx, dy, i$, ref$, len$, e, results$ = [];
      prevX = d.dagre.x;
      prevY = d.dagre.y;
      d.dagre.x = getDragX();
      d.dagre.y = getDragY();
      d3.select(this).attr('transform', "translate(" + d.dagre.x + "," + d.dagre.y + ")");
      dx = d.dagre.x - prevX;
      dy = d.dagre.y - prevY;
      for (i$ = 0, len$ = (ref$ = d.edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
        mvEdge(e, dx, dy);
        update();
        results$.push(d3.select('#' + e.dagre.id).attr('d', spline(e)));
      }
      return results$;
    };
    nodeDrag = d3.behavior.drag().origin(function(arg$){
      var pos, dagre;
      pos = arg$.pos, dagre = arg$.dagre;
      return function(arg$){
        var x, y;
        x = arg$.x, y = arg$.y;
        return {
          x: x,
          y: y
        };
      }(
      pos ? pos : dagre);
    }).on('drag', dragHandler);
    edgeDrag = d3.behavior.drag().on('drag', function(d, i){
      mvEdge(d, d3.event.dx, d3.event.dy);
      return d3.select(this).attr('d', spline(d));
    });
    svg.call(zoom);
    nodesEnter.call(nodeDrag);
    return edgesEnter.call(edgeDrag);
  };
  module.exports = {
    renderDag: renderDag
  };
  function overlaps(arg$, arg1$){
    var a, b, p, ref$, overlapsH, overlapsV, contained;
    a = arg$.bounds;
    b = arg1$.bounds;
    p = nodePadding;
    ref$ = sortBy(function(it){
      return it.l;
    }, [a, b]), a = ref$[0], b = ref$[1];
    overlapsH = (function(){
      switch (false) {
      case !(a.l - p < b.l && b.l - p < a.r):
        return true;
      case !(a.l - p < b.r && b.r + p < a.r):
        return true;
      default:
        return false;
      }
    }());
    ref$ = sortBy(function(it){
      return it.t;
    }, [a, b]), a = ref$[0], b = ref$[1];
    overlapsV = (function(){
      switch (false) {
      case !(a.t - p < b.t && b.t - p < a.b):
        return true;
      case !(a.t - p < b.b && b.b + p < a.b):
        return true;
      default:
        return false;
      }
    }());
    contained = (function(){
      switch (false) {
      case !(overlapsH || overlapsV):
        return false;
      case !(a.l < b.l && b.l < a.r && a.t < b.t && b.t < a.b):
        return true;
      default:
        return false;
      }
    }());
    return contained || (overlapsH && overlapsV);
  }
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);

})(require("__browserify_process"))
},{"./svg":16,"./util":4,"../vendor/dagre":15,"prelude-ls":5,"__browserify_process":1}],14:[function(require,module,exports){
(function(){
  var ref$, linkStroke, termColor, drawRootLabels, termPalette, relationshipPalette, colourFilter, linkFill, mvTowards, drawSourceLegend, drawRelationshipLegend, centreAndZoom, markSubtree, relationshipTest, minimum, maximum, even, mean, reject, unique, join, abs, cos, sin, Obj, sum, any, sortBy, map, fold, filter, each, ln, isRoot, toRadians, getR, countBy, linkOpacity, minTicks, stratify, centrify, unfix, linkSpline, drawCurve, drawPauseBtn, linkDistance, getCharge, renderForce;
  ref$ = require('./svg'), linkStroke = ref$.linkStroke, termColor = ref$.termColor, drawRootLabels = ref$.drawRootLabels, termPalette = ref$.termPalette, relationshipPalette = ref$.relationshipPalette, colourFilter = ref$.colourFilter, linkFill = ref$.linkFill, mvTowards = ref$.mvTowards, drawSourceLegend = ref$.drawSourceLegend, drawRelationshipLegend = ref$.drawRelationshipLegend, drawRootLabels = ref$.drawRootLabels, centreAndZoom = ref$.centreAndZoom;
  ref$ = require('./util'), markSubtree = ref$.markSubtree, relationshipTest = ref$.relationshipTest;
  ref$ = require('prelude-ls'), minimum = ref$.minimum, maximum = ref$.maximum, even = ref$.even, mean = ref$.mean, reject = ref$.reject, unique = ref$.unique, join = ref$.join, abs = ref$.abs, cos = ref$.cos, sin = ref$.sin, Obj = ref$.Obj, sum = ref$.sum, any = ref$.any, sortBy = ref$.sortBy, map = ref$.map, fold = ref$.fold, filter = ref$.filter, each = ref$.each, ln = ref$.ln;
  isRoot = function(it){
    return it.isRoot;
  };
  toRadians = (function(it){
    return it * Math.PI / 180;
  });
  getR = function(it){
    return it.radius();
  };
  countBy = curry$(function(f, xs){
    return fold(function(sum, x){
      return sum + (f(x) ? 1 : 0);
    }, 0, xs);
  });
  linkOpacity = {
    normal: 0.6,
    muted: 0.3,
    focus: 0.8,
    unfocus: 0.2
  };
  minTicks = 20;
  stratify = function(state){
    var ref$, dimensions, graph, zoom, currentFontSize, roots, leaves, surface, widthRange, corners, quantile, i$, len$, n;
    ref$ = state.toJSON(), dimensions = ref$.dimensions, graph = ref$.graph, zoom = ref$.zoom;
    currentFontSize = Math.min(40, 20 / zoom);
    roots = sortBy(function(it){
      return it.x;
    }, filter(isRoot, graph.nodes));
    leaves = sortBy(function(it){
      return it.x;
    }, filter(function(it){
      return it.isDirect && it.isLeaf;
    }, graph.nodes));
    surface = minimum([0].concat(map(function(it){
      return it.y;
    }, graph.nodes)));
    widthRange = d3.scale.linear().range([0.1 * dimensions.w, 0.9 * dimensions.w]).domain([0, leaves.length - 1]);
    corners = d3.scale.quantile().domain([0, dimensions.w]).range([0, dimensions.w]);
    quantile = (function(){
      switch (false) {
      case !!roots.length:
        return function(){
          return dimensions.w / 2;
        };
      default:
        return d3.scale.quantile().domain([0, dimensions.w]).range((function(){
          var i$, to$, results$ = [];
          for (i$ = 0, to$ = roots.length; i$ < to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }()));
      }
    }());
    roots.forEach(function(root, i){
      root.fixed = false;
      return mvTowards(0.01, {
        y: surface - getR(root),
        x: root.x
      }, root);
    });
    for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (!n.isRoot && n.y + getR(n) < surface) {
        mvTowards(0.001, {
          x: n.root.x,
          y: dimensions.h
        }, n);
      }
    }
    return leaves.forEach(function(n, i){
      var speed;
      speed = n.y < dimensions.h / 2 ? 0.05 : 0.005;
      if (n.y < dimensions.h * 0.9) {
        mvTowards(speed, {
          x: widthRange(i),
          y: dimensions.h * 0.9
        }, n);
      }
      if (n.y >= dimensions.h * 0.85) {
        return n.y = dimensions.h * 0.9 + currentFontSize * 1.1 * i;
      }
    });
  };
  centrify = function(state){
    var ref$, graph, ref1$, w, h, roots, meanD, half, centre, maxH, i$, len$, leaf, baseSpeed, speed, results$ = [];
    ref$ = state.toJSON(), graph = ref$.graph, ref1$ = ref$.graph, w = ref1$.w, h = ref1$.h;
    roots = sortBy(function(it){
      return it.y;
    }, filter(isRoot, graph.nodes));
    meanD = mean(map(compose$([
      (function(it){
        return it * 2;
      }), getR
    ]), roots));
    half = (function(it){
      return it / 2;
    });
    if (roots.length === 1) {
      ref$ = roots[0];
      ref$.x = half(w);
      ref$.y = half(h);
      ref$.fixed = true;
    } else {
      roots.forEach(function(n, i){
        var goal;
        goal = {
          x: half(w),
          y: half(h) - meanD * roots.length / 2 + meanD * i
        };
        mvTowards(0.05, goal, n);
      });
    }
    centre = {
      x: half(w),
      y: half(h)
    };
    maxH = maximum(map(function(it){
      return it.stepsFromLeaf;
    }, graph.nodes));
    for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
      leaf = ref$[i$];
      if (!isRoot(leaf)) {
        baseSpeed = -0.0003;
        speed = (fn$());
        results$.push(mvTowards(speed, centre, leaf));
      }
    }
    return results$;
    function fn$(){
      switch (false) {
      case !leaf.isLeaf:
        return baseSpeed;
      case !maxH:
        return baseSpeed * (1 - leaf.stepsFromLeaf * 1 / maxH);
      default:
        return 0;
      }
    }
  };
  unfix = function(state){
    each((function(it){
      return it.fixed = false, it;
    }))(
    filter(isRoot)(
    function(it){
      return it.nodes;
    }(
    state.get('graph'))));
  };
  linkSpline = curry$(function(offsetScale, args){
    var source, target, lineLength, endPoint, radiusS, cos90, sin90, meanX, meanY, offset, mp1X, mp1Y, mp2X, mp2Y;
    source = args[0], target = args[1], lineLength = args[2], endPoint = args[3], radiusS = args[4], cos90 = args[5], sin90 = args[6];
    meanX = mean(map(function(it){
      return it.x;
    }, [source, target]));
    meanY = mean(map(function(it){
      return it.y;
    }, [source, target]));
    offset = offsetScale * lineLength - radiusS / 4;
    mp1X = meanX + offset * cos90;
    mp1Y = meanY + offset * sin90;
    mp2X = meanX + offset * cos90;
    mp2Y = meanY + offset * sin90;
    return [[source.x - radiusS * 0.9 * cos90, source.y - radiusS * 0.9 * sin90], [mp2X, mp2Y], endPoint, endPoint, [mp1X, mp1Y], [source.x + radiusS * 0.9 * cos90, source.y + radiusS * 0.9 * sin90]];
  });
  drawCurve = (function(line){
    return function(arg$){
      var target, source, cos, sin, sqrt, atan2, pow, PI, slope, ref$, sinS, cosS, slopePlus90, sin90, cos90, radiusT, radiusS, lineLength, endPoint, args;
      target = arg$.target, source = arg$.source;
      cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, pow = Math.pow, PI = Math.PI;
      slope = atan2(target.y - source.y, target.x - source.x);
      ref$ = map(function(it){
        return it(slope);
      }, [sin, cos]), sinS = ref$[0], cosS = ref$[1];
      slopePlus90 = PI / 2 + slope;
      ref$ = map(function(it){
        return it(slopePlus90);
      }, [sin, cos]), sin90 = ref$[0], cos90 = ref$[1];
      ref$ = map(getR, [target, source]), radiusT = ref$[0], radiusS = ref$[1];
      lineLength = sqrt(pow(target.x - source.x, 2) + pow(target.y - source.y, 2));
      endPoint = [target.x - radiusT * 0.9 * cosS, target.y - radiusT * 0.9 * sinS];
      args = [source, target, lineLength, endPoint, radiusS, cos90, sin90];
      return (function(it){
        return it + 'Z';
      })(
      line(
      linkSpline(0.1)(
      args)));
    };
  }.call(this, d3.svg.line().interpolate('basis')));
  drawPauseBtn = curry$(function(dimensions, state, svg){
    var ref$, cx, cy, radius, x, y, btn, drawPauseBars, symbolLine, drawPlaySymbol;
    ref$ = map((function(it){
      return it * 0.9;
    }), [dimensions.w, dimensions.h]), cx = ref$[0], cy = ref$[1];
    radius = 0.075 * dimensions.h;
    ref$ = map((function(it){
      return it - radius;
    }), [cx, cy]), x = ref$[0], y = ref$[1];
    svg.selectAll('g.btn').remove();
    btn = svg.append('g').attr('class', 'btn').attr('x', x).attr('y', y);
    btn.append('circle').attr('r', radius).attr('cx', cx).attr('cy', cy).attr('stroke', 'black').attr('stroke-width', 5).attr('fill', '#ccc').attr('opacity', 0.2);
    drawPauseBars = function(){
      var pauseBar, i$, ref$, len$, f, results$ = [];
      btn.selectAll('path.play-symbol').remove();
      pauseBar = {
        width: 0.025 * dimensions.h,
        height: 0.08 * dimensions.h
      };
      for (i$ = 0, len$ = (ref$ = [-1.2, 0.2]).length; i$ < len$; ++i$) {
        f = ref$[i$];
        results$.push(btn.append('rect').attr('class', 'pause-bar').attr('width', pauseBar.width).attr('x', cx + f * pauseBar.width).attr('height', pauseBar.height).attr('y', cy - pauseBar.height / 2).attr('fill', '#555').attr('opacity', 0.2));
      }
      return results$;
    };
    symbolLine = d3.svg.line().x(function(arg$){
      var r, a;
      r = arg$[0], a = arg$[1];
      return cx + r * cos(a);
    }).y(function(arg$){
      var r, a;
      r = arg$[0], a = arg$[1];
      return cy + r * sin(a);
    }).interpolate('linear');
    drawPlaySymbol = function(){
      var innerR, points, res$, i$, ref$, len$, angle;
      btn.selectAll('.pause-bar').remove();
      innerR = 0.75 * radius;
      res$ = [];
      for (i$ = 0, len$ = (ref$ = [0, 120, 240]).length; i$ < len$; ++i$) {
        angle = ref$[i$];
        res$.push([innerR, toRadians(angle)]);
      }
      points = res$;
      return btn.append('path').attr('class', 'play-symbol').attr('fill', '#555').attr('opacity', 0.2).attr('d', (function(it){
        return it + 'Z';
      })(symbolLine(points)));
    };
    drawPlaySymbol();
    state.on('change:animating', function(s, currently){
      switch (currently) {
      case 'paused':
        return drawPlaySymbol();
      case 'running':
        return drawPauseBars();
      }
    });
    return btn.on('click', function(){
      switch (state.get('animating')) {
      case 'paused':
        return state.set({
          animating: 'running'
        });
      case 'running':
        return state.set({
          animating: 'paused'
        });
      }
    });
  });
  linkDistance = function(arg$){
    var source, target, ns, edges, markedBump, mutedPenalty, radii;
    source = arg$.source, target = arg$.target;
    ns = [source, target];
    edges = sum(map(function(it){
      var ref$;
      return ((ref$ = it.edges) != null ? ref$.length : void 8) || 0;
    }, ns));
    markedBump = 50 * countBy(function(it){
      return it.marked;
    }, ns);
    mutedPenalty = any(function(it){
      return it.muted;
    }, ns) ? 100 : 0;
    radii = sum(map(getR, ns));
    return 3 * edges + radii + 50 + markedBump - mutedPenalty;
  };
  getCharge = function(d){
    var radius, rootBump, edgeBump, markedBump, k;
    radius = getR(d);
    rootBump = isRoot(d) ? 150 : 0;
    edgeBump = 10 * d.edges.length;
    markedBump = d.marked ? 2 : 1;
    k = 250;
    return 1 - (k + radius + rootBump + edgeBump) * markedBump;
  };
  renderForce = function(state, graph){
    var dimensions, force, svg, throbber, getLabelFontSize, zoom, relationships, svgGroup, link, getLabelId, node, nG, texts, tickCount, _isReady;
    if (graph.edges.length > 250 && !state.has('elision')) {
      return state.set({
        elision: 2
      });
    }
    dimensions = state.get('dimensions');
    force = d3.layout.force().size([dimensions.w, dimensions.h]).charge(getCharge).gravity(0.04).linkStrength(0.8).linkDistance(linkDistance);
    state.on('change:spline', function(){
      return state.set({
        animating: 'running'
      });
    });
    state.on('change:jiggle', function(){
      return state.set({
        animating: 'running'
      });
    });
    state.on('graph:reset', updateMarked);
    state.on('change:animating', function(){
      var currently;
      currently = state.get('animating');
      switch (currently) {
      case 'running':
        force.resume();
        break;
      case 'paused':
        force.stop();
      }
    });
    svg = d3.select(state.get('svg'));
    svg.selectAll('g').remove();
    throbber = svg.append('use').attr('x', dimensions.w / 2 - 150).attr('y', dimensions.h / 2 - 150).attr('xlink:href', '#throbber');
    state.on('change:translate', function(s, currentTranslation){
      svgGroup.attr('transform', "translate(" + currentTranslation + ") scale(" + s.get('zoom') + ")");
      return force.tick();
    });
    state.on('change:zoom', function(s, currentZoom){
      svgGroup.attr('transform', "translate(" + s.get('translate') + ") scale(" + currentZoom + ")");
      return force.tick();
    });
    getLabelFontSize = function(){
      return Math.min(40, 20 / state.get('zoom'));
    };
    zoom = d3.behavior.zoom().scale(state.get('zoom')).on('zoom', function(){
      return state.set({
        zoom: d3.event.scale,
        translate: d3.event.translate.slice()
      });
    });
    svg.call(zoom);
    relationships = state.get('relationships');
    svg.attr('width', dimensions.w).attr('height', dimensions.h).call(drawPauseBtn(dimensions, state)).call(drawRootLabels(graph, dimensions));
    svgGroup = svg.append('g').attr('class', 'ontology').attr('transform', 'translate(5, 5)');
    force.nodes(graph.nodes).links(graph.edges).on('tick', tick).on('end', function(){
      state.set('animating', 'paused');
      return tick();
    });
    link = svgGroup.selectAll('.force-link').data(graph.edges);
    link.enter().append(state.has('spline') ? 'path' : 'line').attr('class', 'force-link').attr('stroke-width', '1px').attr('stroke', linkStroke).attr('fill', linkFill).append('title', function(e){
      return e.source.label + " " + e.label + " " + e.target.label;
    });
    link.exit().remove();
    getLabelId = compose$([
      (function(it){
        return 'label-' + it;
      }), function(it){
        return it.replace(/:/g, '-');
      }, function(it){
        return it.id;
      }
    ]);
    node = svgGroup.selectAll('.force-node').data(graph.nodes);
    nG = node.enter().append('g').attr('class', 'force-node').call(force.drag).on('click', drawPathToRoot);
    node.exit().remove();
    nG.append('circle').attr('class', function(arg$){
      var sources;
      sources = arg$.sources;
      return join(' ', ['force-term'].concat(sources));
    }).classed('root', isRoot).classed('direct', function(it){
      return it.isDirect;
    }).attr('fill', termColor).attr('cx', -dimensions.w).attr('cy', -dimensions.h).attr('r', getR);
    nG.append('text').attr('class', 'count-label').attr('fill', 'white').attr('text-anchor', 'middle').attr('display', 'none').attr('x', -dimensions.w).attr('y', -dimensions.h).attr('dy', '0.3em');
    texts = svgGroup.selectAll('text.force-label').data(graph.nodes);
    texts.enter().append('text').attr('class', 'force-label').attr('text-anchor', 'start').attr('fill', '#555').attr('stroke', 'white').attr('stroke-width', '0.1px').attr('text-rendering', 'optimizeLegibility').attr('display', function(it){
      if (it.isDirect) {
        return 'block';
      } else {
        return 'none';
      }
    }).attr('id', getLabelId).attr('x', -dimensions.w).attr('y', -dimensions.h).text(function(it){
      return it.label;
    }).on('click', drawPathToRoot);
    nG.append('title').text(function(it){
      return it.label;
    });
    svg.call(drawRelationshipLegend(state, relationshipPalette)).call(drawSourceLegend(state, termPalette));
    tickCount = 0;
    state.set('animating', 'running');
    force.start();
    state.on('relationship:highlight', function(rel){
      var test, colFilt;
      test = relationshipTest(rel, false);
      colFilt = colourFilter(test);
      link.transition().duration(50).attr('fill', function(d){
        return colFilt(d)(
        linkFill(d));
      }).attr('opacity', function(it){
        if (!rel || test(it)) {
          return linkOpacity.normal;
        } else {
          return linkOpacity.unfocus;
        }
      });
      return link.classed('highlit', test);
    });
    state.on('term:highlight', function(term){
      force.stop();
      nG.selectAll('circle.force-term').filter(function(it){
        return it.marked;
      }).transition().duration(50).attr('opacity', function(it){
        if (!term || it === term) {
          return 1;
        } else {
          return 0.5;
        }
      });
      return link.filter(compose$([
        function(it){
          return it.marked;
        }, function(it){
          return it.source;
        }
      ])).transition().duration(50).attr('opacity', function(it){
        if (!term || it.source === term) {
          return linkOpacity.focus;
        } else {
          return linkOpacity.unfocus;
        }
      });
    });
    state.once('force:ready', function(){
      return centreAndZoom(function(it){
        return it.x;
      }, function(it){
        return it.y;
      }, state, graph.nodes, zoom);
    });
    _isReady = false;
    function isReady(){
      var ref$, animating, tickK, edges;
      if (_isReady) {
        return true;
      }
      ref$ = state.toJSON(), animating = ref$.animating, tickK = ref$.tickK, edges = ref$.graph.edges;
      _isReady = animating === 'paused' || tickCount > tickK * ln(edges.length);
      if (_isReady) {
        state.trigger('force:ready');
      }
      return _isReady;
    }
    function drawPathToRoot(d, i){
      var queue, moar, count, max, n;
      state.set('animating', 'running');
      if (isRoot(d)) {
        toggleSubtree(d);
      } else {
        queue = [d];
        moar = function(it){
          return unique(
          reject(function(it){
            return it.marked;
          })(
          map(function(it){
            return it.target;
          })(
          it.edges)));
        };
        count = 0;
        max = state.get('maxmarked');
        while (count++ < max && (n = queue.shift())) {
          n.marked = true;
          each(bind$(queue, 'push'), moar(n));
        }
      }
      return updateMarked();
    }
    function toggleSubtree(root){
      return markSubtree(root, 'muted', !root.muted);
    }
    function updateMarked(){
      var currentAnimation;
      state.trigger('nodes:marked');
      currentAnimation = state.get('animating');
      state.set('animating', 'running');
      force.start();
      return setTimeout(function(){
        return state.set('animating', currentAnimation);
      }, 150);
    }
    function tick(){
      var jiggle, currentFontSize, fontPlusPad, meanX, getHalf, texts, displayedTexts, circles;
      tickCount++;
      jiggle = (function(){
        switch (state.get('jiggle')) {
        case 'strata':
          return stratify;
        case 'centre':
          return centrify;
        default:
          return unfix;
        }
      }());
      if (jiggle) {
        jiggle(state);
      }
      if (!isReady()) {
        return;
      }
      if (throbber != null) {
        throbber.remove();
      }
      currentFontSize = getLabelFontSize();
      fontPlusPad = currentFontSize * 1.1;
      meanX = mean(map(function(it){
        return it.x;
      }, graph.nodes));
      getHalf = d3.scale.quantile().domain([0, dimensions.w]).range(['left', 'right']);
      texts = svgGroup.selectAll('text.force-label');
      displayedTexts = texts.filter(function(){
        return 'block' === d3.select(this).attr('display');
      });
      displayedTexts.each(function(d1, i){
        var ys, thisHalf, op;
        ys = [];
        thisHalf = getHalf(d1.x);
        displayedTexts.each(function(d2){
          if (d2 !== d2 && getHalf(d2.x === thisHalf) && abs(d1.y - d2.y) < fontPlusPad) {
            return ys.push(d2.y);
          }
        });
        if (ys.length) {
          op = d1.y > mean(ys)
            ? curry$(function(x$, y$){
              return x$ + y$;
            })
            : curry$(function(x$, y$){
              return x$ - y$;
            });
          return d1.y = op(d1.y, fontPlusPad);
        }
      });
      texts.attr('x', function(it){
        return it.x;
      }).attr('text-anchor', function(it){
        if (it.x < meanX) {
          return 'end';
        } else {
          return 'start';
        }
      }).attr('y', function(it){
        return it.y;
      }).attr('dx', function(it){
        if (it.x < meanX) {
          return 1 - getR(it);
        } else {
          return getR(it);
        }
      });
      if (state.has('spline')) {
        link.attr('d', drawCurve);
      } else {
        link.attr('x1', function(it){
          return it.source.x;
        }).attr('y1', function(it){
          return it.source.y;
        }).attr('x2', function(it){
          return it.target.x;
        }).attr('y2', function(it){
          return it.target.y;
        });
      }
      svgGroup.selectAll('text').attr('display', function(arg$){
        var marked, id, edges, isDirect;
        marked = arg$.marked, id = arg$.id, edges = arg$.edges, isDirect = arg$.isDirect;
        switch (false) {
        case !(graph.nodes.length < state.get('smallGraphThreshold')):
          return 'block';
        case !(state.get('zoom') > 1.2):
          return 'block';
        case !(marked || isDirect):
          return 'block';
        default:
          return 'none';
        }
      });
      node.selectAll('text.count-label').text(compose$([
        sum, function(it){
          return it.counts;
        }
      ])).attr('x', function(it){
        return it.x;
      }).attr('y', function(it){
        return it.y;
      }).attr('font-size', compose$([
        (function(it){
          return it / 1.5;
        }), getR
      ])).attr('display', function(arg$){
        var marked, isRoot, isDirect;
        marked = arg$.marked, isRoot = arg$.isRoot, isDirect = arg$.isDirect;
        switch (false) {
        case !(marked || isDirect || isRoot):
          return 'block';
        default:
          return 'none';
        }
      });
      svgGroup.selectAll('text.force-label').attr('font-size', currentFontSize);
      link.attr('stroke-width', function(arg$){
        var target;
        target = arg$.target;
        switch (false) {
        case !target.marked:
          return '2px';
        default:
          return '1px';
        }
      });
      circles = node.selectAll('circle').attr('r', getR).attr('cx', function(it){
        return it.x;
      }).attr('cy', function(it){
        return it.y;
      });
      if (any(function(it){
        return it.marked;
      }, graph.nodes)) {
        circles.attr('opacity', function(it){
          if (it.marked || it.isRoot) {
            return 1;
          } else {
            return 0.2;
          }
        });
        link.attr('opacity', function(arg$){
          var source, target;
          source = arg$.source, target = arg$.target;
          switch (false) {
          case !(source.marked && (target.marked || target.isRoot)):
            return linkOpacity.focus;
          default:
            return linkOpacity.unfocus;
          }
        });
        return svgGroup.selectAll('text').attr('opacity', function(it){
          if (it.marked) {
            return 1;
          } else {
            return 0.2;
          }
        });
      } else {
        link.attr('opacity', function(arg$){
          var muted;
          muted = arg$.source.muted;
          if (muted) {
            return linkOpacity.muted;
          } else {
            return linkOpacity.normal;
          }
        });
        circles.attr('opacity', function(arg$){
          var muted, isDirect;
          muted = arg$.muted, isDirect = arg$.isDirect;
          switch (false) {
          case !muted:
            return 0.3;
          case !isDirect:
            return 1;
          default:
            return 0.9;
          }
        });
        return svgGroup.selectAll('text').attr('opacity', function(it){
          if (it.muted) {
            return 0.3;
          } else {
            return 1;
          }
        });
      }
    }
    return tick;
  };
  module.exports = {
    renderForce: renderForce
  };
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);

},{"./svg":16,"./util":4,"prelude-ls":5}],16:[function(require,module,exports){
(function(){
  var ref$, unique, filter, id, flip, join, maximum, minimum, map, brighten, darken, termPalette, termColor, relationshipPalette, linkFill, linkStroke, BRIGHTEN, colourFilter, mvTowards, isRoot, getMinMaxSize, drawRootLabels, centreAndZoom, drawRelationshipLegend, drawSourceLegend;
  ref$ = require('prelude-ls'), unique = ref$.unique, filter = ref$.filter, id = ref$.id, flip = ref$.flip, join = ref$.join, maximum = ref$.maximum, minimum = ref$.minimum, map = ref$.map;
  brighten = compose$([
    function(it){
      return it.brighter();
    }, bind$(d3, 'rgb')
  ]);
  darken = compose$([
    function(it){
      return it.darker();
    }, bind$(d3, 'rgb')
  ]);
  termPalette = compose$([darken, d3.scale.category20()]);
  termColor = compose$([
    termPalette, join('-'), function(it){
      return it.sources;
    }
  ]);
  relationshipPalette = d3.scale.category10();
  linkFill = compose$([
    relationshipPalette, function(it){
      return it.label;
    }
  ]);
  linkStroke = compose$([darken, linkFill]);
  BRIGHTEN = compose$([brighten, brighten]);
  colourFilter = curry$(function(test, x){
    if (test(x)) {
      return brighten;
    } else {
      return id;
    }
  });
  mvTowards = function(howMuch, goal, n){
    var scale, dx, dy;
    scale = (function(it){
      return it * howMuch;
    });
    dx = scale(goal.x - n.x);
    dy = scale(goal.y - n.y);
    n.x += dx;
    n.y += dy;
  };
  isRoot = function(it){
    return it.isRoot;
  };
  getMinMaxSize = function(f, coll){
    return function(it){
      return function(it){
        return it.size = it.max - it.min, it;
      }(
      {
        min: minimum(it),
        max: maximum(it)
      });
    }(
    map(f, coll));
  };
  drawRootLabels = curry$(function(graph, dimensions, svg){
    return (function(roots){
      var parts, rootG, rootLabel, i$, len$, i, word, ref$, textWidth, textHeight, tx, ty;
      if (roots.length === 1) {
        parts = roots[0].label.split('_');
        rootG = svg.append('g').attr('class', 'root-label');
        rootLabel = rootG.append('text').attr('x', 0).attr('y', 0).attr('font-size', 0.2 * dimensions.h).attr('opacity', 0.05);
        for (i$ = 0, len$ = parts.length; i$ < len$; ++i$) {
          i = i$;
          word = parts[i$];
          rootLabel.append('tspan').text(word).attr('x', 0).attr('dx', '0.3em').attr('dy', i ? '1em' : 0);
        }
        ref$ = rootLabel.node().getBBox(), textWidth = ref$.width, textHeight = ref$.height;
        tx = dimensions.w - 1.1 * textWidth;
        ty = 60 + textHeight / 2;
        return rootG.attr('transform', "translate(" + tx + "," + ty + ")");
      }
    }.call(this, filter(isRoot, graph.nodes)));
  });
  centreAndZoom = function(xf, yf, state, nodes, zoom){
    var padding, dimensions, h, w, f, ref$, x, y, displayRatio, graphRatio, dim, val, scale, x$, translate;
    padding = 50;
    dimensions = state.get('dimensions'), h = dimensions.h, w = dimensions.w;
    ref$ = (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = [xf, yf]).length; i$ < len$; ++i$) {
        f = ref$[i$];
        results$.push(getMinMaxSize(f, nodes));
      }
      return results$;
    }()), x = ref$[0], y = ref$[1];
    displayRatio = w / h;
    graphRatio = x.size / y.size;
    ref$ = (function(){
      switch (false) {
      case !(displayRatio < graphRatio):
        return [w, x.size];
      default:
        return [h, y.size];
      }
    }()), dim = ref$[0], val = ref$[1];
    scale = dim * 0.9 / (val + padding * 2);
    x$ = translate = map(compose$([
      (function(it){
        return it + padding;
      }), (function(it){
        return 0 - it;
      }), function(it){
        return it.min;
      }
    ]), [x, y]);
    x$[0] += w / 2 - scale * x.size / 2;
    x$[1] += h / 2 - scale * y.size / 2 - padding * scale;
    console.log("x.min = " + x.min + ", y.min = " + y.min);
    console.log('translate', translate);
    console.log('scale', scale);
    zoom.scale(scale);
    zoom.translate(translate);
    return state.set({
      zoom: scale,
      translate: translate
    });
  };
  drawRelationshipLegend = curry$(function(state, palette, svg){
    var ref$, all, dimensions, relationships, height, padding, width, getX, getY, legend, lg;
    ref$ = state.toJSON(), all = ref$.all, dimensions = ref$.dimensions;
    relationships = all.getRelationships();
    height = 50;
    padding = 25;
    width = dimensions.h > dimensions.w ? (dimensions.w - padding * 2) / relationships.length : 180;
    ref$ = [
      flip(function(it){
        return padding + width * it;
      }), function(){
        return padding;
      }
    ], getX = ref$[0], getY = ref$[1];
    legend = svg.selectAll('g.legend').data(relationships);
    lg = legend.enter().append('g').attr('class', 'legend').attr('width', width).attr('height', height).attr('x', getX).attr('y', getY).on('mouseover', function(d, i){
      state.trigger('relationship:highlight', d);
      return d3.select(this).selectAll('rect').attr('fill', compose$([brighten, palette]));
    }).on('mouseout', function(){
      state.trigger('relationship:highlight', null);
      return d3.select(this).selectAll('rect').attr('fill', palette);
    }).on('click', function(rel){
      var i$, ref$, len$, e, j$, ref1$, len1$, n;
      for (i$ = 0, len$ = (ref$ = state.get('all').edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
        if (e.label === rel) {
          for (j$ = 0, len1$ = (ref1$ = [e.source, e.target]).length; j$ < len1$; ++j$) {
            n = ref1$[j$];
            n.marked = true;
          }
        }
      }
      return state.trigger('nodes:marked');
    });
    legend.exit().remove();
    lg.append('rect').attr('opacity', 0.6).attr('width', width).attr('height', height).attr('x', getX).attr('y', getY).attr('fill', palette);
    return lg.append('text').attr('x', getX).attr('y', getY).attr('dy', height / 2).attr('dx', '0.5em').text(id);
  });
  drawSourceLegend = curry$(function(state, palette, svg){
    var dimensions, nodes, height, padding, width, sources, ref$, getX, getY, sourceG, sg;
    dimensions = state.get('dimensions');
    nodes = state.get('graph').nodes;
    height = 50;
    padding = 25;
    width = dimensions.h > dimensions.w ? (dimensions.w - padding * 2) / relationships.length : 180;
    sources = unique(map(compose$([
      join('-'), function(it){
        return it.sources;
      }
    ]), nodes));
    ref$ = [
      flip(function(it){
        return padding + width * it;
      }), function(){
        return padding + height;
      }
    ], getX = ref$[0], getY = ref$[1];
    sourceG = svg.selectAll('g.source-legend').data(sources);
    sg = sourceG.enter().append('g').attr('class', 'source-legend').attr('width', width).attr('height', height).attr('x', getX).attr('y', getY).on('mouseover', function(d, i){
      state.trigger('source:highlight', d);
      return d3.select(this).selectAll('rect').attr('fill', compose$([brighten, palette]));
    }).on('mouseout', function(){
      state.trigger('source:highlight', null);
      return d3.select(this).selectAll('rect').attr('fill', palette);
    });
    sourceG.exit().remove();
    sg.append('rect').attr('opacity', 0.6).attr('width', width).attr('height', height).attr('x', getX).attr('y', getY).attr('fill', palette);
    return sg.append('text').attr('x', getX).attr('y', getY).attr('dy', height / 2).attr('dx', '0.5em').text(id);
  });
  module.exports = {
    centreAndZoom: centreAndZoom,
    drawRelationshipLegend: drawRelationshipLegend,
    drawSourceLegend: drawSourceLegend,
    drawRootLabels: drawRootLabels,
    colourFilter: colourFilter,
    mvTowards: mvTowards,
    brighten: brighten,
    BRIGHTEN: BRIGHTEN,
    darken: darken,
    linkFill: linkFill,
    linkStroke: linkStroke,
    relationshipPalette: relationshipPalette,
    termPalette: termPalette,
    termColor: termColor,
    getMinMaxSize: getMinMaxSize
  };
  function compose$(fs){
    return function(){
      var i, args = arguments;
      for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
      return args[0];
    };
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);

},{"prelude-ls":5}]},{},[])
;