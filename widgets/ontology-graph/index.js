if (typeof window == 'undefined' || window === null) {
  require('prelude-ls').installPrelude(global);
} else {
  prelude.installPrelude(window);
}
/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */
(function(){
  var Service, ref$, rows, query, interop, interopLaterMaybeWhenTheyUpgrade, nonCuratedEvidenceCodes, nodePadding, minTicks, linkOpacity, objectify, error, notify, failWhenEmpty, doTo, anyTest, interopMines, directTerms, getHomologyWhereClause, directHomologyTerms, allGoTerms, flatten, flatRows, allHomologyTerms, wholeGraphQ, countQuery, homologueQuery, Node, newNode, fetchNames, doLine, calculateSpline, translateEdge, getNodeDragPos, toNodeId, addLabels, markReachable, unmark, onlyMarked, findRoots, growTree, allChildren, relationshipPalette, linkFill, linkStroke, brighten, darken, termPalette, termColor, BRIGHTEN, isRoot, isLeaf, getR, linkDistance, getCharge, markDepth, annotateForHeight, trimGraphToHeight, setInto, cacheFunc, mergeGraphs, edgeToNodes, annotateForCounts, GraphState, monitorProgress, progressMonitor, draw, drawPauseBtn, drawSourceLegend, drawRelationshipLegend, linkSpline, drawCurve, stratify, centrify, unfix, relationshipTest, colourFilter, drawRootLabels, renderForce, makeGraph, doUpdate, getMinMaxSize, centreAndZoom, renderDag, rowToNode, queryParams, currentSymbol, graphify, main, debugColors, sortOnX, sortOnY, slice$ = [].slice;
  Service = intermine.Service;
  ref$ = new Service({
    root: 'www.flymine.org/query'
  }), rows = ref$.rows, query = ref$.query;
  interop = [
    {
      taxonId: 4932,
      root: 'yeastmine-test.yeastgenome.org/yeastmine-dev',
      name: 'SGD'
    }, {
      taxonId: 10090,
      root: 'http://beta.mousemine.org/mousemine',
      name: 'MGI'
    }, {
      taxonId: 6239,
      root: 'http://intermine.modencode.org/release-32',
      name: 'modMine'
    }
  ];
  interopLaterMaybeWhenTheyUpgrade = [
    {
      taxonId: 7955,
      root: 'zmine.zfin.org/zebrafishmine',
      name: 'ZFin'
    }, {
      taxonId: 10116,
      root: 'http://ratmine.mcw.edu/ratmine',
      name: 'RGD'
    }
  ];
  nonCuratedEvidenceCodes = ['IBA', 'IBD', 'IEA', 'IGC', 'IKR', 'ISA', 'ISO', 'ISS', 'RCA'];
  nodePadding = 10;
  minTicks = 20;
  linkOpacity = {
    normal: 0.6,
    muted: 0.3,
    focus: 0.8,
    unfocus: 0.2
  };
  objectify = curry$(function(key, value, list){
    return compose$([
      listToObj, map(function(it){
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
  interopMines = objectify(function(it){
    return it.taxonId;
  }, function(arg$){
    var root, name;
    root = arg$.root, name = arg$.name;
    return (function(it){
      return it.name = name, it;
    })(new Service({
      root: root
    }));
  }, interop);
  directTerms = function(it){
    return {
      select: ['goAnnotation.ontologyTerm.identifier'],
      from: 'Gene',
      where: {
        symbol: [it]
      }
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
  allGoTerms = function(symbol){
    return {
      name: 'ALL-TERMS',
      select: ['goAnnotation.ontologyTerm.identifier', 'goAnnotation.ontologyTerm.parents.identifier'],
      from: 'Gene',
      where: {
        symbol: symbol
      }
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
        : 1.5 * ln(sum(this.counts));
      markedFac = this.marked ? 2 : 1;
      return (k + countPortion) * markedFac;
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
  doLine = d3.svg.line().x(function(it){
    return it.x;
  }).y(function(it){
    return it.y;
  }).interpolate('basis');
  calculateSpline = curry$(function(dir, arg$){
    var source, target, points, p0, pN, ps;
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
          y: target.y + 10 + target.height / 2
        };
      }
    }());
    pN = (function(){
      switch (false) {
      case dir !== 'LR':
        return {
          x: target.x - 15 - target.width / 2,
          y: target.y
        };
      default:
        return {
          x: source.x,
          y: source.y - source.height / 2
        };
      }
    }());
    ps = [p0].concat(points, [pN]);
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
  getNodeDragPos = function(posProp){
    return function(){
      return d3.event[posProp];
    };
  };
  toNodeId = compose$([
    (function(it){
      return 'node' + it;
    }), function(it){
      return it.replace(/:/g, '_');
    }, function(it){
      return it.id;
    }
  ]);
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
  function mvTowards(howMuch, goal, n){
    var scale, dx, dy;
    scale = (function(it){
      return it * howMuch;
    });
    dx = scale(goal.x - n.x);
    dy = scale(goal.y - n.y);
    n.x += dx;
    n.y += dy;
  }
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
  unmark = function(nodes){
    var i$, len$, n, results$ = [];
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      n = nodes[i$];
      n.marked = false;
      n.isReachable = false;
      n.isFocus = false;
      n.isSource = false;
      results$.push(n.isTarget = false);
    }
    return results$;
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
  findRoots = function(arg$){
    var nodes, i$, len$, n, results$ = [];
    nodes = arg$.nodes;
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      n = nodes[i$];
      if (all(compose$([(fn$), fn1$]), n.edges)) {
        results$.push(n);
      }
    }
    return results$;
    function fn$(it){
      return it === n;
    }
    function fn1$(it){
      return it.source;
    }
  };
  growTree = function(arg$){
    var id, label, edges, tn, i$, ref$, len$, e, x$, branch;
    id = arg$.id, label = arg$.label, edges = arg$.edges;
    tn = {
      id: id,
      label: label,
      children: []
    };
    tn.nodeType = 'root';
    for (i$ = 0, len$ = (ref$ = reject(compose$([(fn$), fn1$, fn2$]), edges)).length; i$ < len$; ++i$) {
      e = ref$[i$];
      x$ = branch = growTree(e.target);
      x$.nodeType = 'branch';
      x$.parent = tn;
      x$.relationship = e.label;
      tn.children.push(branch);
    }
    return tn;
    function fn$(it){
      return it === id;
    }
    function fn1$(it){
      return it.id;
    }
    function fn2$(it){
      return it.target;
    }
  };
  allChildren = function(tree){
    var children, queue, c, key$, i$, ref$, len$, gc;
    children = {};
    queue = [tree];
    while (c = queue.shift()) {
      children[key$ = c.id] == null && (children[key$] = c);
      for (i$ = 0, len$ = (ref$ = c.children).length; i$ < len$; ++i$) {
        gc = ref$[i$];
        queue.push(gc);
      }
    }
    return values(children);
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
  relationshipPalette = d3.scale.category10();
  linkFill = compose$([
    relationshipPalette, function(it){
      return it.label;
    }
  ]);
  linkStroke = compose$([
    function(it){
      return it.darker();
    }, bind$(d3, 'rgb'), linkFill
  ]);
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
  termPalette = compose$([darken, bind$(d3, 'rgb'), d3.scale.category20()]);
  termColor = compose$([
    termPalette, join('-'), function(it){
      return it.sources;
    }
  ]);
  BRIGHTEN = compose$([brighten, brighten]);
  isRoot = function(it){
    return it.isRoot;
  };
  isLeaf = function(it){
    return it.isLeaf;
  };
  getR = function(it){
    return it.radius();
  };
  linkDistance = function(arg$){
    var source, target, ns, edges, markedBump, mutedPenalty, radii;
    source = arg$.source, target = arg$.target;
    ns = [source, target];
    edges = sum(map(function(it){
      var ref$;
      return ((ref$ = it.edges) != null ? ref$.length : void 8) || 0;
    }, ns));
    markedBump = 50 * length(filter(function(it){
      return it.marked;
    }, ns));
    mutedPenalty = any(function(it){
      return it.muted;
    }, ns) ? 100 : 0;
    radii = sum(map(getR, ns));
    return 3 * edges + radii + 50 + markedBump - mutedPenalty;
  };
  getCharge = function(d){
    var radius, rootBump, edgeBump, markedBump, jiggleBump, k;
    radius = getR(d);
    rootBump = isRoot(d) ? 150 : 0;
    edgeBump = 10 * d.edges.length;
    markedBump = d.marked ? 2 : 1;
    jiggleBump = queryParams.jiggle === 'strata' ? 20 : 0;
    k = 250;
    return 1 - (k + radius + rootBump + edgeBump) * markedBump;
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
  trimGraphToHeight = function(arg$, level){
    var nodes, edges, atOrBelowHeight, acceptable, filtered, i$, ref$, len$, n, elision;
    nodes = arg$.nodes, edges = arg$.edges;
    if (!level) {
      return {
        nodes: nodes,
        edges: edges
      };
    }
    console.log("Trimming graph to " + level);
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
    console.log("Down to " + length(filtered.edges) + ", " + function(it){
      return it.toFixed(2);
    }(filtered.edges.length / edges.length * 100) + "% of the original number of edges");
    return filtered;
    function fn$(it){
      return it.target;
    }
  };
  setInto = function(m, k, v){
    return import$(m, listToObj([[k, v]]));
  };
  cacheFunc = function(arg$){
    var mapping, keyFunc, ref$;
    mapping = arg$[0], keyFunc = (ref$ = arg$[1]) != null ? ref$ : id;
    return compose$([objToFunc(mapping), keyFunc]);
  };
  mergeGraphs = curry$(function(left, right){
    var eKey, addNodeToMapping, addEdgeToMapping, f, attr, ref$, nodesById, edgesByKey, realNodes, realEdges, i$, len$, ref1$, n, real, e, source, target, ret;
    console.log("Starting with " + length(left.nodes) + " nodes and " + length(left.edges) + " edges");
    console.log("Currently there are " + length(filter(function(it){
      return it.isDirect;
    }, left.nodes)) + " direct nodes");
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
    ret = {
      nodes: values(nodesById),
      edges: values(edgesByKey)
    };
    annotateForHeight(ret.nodes);
    console.log("Merged graph has " + length(ret.nodes) + " nodes and " + length(ret.edges) + " edges");
    console.log("now there are " + length(filter(function(it){
      return it.isDirect;
    }, ret.nodes)) + " direct nodes");
    for (i$ = 0, len$ = (ref$ = ret.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (n.isDirect && n.sources.length === 1) {
        console.log(n.id + ":" + n.label + " (" + n.root.label + ") is from " + n.sources);
      }
    }
    console.log("There are " + length(filter(compose$([
      (function(it){
        return it > 1;
      }), function(it){
        return it.length;
      }, function(it){
        return it.sources;
      }
    ]), ret.nodes)) + " merged nodes");
    return ret;
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
  GraphState = (function(superclass){
    var prototype = extend$((import$(GraphState, superclass).displayName = 'GraphState', GraphState), superclass).prototype, constructor = GraphState;
    prototype.initialize = function(){
      this.on('annotated:height change:elision change:root change:all', bind$(this, 'updateGraph'));
      return this.updateGraph();
    };
    prototype.updateGraph = function(){
      var level, currentRoot, ref$, allNodes, allEdges, nodes, edges, graph;
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
  draw = function(graph){
    var symbol, state, newGraph, switches, selector, stateArgs, x$, rootSelector, y$, elisionSelector, render, roots, i$, ref$, len$, r, monitorHomologueProgress;
    symbol = head(unique(concatMap(function(it){
      return it.symbols;
    }, graph.nodes)));
    state = new GraphState({
      view: queryParams.view || 'dag',
      smallGraphThreshold: 20,
      animating: 'waiting',
      root: null,
      symbol: symbol,
      jiggle: queryParams.jiggle,
      spline: queryParams.spline || 'curved',
      dagDirection: 'LR',
      all: graph,
      maxmarked: 20,
      zoom: 1,
      tickK: minTicks,
      translate: [5, 5],
      dimensions: {
        w: $('body').width(),
        h: $('body').height()
      },
      elision: queryParams.elision ? +queryParams.elision : null,
      relationships: sort(unique(map(function(it){
        return it.label;
      }, graph.edges))).concat(['elision'])
    });
    window.GRAPH = state;
    newGraph = graphify(progressMonitor('#dag .progress'), rows);
    $('.button.symbol').on('click', function(){
      var newSymbol;
      newSymbol = $('input.symbol').val();
      return newGraph(newSymbol).fail(notify).done(function(arg$){
        var nodes;
        nodes = arg$.nodes;
        return annotateForCounts(query, nodes);
      }).done(function(arg$){
        var nodes;
        nodes = arg$.nodes;
        return doHeightAnnotation;
      }).done(function(){
        return state.set('symbol', newSymbol);
      }).done(partialize$.apply(state, [state.set, ['all', void 8], [1]])).done(compose$([
        partialize$.apply(state, [state.set, ['root', void 8], [1]]), head, filter(isRoot), function(it){
          return it.nodes;
        }
      ]));
    });
    $('.graph-control').show().on('submit', function(it){
      return it.preventDefault();
    }).find('.resizer').click(function(){
      return $(this).toggleClass('icon-resize-small icon-resize-full').siblings('.hidable').slideToggle();
    });
    $('#jiggle').val(state.get('jiggle')).on('change', function(){
      return state.set('jiggle', $(this).val());
    });
    switches = {
      '#switch-view-dag': {
        view: 'dag'
      },
      '#switch-view-force': {
        view: 'force'
      },
      '#switch-orient-lr': {
        dagDirection: 'LR'
      },
      '#switch-orient-tb': {
        dagDirection: 'TB'
      }
    };
    for (selector in switches) {
      stateArgs = switches[selector];
      (fn$.call(this, stateArgs, selector, stateArgs));
    }
    $('#min-ticks').val(state.get('tickK')).change(function(){
      return state.set({
        tickK: $(this).val()
      });
    });
    state.on('change:tickK', flip(bind$($('#min-ticks'), 'val')));
    state.on('change:jiggle', flip(bind$($('#jiggle'), 'val')));
    $('#spline').val(state.get('spline')).on('change', function(){
      return state.set('spline', $(this).val());
    });
    state.on('change:spline', flip(bind$($('#spline'), 'val')));
    $('#force-reset').on('click', function(){
      return state.trigger('graph:reset');
    });
    state.on('graph:reset', function(){
      return unmark(state.get('graph').nodes);
    });
    x$ = rootSelector = $('#graph-root');
    x$.on('change', function(){
      var setRoot, nodes, rootId, rootNode;
      setRoot = partialize$.apply(state, [state.set, ['root', void 8], [1]]);
      nodes = state.get('all').nodes;
      rootId = $(this).val();
      rootNode = find(compose$([
        (function(it){
          return it === rootId;
        }), function(it){
          return it.id;
        }
      ]), nodes);
      setRoot(rootNode);
    });
    state.on('change:root', function(s, root){
      switch (false) {
      case !root:
        return rootSelector.val(root.id);
      default:
        return rootSelector.val('null');
      }
    });
    y$ = elisionSelector = $('#elision');
    y$.on('change', function(){
      return state.set('elision', parseInt($(this).val(), 10));
    });
    state.on('change:elision', flip(bind$(elisionSelector, 'val')));
    annotateForCounts(query, graph.nodes);
    doHeightAnnotation(graph.nodes);
    setUpOntologyTable();
    setUpInterop();
    state.on('graph:marked graph:reset', showOntologyTable);
    render = function(){
      switch (false) {
      case state.get('view') !== 'force':
        return renderForce.apply(this, arguments);
      default:
        return renderDag.apply(this, arguments);
      }
    };
    state.on('change:graph', function(){
      return setTimeout(function(){
        return render(state, state.get('graph'));
      }, 0);
    });
    state.on('change:view change:dagDirection', function(){
      return setTimeout(function(){
        return render(state, state.get('graph'));
      }, 0);
    });
    state.on('controls:changed', function(){
      return $(document).foundation();
    });
    roots = filter(isRoot, graph.nodes);
    for (i$ = 0, len$ = (ref$ = roots.concat([{
      id: 'null',
      label: "All"
    }])).length; i$ < len$; ++i$) {
      r = ref$[i$];
      rootSelector.append("<option value=\"" + r.id + "\">" + r.label + "</option>");
    }
    state.trigger('controls:changed');
    if (queryParams.allRoots) {
      render(state, state.get('graph'));
    } else {
      state.set('root', head(roots));
    }
    state.on('change:homologueProgress', function(s, progress){
      $('#homologue-progress .meter').css('width', progress * 100 + "%");
      return $('#homologue-progress').toggle(progress < 1);
    });
    function doHeightAnnotation(nodes){
      return setTimeout(function(){
        var heights, i$, len$, h, text, level;
        annotateForHeight(nodes);
        heights = sort(unique(map(function(it){
          return it.stepsFromLeaf;
        }, nodes)));
        elisionSelector.empty();
        for (i$ = 0, len$ = heights.length; i$ < len$; ++i$) {
          h = heights[i$];
          text = (fn$());
          elisionSelector.append("<option value=\"" + h + "\">" + text + "</option>");
        }
        state.trigger('controls:changed');
        if (level = state.get('elision')) {
          elisionSelector.val(level);
          return state.trigger('annotated:height');
        }
        function fn$(){
          switch (h) {
          case 0:
            return "Show all terms";
          case 1:
            return "Show only direct parents of annotations, and the root term";
          default:
            return "show all terms within " + h + " steps of a directly annotated term";
          }
        }
      }, 0);
    }
    function setUpInterop(){
      var $ul, toOption;
      $ul = $('#interop-sources');
      toOption = function(group){
        var $li;
        $li = $("<li><a href=\"#\" class=\"small button\">" + group.name + "</a></li>");
        return $li.find('a').on('click', function(){
          var $this;
          $this = $(this);
          if ($this.hasClass('disabled')) {
            return;
          }
          $this.addClass('disabled');
          return addHomologues(group.taxonId);
        });
      };
      return each(bind$($ul, 'append'), map(toOption, interop));
    }
    monitorHomologueProgress = monitorProgress(partialize$.apply(state, [state.set, ['homologueProgress', void 8], [1]]));
    function addHomologues(source){
      var service, rs, mergeGraph, gettingHomologues, gettingDirect, gettingAll, gettingNames, gettingEdges;
      service = interopMines[source];
      rs = flatRows(bind$(service, 'rows'));
      mergeGraph = mergeGraphs(state.get('all'));
      gettingHomologues = failWhenEmpty("No homologues found")(
      flatRows(rows)(
      homologueQuery(state.get('symbol'), source)));
      gettingDirect = gettingHomologues.then(compose$([rs, directHomologyTerms]));
      gettingAll = gettingDirect.then(compose$([rs, allHomologyTerms]));
      gettingNames = $.when(gettingHomologues, gettingAll).then(fetchNames(service.name, bind$(service, 'rows')));
      gettingEdges = gettingAll.then(compose$([bind$(service, 'rows'), wholeGraphQ])).then(map(rowToNode));
      monitorHomologueProgress([gettingHomologues, gettingDirect, gettingAll, gettingNames, gettingEdges]);
      return $.when(gettingDirect, gettingEdges, gettingNames).then(compose$([mergeGraph, makeGraph])).fail(notify).done(function(merged){
        state.set('all', merged);
        return annotateForCounts(bind$(service, 'query'), merged.nodes);
      });
    }
    function setUpOntologyTable(){
      var ref$, w, h, getLeft, x$, table;
      ref$ = state.get('dimensions'), w = ref$.w, h = ref$.h;
      getLeft = function(isOpen){
        switch (false) {
        case !isOpen:
          return w - 50;
        default:
          return w - 50 - $('#ontology-table .section-container').outerWidth();
        }
      };
      x$ = table = $('#ontology-table');
      x$.css({
        top: 0.05 * h,
        left: getLeft(true),
        height: 0.9 * h,
        width: 0.6 * w
      });
      table.find('.slide-control').on('click', function(){
        var wasOpen, x$, icon;
        wasOpen = table.hasClass('open');
        table.toggleClass('open').animate({
          left: getLeft(wasOpen)
        });
        x$ = icon = $('i', this);
        x$.removeClass('icon-chevron-right icon-chevron-left');
        x$.addClass(wasOpen ? 'icon-chevron-left' : 'icon-chevron-right');
        return x$;
      });
      return $('#ontology-table').find('table').addClass('tablesorter').tablesorter();
    }
    function showOntologyTable(){
      var ref$, w, h, markedStatements, evt, linkRow, termRow, x$, $stmTbl, y$, $trmTbl;
      ref$ = state.get('dimensions'), w = ref$.w, h = ref$.h;
      markedStatements = filter(compose$([
        function(it){
          return it.marked;
        }, function(it){
          return it.source;
        }
      ]))(
      function(it){
        return it.edges;
      }(
      state.get('graph')));
      evt = 'relationship:highlight';
      linkRow = function(link){
        var $row;
        $row = $("<tr>\n    <td>" + link.source.id + ": " + link.source.label + "</td>\n    <td>" + link.label + "</td>\n    <td>" + link.target.id + ": " + link.target.label + "</td>\n</tr>");
        return $row.on('mouseout', function(){
          $row.toggleClass('highlit', false);
          return state.trigger(evt, null);
        }).on('mouseover', function(){
          $row.toggleClass('highlit', true);
          return state.trigger(evt, link);
        });
      };
      termRow = function(term){
        var id, label, description, counts, sources, symbols, $row;
        id = term.id, label = term.label, description = term.description, counts = term.counts, sources = term.sources, symbols = term.symbols;
        $row = $("<tr>\n    <td>" + id + "</td>\n    <td>" + label + "</td>\n    <td>" + description + "</td>\n    <td>" + sum(counts) + "</td>\n    <td>" + join(', ', sources) + "</td>\n    <td>" + join(', ', symbols) + "</td>\n</tr>");
        return $row.on('mouseout', function(){
          $row.toggleClass('highlit', false);
          return state.trigger('term:highlight', null);
        }).on('mouseover', function(){
          $row.toggleClass('highlit', true);
          return state.trigger('term:highlight', term);
        });
      };
      x$ = $stmTbl = $('#ontology-table .marked-statements');
      x$.find('tbody').empty();
      y$ = $trmTbl = $('#ontology-table .marked-terms');
      y$.find('tbody').empty();
      each(compose$([bind$($stmTbl, 'append'), linkRow]), markedStatements);
      each(compose$([bind$($trmTbl, 'append'), termRow]), unique(concatMap(edgeToNodes, markedStatements)));
      return $('#ontology-table').toggle(markedStatements.length > 0).foundation('section', 'reflow').find('table').trigger('update');
    }
    return showOntologyTable;
    function fn$(args, selector, stateArgs){
      $(selector).change(function(){
        if ($(this).is(':checked')) {
          return state.set(args);
        }
      });
    }
  };
  drawPauseBtn = curry$(function(dimensions, state, svg){
    var ref$, cx, cy, radius, x, y, btn, drawPauseBars, symbolLine, toRadians, drawPlaySymbol;
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
    toRadians = (function(it){
      return it * Math.PI / 180;
    });
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
  drawRelationshipLegend = curry$(function(state, palette, svg){
    var ref$, dimensions, relationships, height, padding, width, getX, getY, legend, lg;
    ref$ = state.toJSON(), dimensions = ref$.dimensions, relationships = ref$.relationships;
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
  stratify = (function(sortX){
    return function(state){
      var ref$, dimensions, graph, zoom, currentFontSize, roots, leaves, surface, widthRange, corners, quantile, i$, len$, n;
      ref$ = state.toJSON(), dimensions = ref$.dimensions, graph = ref$.graph, zoom = ref$.zoom;
      currentFontSize = Math.min(40, 20 / zoom);
      roots = sortX(filter(isRoot, graph.nodes));
      leaves = sortX(filter(function(it){
        return it.isDirect && it.isLeaf;
      }, graph.nodes));
      surface = fold(min, 0, map(function(it){
        return it.y;
      }, graph.nodes));
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
  }.call(this, sortBy(compare(function(it){
    return it.x;
  }))));
  centrify = function(state){
    var ref$, graph, dimensions, roots, meanD, half, centre, maxH, i$, len$, leaf, baseSpeed, speed, results$ = [];
    ref$ = state.toJSON(), graph = ref$.graph, dimensions = ref$.dimensions;
    roots = sortBy(compare(function(it){
      return it.y;
    }), filter(isRoot, graph.nodes));
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
      ref$.x = half(dimensions.w);
      ref$.y = half(dimensions.h);
      ref$.fixed = true;
    } else {
      roots.forEach(function(n, i){
        var goal;
        goal = {
          x: half(dimensions.w),
          y: half(dimensions.h) - meanD * roots.length / 2 + meanD * i
        };
        mvTowards(0.05, goal, n);
      });
    }
    centre = {
      x: half(dimensions.w),
      y: half(dimensions.h)
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
  colourFilter = curry$(function(test, x){
    if (test(x)) {
      return brighten;
    } else {
      return id;
    }
  });
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
  renderForce = function(state, graph){
    var dimensions, force, svg, throbber, getLabelFontSize, zoom, relationships, svgGroup, link, getLabelId, node, nG, texts, tickCount;
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
    window.force = force;
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
    svg = d3.select('svg');
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
      return join(' ', cons('force-term', sources));
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
    state.on('nodes:marked', updateMarked);
    state.once('force:ready', function(){
      return centreAndZoom(function(it){
        return it.x;
      }, function(it){
        return it.y;
      }, state, graph.nodes, zoom);
    });
    function isReady(){
      var ref$, animating, tickK, graph, ready;
      ref$ = state.toJSON(), animating = ref$.animating, tickK = ref$.tickK, graph = ref$.graph;
      ready = animating === 'paused' || tickCount > tickK * ln(length(graph.edges));
      if (ready) {
        state.trigger('force:ready');
      }
      return ready;
    }
    function drawPathToRoot(d, i){
      var queue, moar, count, max, n;
      state.set('animating', 'running');
      if (isRoot(d)) {
        return toggleSubtree(d);
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
        return updateMarked();
      }
    }
    function toggleSubtree(root){
      markSubtree(root, 'muted', !root.muted);
      return updateMarked();
    }
    function unmark(){
      var i$, ref$, len$, n;
      for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        n.marked = n.muted = false;
      }
      return updateMarked();
    }
    function updateMarked(){
      var currentAnimation;
      state.trigger('graph:marked');
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
        link.attr('x1', compose$([
          function(it){
            return it.x;
          }, function(it){
            return it.source;
          }
        ])).attr('y1', compose$([
          function(it){
            return it.y;
          }, function(it){
            return it.source;
          }
        ])).attr('x2', compose$([
          function(it){
            return it.x;
          }, function(it){
            return it.target;
          }
        ])).attr('y2', compose$([
          function(it){
            return it.y;
          }, function(it){
            return it.target;
          }
        ]));
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
  makeGraph = function(directNodes, edges, nodeForIdent){
    var i$, len$, e, j$, ref$, len1$, prop, node, nodes, isRoot, isLeaf, n;
    for (i$ = 0, len$ = edges.length; i$ < len$; ++i$) {
      e = edges[i$];
      for (j$ = 0, len1$ = (ref$ = ['source', 'target']).length; j$ < len1$; ++j$) {
        prop = ref$[j$];
        node = nodeForIdent[e[prop]];
        if (node == null) {
          throw new Error("Could not find node: " + e[prop] + ", the " + prop + " of " + (prop === 'source'
            ? e.target
            : e.source));
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
    return {
      nodes: nodes,
      edges: edges
    };
  };
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
  renderDag = function(state, arg$){
    var reset, nodes, edges, svg, dimensions, svgGroup, update, spline, reRender, svgBBox, mvEdge, svgEdges, edgesEnter, svgNodes, nodesEnter, x$, markerEnd, rects, dragCp, lineWrap, labels, h, yStats, invertScale, invertNode, invertPoints, i$, len$, n, e, applyLayout, maxY, zoom, deDup, toCombos, getOverlapping, getDescale, separateColliding, drawCollisions, explodify, fixDagBoxCollisions, cooldown, focusEdges, animateFocus, highlightTargets, relationships, palette, edgeStroke, getDragX, getDragY, dragHandler, nodeDrag, edgeDrag;
    reset = arg$.reset, nodes = arg$.nodes, edges = arg$.edges;
    svg = d3.select('svg');
    svg.selectAll('g').remove();
    dimensions = state.get('dimensions');
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
      if (state.get('view') === 'dag') {
        return state.set('graph', {
          nodes: nodes,
          edges: edges
        });
      }
    });
    state.on('graph:reset', reset);
    console.log("Rendering " + length(nodes) + " nodes and " + length(edges) + " edges");
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
    x$ = svgNodes;
    x$.exit().remove();
    nodesEnter.on('click', function(node){
      var wasFiltered, filtered;
      wasFiltered = node.isFocus;
      unmark(nodes);
      if (wasFiltered) {
        console.log("Resetting");
        return reset();
      } else {
        markReachable(node);
        state.trigger('graph:marked');
        filtered = onlyMarked(nodes, edges);
        return reRender((filtered.reset = reset, filtered));
      }
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
      scale = min(2, max(1, getDescale()));
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
    edgesEnter.append('path').attr('marker-end', markerEnd).attr('stroke-width', 5).attr('opacity', 0.8).attr('stroke', linkStroke);
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
      return join(' ', cons('dag-term', sources));
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
    ])).attr('fill', termColor).classed('focus', function(it){
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
      h = state.get('dimensions').h;
      yStats = getMinMaxSize(compose$([
        function(it){
          return it.y;
        }, function(it){
          return it.dagre;
        }
      ]), nodes);
      invertScale = d3.scale.linear().domain([yStats.min, yStats.max]).range([h * 0.9, 0]);
      invertNode = function(it){
        return invertScale(it.dagre.y);
      };
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
        e.dagre.points = invertPoints(e.dagre.points);
      }
    }
    (applyLayout = function(){
      return nodesEnter.attr('transform', function(it){
        return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
      });
    })();
    maxY = fold(max, 0, map(function(it){
      return it.dagre.y;
    }, nodes));
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
    getDescale = function(){
      return 1 / state.get('zoom');
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
    drawCollisions = function(collisions){
      var i$, len$, collision, lresult$, j$, len1$, node, results$ = [];
      for (i$ = 0, len$ = collisions.length; i$ < len$; ++i$) {
        collision = collisions[i$];
        lresult$ = [];
        for (j$ = 0, len1$ = collision.length; j$ < len1$; ++j$) {
          node = collision[j$];
          lresult$.push(drawDebugRect(svgGroup, node));
        }
        results$.push(lresult$);
      }
      return results$;
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
        return setTimeout(function(){
          return explodify(highlit, i, roundsPerRun, maxRounds, done);
        }, 0);
      } else {
        console.log(collisions.length + " collisions left after " + i + " rounds");
        return done();
      }
    };
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
      if (!highlit.length) {
        return;
      }
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
          termColor(
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
      if (!someLit) {
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
      var points, s, t;
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
          x: points[0].x,
          y: points[0].y
        });
      }
    });
    addLabels(edgesEnter);
    edgesEnter.selectAll('circle.cp').data(function(d){
      var i$, ref$, len$, p;
      for (i$ = 0, len$ = (ref$ = d.dagre.points).length; i$ < len$; ++i$) {
        p = ref$[i$];
        p.parent = d;
      }
      return d.dagre.points.slice().reverse();
    }).enter().append('circle').attr('class', 'cp').call(dragCp);
    relationships = reverse(unique(map(function(it){
      return it.label;
    }, edges)));
    palette = d3.scale.category10();
    edgeStroke = compose$([
      palette, bind$(relationships, 'indexOf'), function(it){
        return it.label;
      }
    ]);
    svgEdges.selectAll('path').attr('id', compose$([
      function(it){
        return it.id;
      }, function(it){
        return it.dagre;
      }
    ])).attr('d', spline).attr('stroke', edgeStroke);
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
  rowToNode = function(arg$){
    var source, label, target;
    source = arg$[0], label = arg$[1], target = arg$[2];
    return {
      target: target,
      label: label,
      source: source
    };
  };
  queryParams = listToObj(
  map(compose$([
    map(decodeURIComponent), function(it){
      return it.split('=');
    }
  ]))(
  function(it){
    return it.split('&');
  }(
  function(it){
    return it.substring(1);
  }(
  location.search || '?'))));
  currentSymbol = function(){
    return queryParams.symbol || 'bsk';
  };
  graphify = curry$(function(monitor, getRows, symbol){
    var fetchFlat, gettingDirect, gettingAll, gettingNames, gettingEdges;
    console.log("Drawing graph for " + symbol);
    fetchFlat = flatRows(getRows);
    gettingDirect = failWhenEmpty("No annotation found for " + symbol)(
    fetchFlat(
    directTerms(
    symbol)));
    gettingAll = fetchFlat(
    allGoTerms(
    symbol));
    gettingNames = gettingAll.then(fetchNames('flymine', getRows, [symbol]));
    gettingEdges = gettingAll.then(compose$([getRows, wholeGraphQ])).then(map(rowToNode));
    monitor([gettingDirect, gettingAll, gettingNames, gettingEdges]);
    return function(it){
      return it.then(makeGraph);
    }($.when(gettingDirect, gettingEdges, gettingNames));
  });
  main = compose$([
    function(it){
      return it.then(draw, notify);
    }, graphify(progressMonitor('#dag .progress'), rows)
  ]);
  $(function(){
    return main(currentSymbol());
  });
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
  debugColors = d3.scale.category10();
  function drawDebugRect(svgGroup, node){
    console.log('drawing', node.id);
    return (function(tracked){
      svgGroup.append('circle').attr('cx', tracked.x).attr('fill', 'green').attr('cy', tracked.y).attr('r', 10);
      return svgGroup.append('rect').attr('x', tracked.x - tracked.width / 2).attr('y', tracked.y - tracked.height / 2).attr('width', tracked.width).attr('height', tracked.height).attr('stroke', 'red').attr('stroke-width', 1).attr('opacity', 0.3).attr('fill', debugColors(node.id));
    }.call(this, toXywh(node.bounds)));
  }
  sortOnX = sortBy(compare(function(it){
    return it.l;
  }));
  sortOnY = sortBy(compare(function(it){
    return it.t;
  }));
  function overlaps(arg$, arg1$){
    var a, b, p, ref$, overlapsH, overlapsV, contained;
    a = arg$.bounds;
    b = arg1$.bounds;
    p = nodePadding;
    ref$ = sortOnX([a, b]), a = ref$[0], b = ref$[1];
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
    ref$ = sortOnY([a, b]), a = ref$[0], b = ref$[1];
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
  function not$(x){ return !x; }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
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
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
}).call(this);
