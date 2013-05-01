if (typeof window == 'undefined' || window === null) {
  require('prelude-ls').installPrelude(global);
} else {
  prelude.installPrelude(window);
}
/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */
(function(){
  var Service, ref$, rows, query, nodePadding, minTicks, directTerms, allGoTerms, wholeGraphQ, countQuery, fetchNames, doLine, spline, translateEdge, getNodeDragPos, toNodeId, addLabels, markReachable, unmark, onlyMarked, findRoots, growTree, allChildren, drawChord, relationshipPalette, linkFill, linkStroke, termPalette, termColor, brighten, darken, BRIGHTEN, isRoot, isLeaf, getR, linkDistance, getCharge, markDepth, annotateForHeight, trimGraphToHeight, drawForce, renderForce, drawDag, makeGraph, doUpdate, renderDag, flatten, rowToNode, queryParams, currentSymbol, main, debugColors, sortOnX, sortOnY;
  Service = intermine.Service;
  ref$ = new Service({
    root: 'www.flymine.org/query'
  }), rows = ref$.rows, query = ref$.query;
  nodePadding = 10;
  minTicks = 20;
  directTerms = function(it){
    return {
      select: ['goAnnotation.ontologyTerm.identifier'],
      from: 'Gene',
      where: {
        symbol: [it]
      }
    };
  };
  allGoTerms = function(symbol){
    return {
      select: ['goAnnotation.ontologyTerm.identifier', 'goAnnotation.ontologyTerm.parents.identifier'],
      from: 'Gene',
      where: {
        symbol: symbol
      }
    };
  };
  wholeGraphQ = function(terms){
    return {
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
  fetchNames = function(identifier){
    var q;
    q = {
      select: ['identifier', 'name'],
      from: 'OntologyTerm',
      where: {
        identifier: identifier
      }
    };
    return rows(q).then(compose$([
      listToObj, map(function(arg$){
        var ident, label;
        ident = arg$[0], label = arg$[1];
        return [
          ident, {
            label: label,
            id: ident,
            edges: []
          }
        ];
      })
    ]));
  };
  doLine = d3.svg.line().x(function(it){
    return it.x;
  }).y(function(it){
    return it.y;
  }).interpolate('bundle');
  spline = function(arg$){
    var source, target, points, p0, pN;
    source = arg$.source.dagre, target = arg$.target.dagre, points = arg$.dagre.points;
    p0 = {
      x: source.x + source.width / 2,
      y: source.y
    };
    pN = {
      x: target.x - 15 - target.width / 2,
      y: target.y
    };
    return doLine([p0].concat(points, [pN]));
  };
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
      n.isReachable = true;
      results$.push(each(bind$(queue, 'push'), moar(n)));
    }
    return results$;
  };
  unmark = function(nodes){
    var i$, len$, n, results$ = [];
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      n = nodes[i$];
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
        return it.isReachable;
      }, nodes),
      edges: filter(compose$([
        function(it){
          return it.isReachable;
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
  drawChord = function(directNodes, edges, nodeForIdent){
    var graph, roots, trees, ontology, nodeMapping, i$, len$, tree, subOntology, j$, ref$, len1$, term, getMapped, links, svg, orientation, svgGroup, zoom, bundle, cluster, line, nodes, splines, path, angleBetween, dragGTerms, goTerms, linkagePalette;
    graph = makeGraph.apply(this, arguments);
    roots = findRoots(graph);
    trees = map(growTree, roots);
    ontology = {
      label: 'GO',
      children: [],
      id: 'go-ontology'
    };
    nodeMapping = {};
    for (i$ = 0, len$ = trees.length; i$ < len$; ++i$) {
      tree = trees[i$];
      subOntology = {
        label: tree.label,
        id: tree.id,
        children: allChildren(tree)
      };
      console.log(subOntology);
      for (j$ = 0, len1$ = (ref$ = subOntology.children).length; j$ < len1$; ++j$) {
        term = ref$[j$];
        term.parent = subOntology;
        term.children = [];
        nodeMapping[term.id] = term;
      }
      subOntology.parent = ontology;
      ontology.children.push(subOntology);
    }
    getMapped = function(it){
      return nodeMapping[it.id];
    };
    links = filter(function(arg$){
      var source, target;
      source = arg$.source, target = arg$.target;
      return source && target;
    })(
    map(function(arg$){
      var source, target;
      source = arg$.source, target = arg$.target;
      return {
        source: getMapped(source),
        target: getMapped(target)
      };
    })(
    graph.edges));
    console.log(links.length);
    svg = d3.select('svg');
    svg.attr('width', 2000).attr('height', 1000);
    orientation = {
      angle: 0
    };
    svgGroup = svg.append('g').attr('transform', 'translate(500, 500)');
    zoom = d3.behavior.zoom().on('zoom', function(){
      return svgGroup.attr('transform', "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);
    bundle = d3.layout.bundle();
    cluster = d3.layout.cluster().size([360, 250]);
    line = d3.svg.line.radial().interpolate('bundle').tension(0.85).radius(function(it){
      return it.y;
    }).angle(function(it){
      return it.x / 180 * Math.PI;
    });
    nodes = cluster.nodes(ontology);
    console.log(length(allChildren(ontology)));
    console.log(nodes.length);
    splines = bundle(links);
    path = svgGroup.selectAll('path.chord').data(links).enter().append('path').attr('class', 'chord').attr('stroke', '#555').attr('d', function(d, i){
      return line(splines[i]);
    });
    angleBetween = function(arg$, arg1$){
      var xa, ya, xb, yb;
      xa = arg$[0], ya = arg$[1];
      xb = arg1$[0], yb = arg1$[1];
      switch (false) {
      case !(xa === xb && ya === yb):
        return Math.PI / 2;
      default:
        return Math.atan2(yb - ya, xb - xa);
      }
    };
    dragGTerms = d3.behavior.drag().origin(function(){
      var t;
      t = d3.select(this);
      return {
        x: t.attr('x'),
        y: t.attr('y')
      };
    }).on('drag', function(d){
      var angle;
      angle = Math.atan2(d3.event.dx, d3.event.dy);
      orientation.angle += angle;
      return svgGroup.attr('transform', "translate(500, 500) rotate(" + orientation.angle * 180 / 2 + ")");
    });
    goTerms = svgGroup.selectAll('g.node').data(nodes).enter().append('g').attr('class', 'node').attr('id', compose$([
      function(it){
        return it.replace(/:/g, '_');
      }, function(it){
        return it.id;
      }
    ])).attr('transform', function(arg$){
      var x, y;
      x = arg$.x, y = arg$.y;
      return "rotate(" + (x - 90) + ") translate(" + y + ")";
    }).append('text').attr('class', 'chord-label').attr('dx', function(arg$){
      var x;
      x = arg$.x;
      if (x < 180) {
        return 8;
      } else {
        return -8;
      }
    }).attr('dy', '.31em').attr('text-anchor', function(arg$){
      var x;
      x = arg$.x;
      if (x < 180) {
        return 'start';
      } else {
        return 'end';
      }
    }).attr('transform', function(arg$){
      var x;
      x = arg$.x;
      if (x < 180) {
        return null;
      } else {
        return 'rotate(180)';
      }
    }).text(function(it){
      return it.label;
    }).classed('direct', compose$([
      (function(it){
        return in$(it, directNodes);
      }), function(it){
        return it.id;
      }
    ])).on('mouseover', showLinks).on('mouseout', hideLinks);
    linkagePalette = d3.scale.category20b();
    function showLinks(d, i, level){
      level == null && (level = 1);
      if (level > 20 || d.seen) {
        return;
      }
      return svgGroup.selectAll('path.chord').attr('stroke', function(arg$){
        var source, target, nextLevel, lowest;
        source = arg$.source, target = arg$.target;
        nextLevel = level + 1;
        if (target === d) {
          target.seen = level;
          setTimeout(function(){
            return showLinks(source, i, nextLevel);
          }, 0);
          return linkagePalette(level);
        } else {
          lowest = Math.max(target.seen || 0, source.seen || 0);
          if (lowest) {
            return linkagePalette(lowest);
          } else {
            return null;
          }
        }
      });
    }
    function hideLinks(d){
      var i$, ref$, len$, n;
      for (i$ = 0, len$ = (ref$ = nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        n.seen = false;
      }
      return setTimeout(function(){
        return svgGroup.selectAll('path.chord').attr('stroke', '#555');
      }, 0);
    }
    return hideLinks;
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
  termPalette = d3.scale.category20();
  termColor = compose$([
    function(it){
      return it.darker();
    }, bind$(d3, 'rgb'), termPalette, function(it){
      return it.id;
    }, function(it){
      return it.root;
    }
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
  BRIGHTEN = compose$([brighten, brighten]);
  isRoot = function(it){
    return it.isRoot;
  };
  isLeaf = function(it){
    return it.isLeaf;
  };
  getR = function(it){
    return (1.5 * ln(it.count) + 5) * (it.marked ? 2 : 1);
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
    markedBump = d.marked ? 150 : 0;
    jiggleBump = queryParams.jiggle === 'strata' ? 20 : 0;
    k = 150;
    return 1 - (k + radius + rootBump + edgeBump + markedBump);
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
    }, map((function(it){
      return it.depths = [], it;
    }), nodes));
    for (i$ = 0, len$ = leaves.length; i$ < len$; ++i$) {
      leaf = leaves[i$];
      markDepth(leaf, 0, level);
    }
    return each(function(it){
      return it.stepsFromLeaf = minimum(it.depths), it;
    }, nodes);
  };
  trimGraphToHeight = function(arg$, level){
    var nodes, edges, f, filtered, i$, ref$, len$, n, elision;
    nodes = arg$.nodes, edges = arg$.edges;
    if (!level) {
      return {
        nodes: nodes,
        edges: edges
      };
    }
    console.log("Trimming graph to " + level);
    f = compose$([
      (function(it){
        return it <= level;
      }), function(it){
        return it.stepsFromLeaf;
      }
    ]);
    filtered = {
      nodes: filter(f, nodes),
      edges: filter(function(it){
        return all(f, [it.source, it.target]);
      }, edges)
    };
    console.log(filtered.nodes.length, nodes.length);
    each(bind$(filtered.nodes, 'push'), filter(isRoot, nodes));
    for (i$ = 0, len$ = (ref$ = filtered.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (!n.isRoot && any(compose$([not$, f]), map(fn$, n.edges))) {
        elision = {
          source: n,
          target: n.root,
          label: ''
        };
        filtered.edges.push(elision);
      }
    }
    console.log(filtered, nodes);
    return filtered;
    function fn$(it){
      return it.target;
    }
  };
  drawForce = function(directNodes, edges, nodeForIdent){
    var graph, allNodes, allEdges, state, elideGraph, x$, rootSelector, y$, elisionSelector, i$, ref$, len$, n, roots, r;
    graph = makeGraph.apply(this, arguments);
    allNodes = graph.nodes.slice();
    allEdges = graph.edges.slice();
    state = new Backbone.Model({
      smallGraphThreshold: 15,
      animating: 'waiting',
      root: null,
      jiggle: queryParams.jiggle || 'centre',
      spline: queryParams.spline || 'curved',
      graph: graph,
      elision: queryParams.elision ? +queryParams.elision : null
    });
    elideGraph = function(s, level){
      var g;
      console.log("Eliding graph to " + level);
      g = s.get('graph');
      return s.set('graph', trimGraphToHeight(g, level));
    };
    state.on('change:elision', elideGraph);
    query(
    countQuery(
    keys(
    nodeForIdent))).then(function(it){
      return it.summarise('goAnnotation.ontologyTerm.parents.identifier');
    }).then(compose$([
      listToObj, map(function(arg$){
        var count, item;
        count = arg$.count, item = arg$.item;
        return [item, count];
      })
    ])).then(function(summary){
      var i$, ref$, len$, n, results$ = [];
      for (i$ = 0, len$ = (ref$ = allNodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        results$.push(n.count = summary[n.id]);
      }
      return results$;
    });
    $('.graph-control').show();
    $('#jiggle').val(state.get('jiggle')).on('change', function(){
      return state.set('jiggle', $(this).val());
    });
    state.on('change:jiggle', flip(bind$($('#jiggle'), 'val')));
    $('#spline').val(state.get('spline')).on('change', function(){
      return state.set('spline', $(this).val());
    });
    state.on('change:spline', flip(bind$($('#spline'), 'val')));
    x$ = rootSelector = $('#graph-root');
    x$.on('change', function(){
      state.set('root', nodeForIdent[$(this).val()]);
    });
    state.on('change:root', flip(compose$([
      bind$(rootSelector, 'val'), function(it){
        return it.id;
      }
    ])));
    state.on('change:root', function(s, currentRoot){
      var nodes, edges, level, graph;
      console.log("Filtering to " + currentRoot.label);
      nodes = filter(compose$([
        (function(it){
          return it === currentRoot;
        }), function(it){
          return it.root;
        }
      ]), allNodes);
      edges = filter(compose$([
        (function(it){
          return it === currentRoot;
        }), function(it){
          return it.root;
        }, function(it){
          return it.target;
        }
      ]), allEdges);
      level = state.get('elision');
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
      return state.set('graph', graph);
    });
    y$ = elisionSelector = $('#elision');
    y$.on('change', function(){
      return state.set('elision', parseInt($(this).val(), 10));
    });
    state.on('change:elision', flip(bind$(elisionSelector, 'val')));
    setTimeout(function(){
      var heights, i$, len$, h, level;
      annotateForHeight(allNodes);
      heights = sort(unique(map(function(it){
        return it.stepsFromLeaf;
      }, allNodes)));
      for (i$ = 0, len$ = heights.length; i$ < len$; ++i$) {
        h = heights[i$];
        elisionSelector.append("<option value=\"" + h + "\">" + h + "</option>");
      }
      if (level = state.get('elision')) {
        elisionSelector.val(level);
        return elideGraph(state, level);
      }
    }, 0);
    state.on('change:graph', renderForce);
    $('#force-stop').show().on('click', function(){
      var nextState;
      nextState = (function(){
        switch (state.get('animating')) {
        case 'waiting':
          return 'running';
        case 'running':
          return 'paused';
        case 'paused':
          return 'running';
        }
      }());
      state.set('animating', nextState);
    });
    state.on('change:animating', function(){
      switch (false) {
      case !'running':
        return $('#force-stop').text('Pause animation');
      case !'paused':
        return $('#force-label').text('Resume animation');
      }
    });
    for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      n.count = 1;
    }
    roots = filter(isRoot, allNodes);
    for (i$ = 0, len$ = roots.length; i$ < len$; ++i$) {
      r = roots[i$];
      rootSelector.append("<option value=\"" + r.id + "\">" + r.label + "</option>");
    }
    if (queryParams.allRoots) {
      return renderForce(state, graph);
    } else {
      return state.set('root', roots[0]);
    }
  };
  renderForce = function(state, graph){
    var dimensions, force, svg, svgGroup, throbber, getLabelFontSize, zoom, relationships, link, getLabelId, node, nG, legend, lg, tickCount, timer, basisLine, linkSpline, drawCurve, byX, widthRange, stratify, centrify;
    state.set({
      zoom: 1,
      dimensions: {
        w: $('body').width(),
        h: $('body').height()
      }
    });
    dimensions = state.get('dimensions');
    force = d3.layout.force().size([dimensions.w, dimensions.h]).charge(getCharge).gravity(0.04).linkStrength(0.8).linkDistance(linkDistance);
    svg = d3.select('svg');
    svg.selectAll('g.ontology').remove();
    svgGroup = svg.append('g').attr('class', 'ontology').attr('transform', 'translate(5, 5)');
    throbber = svg.append('use').attr('x', dimensions.w / 2 - 150).attr('y', dimensions.h / 2 - 150).attr('xlink:href', '#throbber');
    state.on('change:zoom', function(s, currentZoom){
      svgGroup.attr('transform', "translate(" + s.get('translate') + ") scale(" + currentZoom + ")");
      return force.tick();
    });
    state.on('change:translate', function(s, currentTranslation){
      svgGroup.attr('transform', "translate(" + currentTranslation + ") scale(" + s.get('zoom') + ")");
      return force.tick();
    });
    getLabelFontSize = function(){
      return Math.min(40, 20 / state.get('zoom'));
    };
    zoom = d3.behavior.zoom().on('zoom', function(){
      return state.set({
        zoom: d3.event.scale,
        translate: d3.event.translate.slice()
      });
    });
    svg.call(zoom);
    relationships = unique(map(function(it){
      return it.label;
    }, graph.edges));
    svg.attr('width', dimensions.w).attr('height', dimensions.h);
    force.nodes(graph.nodes).links(graph.edges).on('tick', tick);
    link = svgGroup.selectAll('.force-link').data(graph.edges);
    link.enter().append(queryParams.spline ? 'path' : 'line').attr('class', 'force-link').attr('stroke-width', '1px').attr('stroke', linkStroke).attr('fill', linkFill).append('title', function(e){
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
    nG.append('circle').attr('class', 'force-term').classed('root', isRoot).classed('direct', function(it){
      return it.isDirect;
    }).attr('fill', termColor).attr('cx', -dimensions.w).attr('cy', -dimensions.h).attr('r', getR);
    nG.append('text').attr('class', 'count-label').attr('fill', 'white').attr('text-anchor', 'middle').attr('display', 'none').attr('x', -dimensions.w).attr('y', -dimensions.h).attr('dy', '0.3em');
    nG.append('text').attr('class', 'force-label').attr('text-anchor', 'start').attr('fill', '#555').attr('stroke', 'white').attr('stroke-width', '0.1px').attr('display', function(it){
      if (it.isDirect) {
        return 'block';
      } else {
        return 'none';
      }
    }).attr('id', getLabelId).attr('x', -dimensions.w).attr('y', -dimensions.h).text(function(it){
      return it.label;
    });
    nG.append('title').text(function(it){
      return it.label;
    });
    legend = svg.selectAll('g.legend').data(relationships);
    lg = legend.enter().append('g').attr('class', 'legend').attr('width', 140).attr('height', 50).attr('x', 25).attr('y', function(d, i){
      return 25 + 50 * i;
    }).on('click', function(rel){
      var i$, ref$, len$, e, j$, ref1$, len1$, n;
      for (i$ = 0, len$ = (ref$ = graph.edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
        if (e.label === rel) {
          for (j$ = 0, len1$ = (ref1$ = [e.source, e.target]).length; j$ < len1$; ++j$) {
            n = ref1$[j$];
            n.marked = true;
          }
        }
      }
      updateMarked(true);
      return setTimeout(unmark, 10000);
    });
    legend.exit().remove();
    lg.append('rect').attr('opacity', 0.6).attr('width', 180).attr('height', 50).attr('x', 25).attr('y', function(d, i){
      return 50 * i;
    }).attr('fill', relationshipPalette);
    lg.append('text').attr('x', 25).attr('y', function(d, i){
      return 25 + 50 * i;
    }).attr('dy', '0.31em').attr('dx', '1em').text(id);
    tickCount = 0;
    force.start();
    function isReady(){
      return tickCount > minTicks * ln(length(graph.edges));
    }
    function drawPathToRoot(d, i){
      var queue, moar, count, max, n, i$, ref$, len$, sn;
      state.set('animating', 'running');
      force.resume();
      if (isRoot(d)) {
        return toggleSubtree(d);
      } else {
        clearTimeout(timer);
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
        max = 15;
        while (count++ < max && (n = queue.shift())) {
          n.marked = true;
          for (i$ = 0, len$ = (ref$ = moar(n)).length; i$ < len$; ++i$) {
            sn = ref$[i$];
            queue.push(sn);
          }
        }
        updateMarked(true);
        return timer = setTimeout(unmark, 25000);
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
    function updateMarked(afterMark){
      if (afterMark) {
        force.start();
      }
      return force.tick();
    }
    function showLabel(d, i){
      var i$, ref$, len$, n;
      for (i$ = 0, len$ = (ref$ = concatMap(fn$, d.edges)).length; i$ < len$; ++i$) {
        n = ref$[i$];
        d3.select('#' + getLabelId(n)).attr('display', 'block');
      }
      return setTimeout(function(){
        return hideLabel(d, i);
      }, 6000);
      function fn$(it){
        return [it.source, it.target];
      }
    }
    function hideLabel(d, i){
      var i$, ref$, len$, n, results$ = [];
      for (i$ = 0, len$ = (ref$ = concatMap(fn$, d.edges)).length; i$ < len$; ++i$) {
        n = ref$[i$];
        results$.push(d3.select('#' + getLabelId(n)).attr('display', 'none'));
      }
      return results$;
      function fn$(it){
        return [it.source, it.target];
      }
    }
    /* http://bl.ocks.org/sboak/2942559 */
    /* http://bl.ocks.org/sboak/2942556 */
    basisLine = d3.svg.line().interpolate('basis');
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
    drawCurve = function(arg$){
      var target, source, cos, sin, sqrt, atan2, pow, PI, slope, ref$, sinS, cosS, slopePlus90, sin90, cos90, radiusT, radiusS, lineLength, endPoint, args, points;
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
      points = (function(){
        switch (state.get('spline')) {
        case 'straight':
          return linkSpline(0.0);
        default:
          return linkSpline(0.1);
        }
      }());
      return (function(it){
        return it + 'Z';
      })(
      basisLine(
      points(
      args)));
    };
    byX = compare(function(it){
      return it.x;
    });
    widthRange = d3.scale.linear().range([0.1 * dimensions.w, 0.9 * dimensions.w]);
    stratify = function(){
      var roots, leaves, surface, currentFontSize, corners, quantile, i$, ref$, len$, n;
      roots = sortBy(byX, filter(isRoot, graph.nodes));
      leaves = sortBy(byX, filter(function(it){
        return it.isDirect && it.isLeaf;
      }, graph.nodes));
      surface = fold(min, 0, map(function(it){
        return it.y;
      }, graph.nodes));
      currentFontSize = getLabelFontSize();
      widthRange.domain([0, leaves.length - 1]);
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
      leaves.forEach(function(n, i){
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
    centrify = function(){
      var roots, meanD, half, centre, i$, ref$, len$, leaf;
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
      roots.forEach(function(n, i){
        var goal;
        goal = {
          x: half(dimensions.w),
          y: half(dimensions.h) - meanD * roots.length / 2 + meanD * i
        };
        mvTowards(0.05, goal, n);
      });
      centre = {
        x: half(dimensions.w),
        y: half(dimensions.h)
      };
      for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
        leaf = ref$[i$];
        if (isLeaf(leaf)) {
          mvTowards(-0.001, centre, leaf);
        }
      }
    };
    function tick(){
      var jiggle, currentFontSize, fontPlusPad, meanX, getHalf, texts, displayedTexts, circles;
      tickCount++;
      jiggle = (function(){
        switch (state.get('jiggle')) {
        case 'strata':
          return stratify;
        case 'centre':
          return centrify;
        }
      }());
      if (jiggle) {
        jiggle();
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
      texts = node.selectAll('text.force-label');
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
      node.selectAll('text.count-label').attr('x', function(it){
        return it.x;
      }).attr('y', function(it){
        return it.y;
      }).attr('font-size', compose$([
        (function(it){
          return it / 1.5;
        }), getR
      ])).text(function(it){
        return it.count;
      });
      if (queryParams.spline) {
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
      node.selectAll('text').attr('display', function(arg$){
        var marked, id, edges, isDirect;
        marked = arg$.marked, id = arg$.id, edges = arg$.edges, isDirect = arg$.isDirect;
        switch (false) {
        case !(graph.edges.length < state.get('smallGraphThreshold')):
          return 'block';
        case !(state.get('zoom') > 2):
          return 'block';
        case !(marked || isDirect):
          return 'block';
        case !all((function(it){
            return it === id;
          }), map(compose$([
            function(it){
              return it.id;
            }, function(it){
              return it.source;
            }
          ]), edges)):
          return 'block';
        default:
          return 'none';
        }
      });
      node.selectAll('text.force-label').attr('font-size', currentFontSize);
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
          if (it.marked) {
            return 1;
          } else {
            return 0.2;
          }
        });
        link.attr('opacity', function(arg$){
          var source;
          source = arg$.source;
          switch (false) {
          case !source.marked:
            return 0.8;
          default:
            return 0.1;
          }
        });
        return node.selectAll('text').attr('opacity', function(it){
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
            return 0.3;
          } else {
            return 0.5;
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
        return node.selectAll('text').attr('opacity', function(it){
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
  drawDag = function(directNodes, edges, nodeForIdent){
    var graph, svg, svgGroup;
    graph = makeGraph.apply(this, arguments);
    svg = d3.select('svg');
    svgGroup = svg.append('g').attr('transform', 'translate(5, 5)');
    d3.selectAll(svg.node).attr('width', $('body').width()).attr('height', $('body').height());
    return renderDag(svg, svgGroup, graph);
  };
  makeGraph = function(directNodes, edges, nodeForIdent){
    var i$, len$, e, j$, ref$, len1$, prop, nodes, isRoot, isLeaf, n;
    for (i$ = 0, len$ = edges.length; i$ < len$; ++i$) {
      e = edges[i$];
      for (j$ = 0, len1$ = (ref$ = ['source', 'target']).length; j$ < len1$; ++j$) {
        prop = ref$[j$];
        nodeForIdent[e[prop]].edges.push(e);
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
  renderDag = curry$(function(svg, svgGroup, arg$){
    var nodes, edges, reset, reRender, update, svgBBox, currentZoom, mvEdge, svgEdges, edgesEnter, svgNodes, nodesEnter, x$, rects, dragCp, lineWrap, labels, applyLayout, maxY, zoom, asZoom, maxX, dx, deDup, toCombos, getOverlapping, getDescale, separateColliding, drawCollisions, explodify, fixDagBoxCollisions, focusEdges, highlightTargets, relationships, palette, edgeStroke, getDragX, getDragY, dragHandler, nodeDrag, edgeDrag;
    nodes = arg$.nodes, edges = arg$.edges, reset = arg$.reset;
    reRender = renderDag(svg, svgGroup);
    update = function(){
      return doUpdate(svgGroup);
    };
    reset == null && (reset = function(){
      return reRender({
        nodes: nodes,
        edges: edges
      });
    });
    console.log("Rendering " + length(nodes) + " nodes and " + length(edges) + " edges");
    svgBBox = svg.node().getBBox();
    currentZoom = 1;
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
        filtered = onlyMarked(nodes, edges);
        return reRender((filtered.reset = reset, filtered));
      }
    });
    edgesEnter.append('path').attr('marker-end', 'url(#Triangle)').attr('stroke-width', 5).attr('opacity', 0.8).attr('stroke', linkStroke);
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
    rects.attr('width', function(it){
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
    dagre.layout().nodeSep(50).edgeSep(20).rankSep(75).rankDir('LR').nodes(nodes).edges(edges).debugLevel(1).run();
    (applyLayout = function(){
      return nodesEnter.attr('transform', function(it){
        return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
      });
    })();
    maxY = fold(max, 0, map(function(it){
      return it.dagre.y;
    }, nodes));
    zoom = d3.behavior.zoom().on('zoom', function(){
      currentZoom = d3.event.scale;
      return svgGroup.attr('transform', "translate(" + d3.event.translate + ") scale(" + currentZoom + ")");
    });
    asZoom = ($('body').height() - 100) / maxY;
    console.log(maxY);
    if (asZoom < 1) {
      currentZoom = asZoom;
      zoom.scale(currentZoom);
      svgGroup.attr('transform', "translate(5,5) scale(" + currentZoom + ")");
    }
    maxX = 200 + currentZoom * fold(max, 0, map(function(it){
      return it.dagre.x;
    }, nodes));
    if (maxX < $('body').width()) {
      dx = ($('body').width() - maxX) / 2;
      zoom.translate([dx, 5]);
      svgGroup.attr('transform', "translate(" + dx + ",5) scale(" + currentZoom + ")");
    }
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
      return 1 / currentZoom;
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
      var scale, halfPad, isFocussed, highlit, maxRounds, round, roundsPerRun;
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
      maxRounds = 50;
      round = 0;
      roundsPerRun = 5;
      return explodify(highlit, round, roundsPerRun, maxRounds, function(){
        return nodesEnter.each(function(n, i){
          var fill, nodeSelection, ref$, x, y;
          fill = (n.isCentre ? brighten : id)(
          termColor(
          n));
          nodeSelection = d3.select(this);
          if (isFocussed(n)) {
            ref$ = toXywh(n.bounds), x = ref$.x, y = ref$.y;
            nodeSelection.transition().duration(100).attr('transform', "translate(" + x + "," + y + ") scale(" + scale + ")");
          }
          return nodeSelection.selectAll('rect').attr('fill', fill);
        });
      });
    });
    focusEdges = function(){
      var someLit, duration, delay, deScale, maxI, notFocussed;
      someLit = any(function(it){
        return it.highlight;
      }, edges);
      duration = 100;
      delay = 200;
      deScale = Math.max(1, getDescale());
      maxI = nodes.length - 1;
      notFocussed = function(it){
        return !someLit || !any(function(it){
          return it.highlight;
        }, it.edges);
      };
      nodesEnter.transition().duration(duration * 2).delay(delay).attr('transform', function(it){
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
      svgEdges.selectAll('path').transition().delay(delay).duration(duration).attr('stroke-width', function(it){
        if (it.highlight) {
          return 15;
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
      return svgEdges.selectAll('text').transition().duration(duration).delay(delay).attr('font-weight', function(it){
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
      maxMarked = 25;
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
  });
  flatten = concatMap(id);
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
  main = function(symbol){
    var gettingDirect, gettingAll, gettingNames, gettingEdges, draw;
    console.log("Drawing graph for " + symbol);
    gettingDirect = function(it){
      return it.then(flatten);
    }(
    rows(
    directTerms(
    symbol)));
    gettingAll = rows(
    allGoTerms(
    symbol));
    gettingNames = gettingAll.then(compose$([fetchNames, flatten]));
    gettingEdges = gettingAll.then(compose$([rows, wholeGraphQ, flatten])).then(map(rowToNode));
    draw = (function(){
      switch (queryParams.view) {
      case 'radial':
        return drawRadial;
      case 'chord':
        return drawChord;
      case 'force':
        return drawForce;
      default:
        return drawDag;
      }
    }());
    return $.when(gettingDirect, gettingEdges, gettingNames).then(draw);
  };
  main(currentSymbol());
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
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
  function not$(x){ return !x; }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
