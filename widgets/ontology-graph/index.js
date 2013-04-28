if (typeof window == 'undefined' || window === null) {
  require('prelude-ls').installPrelude(global);
} else {
  prelude.installPrelude(window);
}
/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */
(function(){
  var Service, ref$, rows, query, nodePadding, directTerms, allGoTerms, wholeGraphQ, countQuery, fetchNames, doLine, spline, translateEdge, getNodeDragPos, toNodeId, addLabels, markReachable, unmark, onlyMarked, findRoots, growTree, allChildren, drawChord, drawForce, drawRadial, drawDag, makeGraph, doUpdate, render, flatten, rowToNode, queryParams, currentSymbol, main;
  Service = intermine.Service;
  ref$ = new Service({
    root: 'www.flymine.org/query'
  }), rows = ref$.rows, query = ref$.query;
  nodePadding = 10;
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
  spline = function(e){
    var points, source, target;
    points = e.dagre.points.slice();
    source = dagre.util.intersectRect(e.source.dagre, points[0]);
    target = dagre.util.intersectRect(e.target.dagre, points[points.length - 1]);
    points.unshift(source);
    points.push(target);
    return doLine(points);
  };
  translateEdge = curry$(function(arg$, e, dx, dy){
    var width, height, i$, ref$, len$, p, ref1$, ref2$, results$ = [];
    width = arg$.width, height = arg$.height;
    for (i$ = 0, len$ = (ref$ = e.dagre.points).length; i$ < len$; ++i$) {
      p = ref$[i$];
      p.x = 0 > (ref1$ = width < (ref2$ = p.x + dx) ? width : ref2$) ? 0 : ref1$;
      results$.push(p.y = 0 > (ref1$ = height < (ref2$ = p.y + dy) ? height : ref2$) ? 0 : ref1$);
    }
    return results$;
  });
  getNodeDragPos = curry$(function(sizeProp, posProp, svgBox, d){
    var halfSize, halfRemaining, eventPos;
    halfSize = d[sizeProp] / 2;
    halfRemaining = svgBox[sizeProp] - d[sizeProp] / 2;
    eventPos = d3.event[posProp];
    return Math.max(halfSize, Math.min(halfRemaining, eventPos));
  });
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
  markReachable = function(node){
    var sources, targets, nextRank, toMark, n, lresult$, nextLevel, i$, len$, nn, results$ = [];
    node.isFocus = true;
    sources = compose$([
      reject(function(it){
        return it.isReachable;
      }), map(function(it){
        it.isSource;
        return it;
      }), map(function(it){
        return it.source;
      }), function(it){
        return it.edges;
      }
    ]);
    targets = compose$([
      reject(function(it){
        return it.isReachable;
      }), map(function(it){
        it.isTarget;
        return it;
      }), map(function(it){
        return it.target;
      }), function(it){
        return it.edges;
      }
    ]);
    nextRank = function(it){
      return unique(concat([sources(it), targets(it)]));
    };
    toMark = nextRank(node);
    while (n = toMark.shift()) {
      lresult$ = [];
      n.isReachable = true;
      nextLevel = (fn$());
      for (i$ = 0, len$ = nextLevel.length; i$ < len$; ++i$) {
        nn = nextLevel[i$];
        lresult$.push(toMark.push(nn));
      }
      results$.push(lresult$);
    }
    return results$;
    function fn$(){
      switch (false) {
      case !n.isSource:
        return targets(n);
      default:
        return sources(n);
      }
    }
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
      edges: filter(function(arg$){
        var target, source;
        target = arg$.target, source = arg$.source;
        return all(function(it){
          return it.isReachable;
        }, [source, target]);
      }, edges)
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
        return it.target;
      }, edges));
    };
    while (n = queue.shift()) {
      n[prop] = val;
      each(bind$(queue, 'push'), moar(n));
    }
    return root;
  }
  drawForce = function(directNodes, edges, nodeForIdent){
    var graph, i$, ref$, len$, n, isRoot, isLeaf, getR, force, svg, svgGroup, zoom, color, relationships, link, getLabelId, node, nG, legend, lg, timer, basisLine, linkSpline, drawCurve, mvTowards, byX, widthRange, stratify, centrify;
    $('#jiggle').show().val(queryParams.jiggle).on('change', function(){
      queryParams.jiggle = $(this).val();
      force.start();
    });
    $('#spline').show().val(queryParams.spline).on('change', function(){
      queryParams.spline = $(this).val();
      tick();
    });
    $('#force-stop').show().on('click', function(){
      force.stop();
      setTimeout(bind$(force, 'start'), 40000);
    });
    graph = makeGraph.apply(this, arguments);
    for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      n.count = 1;
    }
    isRoot = function(it){
      return it.isRoot;
    };
    isLeaf = function(it){
      return it.isLeaf;
    };
    getR = compose$([
      (function(it){
        return 5 + it;
      }), (function(it){
        return 1.5 * it;
      }), ln, function(it){
        return it.count;
      }
    ]);
    force = d3.layout.force().charge(function(d){
      var radius, rootBump, edgeBump, markedBump, jiggleBump, k;
      radius = getR(d);
      rootBump = isRoot(d) ? 150 : 0;
      edgeBump = 10 * d.edges.length;
      markedBump = d.marked ? 150 : 0;
      jiggleBump = queryParams.jiggle === 'strata' ? 100 : 0;
      k = 100;
      return 1 - (k + radius + rootBump + edgeBump + markedBump);
    }).gravity(0.04).linkStrength(0.8).linkDistance(function(arg$){
      var source, target, ns, edges, markedBump, mutedPenalty, radii;
      source = arg$.source, target = arg$.target;
      ns = [source, target];
      edges = sum(map(function(it){
        var ref$;
        return ((ref$ = it.edges) != null ? ref$.length : void 8) || 0;
      }, ns));
      markedBump = any(function(it){
        return it.marked;
      }, ns) ? 150 : 0;
      mutedPenalty = any(function(it){
        return it.muted;
      }, ns) ? 100 : 0;
      radii = sum(map(getR, ns));
      return 3 * edges + radii + 50 + markedBump - mutedPenalty;
    }).size([1400, 1000]);
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
      var i$, ref$, len$, n;
      for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        n.count = summary[n.id];
      }
      nG.selectAll('circle').attr('r', getR);
      return force.start();
    });
    svg = d3.select('svg');
    svgGroup = svg.append('g').attr('transform', 'translate(5, 5)');
    zoom = d3.behavior.zoom().on('zoom', function(){
      return svgGroup.attr('transform', "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);
    color = d3.scale.category10();
    relationships = unique(map(function(it){
      return it.label;
    }, graph.edges));
    svg.attr('width', 1400).attr('height', 1000);
    force.nodes(graph.nodes).links(graph.edges).on('tick', tick);
    link = svgGroup.selectAll('.force-link').data(graph.edges);
    link.enter().append(queryParams.spline ? 'path' : 'line').attr('class', 'force-link').attr('stroke-width', '1px').attr('stroke', compose$([
      color, bind$(relationships, 'indexOf'), function(it){
        return it.label;
      }
    ])).attr('fill', compose$([
      color, bind$(relationships, 'indexOf'), function(it){
        return it.label;
      }
    ]));
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
    nG.append('circle').attr('class', 'force-term').classed('root', isRoot).classed('direct', function(it){
      return it.isDirect;
    }).attr('r', getR);
    nG.append('text').attr('class', 'count-label').attr('fill', 'white').attr('text-anchor', 'middle').attr('dy', '0.3em');
    nG.append('text').attr('class', 'force-label').attr('text-anchor', 'start').attr('fill', '#555').attr('stroke', 'black').attr('stroke-width', '0.5px').attr('display', function(it){
      if (it.isDirect) {
        return 'block';
      } else {
        return 'none';
      }
    }).attr('id', getLabelId).text(function(it){
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
    lg.append('rect').attr('opacity', 0.6).attr('width', 180).attr('height', 50).attr('x', 25).attr('y', function(d, i){
      return 50 * i;
    }).attr('fill', function(d, i){
      return color(i);
    });
    lg.append('text').attr('x', 25).attr('y', function(d, i){
      return 25 + 50 * i;
    }).attr('dy', '0.31em').attr('dx', '1em').text(id);
    updateMarked();
    function drawPathToRoot(d, i){
      var queue, moar, count, max, n, i$, ref$, len$, sn;
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
            return it.source;
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
    function updateMarked(marked){
      force.start();
      node.selectAll('text.force-label').attr('display', function(arg$){
        var marked, id, edges, isDirect;
        marked = arg$.marked, id = arg$.id, edges = arg$.edges, isDirect = arg$.isDirect;
        switch (false) {
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
      if (marked) {
        node.selectAll('circle').attr('opacity', function(it){
          if (it.marked) {
            return 1;
          } else {
            return 0.2;
          }
        });
        link.attr('opacity', function(arg$){
          var target;
          target = arg$.target;
          switch (false) {
          case !target.marked:
            return 0.8;
          default:
            return 0.2;
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
            return 0.6;
          }
        });
        node.selectAll('circle').attr('opacity', function(it){
          if (it.muted) {
            return 0.3;
          } else {
            return 1;
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
      var source, target, lineLength, endPoint, width, cos90, sin90, meanX, meanY, offset, mp1X, mp1Y, mp2X, mp2Y;
      source = args[0], target = args[1], lineLength = args[2], endPoint = args[3], width = args[4], cos90 = args[5], sin90 = args[6];
      meanX = mean(map(function(it){
        return it.x;
      }, [source, target]));
      meanY = mean(map(function(it){
        return it.y;
      }, [source, target]));
      offset = offsetScale * lineLength - width / 2;
      mp1X = meanX + offset * cos90;
      mp1Y = meanY + offset * sin90;
      mp2X = meanX + offset * cos90;
      mp2Y = meanY + offset * sin90;
      return [[source.x - width * cos90, source.y - width * sin90], [mp2X, mp2Y], endPoint, endPoint, [mp1X, mp1Y], [source.x + width * cos90, source.y + width * sin90]];
    });
    drawCurve = function(arg$){
      var target, source, ref$, cos, sin, sqrt, atan2, pow, PI, slope, sinS, cosS, slopePlus90, sin90, cos90, radiusT, radiusS, width, lineLength, endPoint, args, points;
      target = arg$.target, source = arg$.source;
      ref$ = [target, source], source = ref$[0], target = ref$[1];
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
      width = radiusS / 3;
      lineLength = sqrt(pow(target.x - source.x, 2) + pow(target.y - source.y, 2));
      endPoint = [target.x + radiusT * cosS, target.y + radiusT * sinS];
      args = [source, target, lineLength, endPoint, width, cos90, sin90];
      points = (function(){
        switch (queryParams.spline) {
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
    mvTowards = function(howMuch, goal, n){
      var dx, dy;
      dx = (function(it){
        return howMuch * it;
      })(goal.x - n.x);
      dy = (function(it){
        return howMuch * it;
      })(goal.y - n.y);
      n.x += dx;
      n.y += dy;
    };
    byX = compare(function(it){
      return it.x;
    });
    widthRange = d3.scale.linear().range([0, 1400]);
    stratify = function(){
      var roots, leaves, quantile, i$, ref$, len$, n, ref1$, qn, qr;
      roots = sortBy(byX, filter(isRoot, graph.nodes));
      leaves = sortBy(byX, filter(isLeaf, graph.nodes));
      widthRange.domain([0, roots.length - 1]);
      roots.forEach(function(root, i){
        return mvTowards(0.06, {
          y: 0,
          x: widthRange(i)
        }, root);
      });
      quantile = d3.scale.quantile().domain([0, 1400]).range((function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = roots.length; i$ < to$; ++i$) {
          results$.push(i$);
        }
        return results$;
      }()));
      for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        ref1$ = map(quantile, [n.x, n.root.x]), qn = ref1$[0], qr = ref1$[1];
        if (qn !== qr && (abs(qn - qr) > 1 || any(fn$, filter(fn1$, graph.nodes)))) {
          mvTowards(0.02, {
            y: n.y,
            x: n.root.x
          }, n);
        }
      }
      leaves.forEach(function(n, i){
        if (n.y < 1000) {
          mvTowards(0.02, {
            x: n.x,
            y: 1000
          }, n);
        }
        if (n.y >= 970) {
          return n.y = 1000 + 30 * i;
        }
      });
      function fn$(it){
        return it.root !== n.root;
      }
      function fn1$(it){
        return quantile(it.x === qr);
      }
    };
    centrify = function(){
      var roots, meanD;
      roots = sortBy(compare(function(it){
        return it.y;
      }), filter(isRoot, graph.nodes));
      meanD = mean(map(compose$([
        (function(it){
          return it * 2;
        }), getR
      ]), roots));
      roots.forEach(function(n, i){
        var goal;
        goal = {
          x: 700,
          y: 500 - meanD * roots.length / 2 + meanD * i
        };
        mvTowards(0.05, goal, n);
      });
    };
    function tick(){
      var jiggle, circles, meanX, getHalf, texts, displayedTexts;
      jiggle = (function(){
        switch (queryParams.jiggle) {
        case 'strata':
          return stratify;
        case 'centre':
          return centrify;
        }
      }());
      if (jiggle) {
        jiggle();
      }
      circles = node.selectAll('circle');
      meanX = mean(map(function(it){
        return it.x;
      }, graph.nodes));
      getHalf = d3.scale.quantile().domain([0, 1400]).range(['left', 'right']);
      texts = node.selectAll('text.force-label');
      displayedTexts = texts.filter(function(){
        return 'block' === d3.select(this).attr('display');
      });
      displayedTexts.each(function(d1, i){
        var overlapped, thisHalf, op;
        overlapped = false;
        thisHalf = getHalf(d1.x);
        displayedTexts.each(function(d2){
          var overlapped;
          return overlapped || (overlapped = getHalf(d2.x === thisHalf) && abs(d1.y - d2.y) < 20);
        });
        if (overlapped) {
          op = even(i)
            ? curry$(function(x$, y$){
              return x$ + y$;
            })
            : curry$(function(x$, y$){
              return x$ - y$;
            });
          return d1.y = op(d1.y, 22);
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
      circles.attr('cx', function(it){
        return it.x;
      }).attr('cy', function(it){
        return it.y;
      });
      if (queryParams.spline) {
        return link.attr('d', drawCurve);
      } else {
        return link.attr('x1', compose$([
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
    }
    return tick;
  };
  drawRadial = function(directNodes, edges, nodeForIdent){
    var graph, roots, root, tree, svg, svgGroup, zoom, cluster, diagonal, nodes, links, palette, relationships, linkStroke, link, node, setOnEachToRoot, circlePalette, nodeIds, circleFill, circles, texts, showFocussed;
    graph = makeGraph.apply(this, arguments);
    roots = findRoots(graph);
    root = (function(){
      switch (false) {
      case !((typeof queryParams != 'undefined' && queryParams !== null) && queryParams.root):
        return find(compose$([
          (function(it){
            return it === queryParams.root;
          }), function(it){
            return it.id;
          }
        ]), roots);
      default:
        return head(roots);
      }
    }());
    tree = growTree(root);
    svg = d3.select('svg');
    svg.attr('width', 2000).attr('height', 1000);
    svgGroup = svg.append('g').attr('transform', 'translate(500, 500)');
    zoom = d3.behavior.zoom().on('zoom', function(){
      return svgGroup.attr('transform', "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);
    cluster = d3.layout.cluster().size([360, 225]).sort(function(a, b){
      return d3.ascending(a.children.length, b.children.length);
    });
    diagonal = d3.svg.diagonal.radial().projection(function(arg$){
      var x, y;
      x = arg$.x, y = arg$.y;
      return [y, x / 180 * Math.PI];
    });
    nodes = cluster.nodes(tree);
    links = cluster.links(nodes);
    palette = d3.scale.category10();
    relationships = unique(map(function(it){
      return it.relationship;
    }, nodes));
    linkStroke = compose$([palette, bind$(relationships, 'indexOf')]);
    link = svgGroup.selectAll('path.link').data(links).enter().append('path').attr('class', 'link').attr('stroke', linkStroke).attr('d', diagonal);
    node = svgGroup.selectAll('g.treenode').data(nodes).enter().append('g').attr('class', 'treenode').attr('transform', function(arg$){
      var x, y;
      x = arg$.x, y = arg$.y;
      return "rotate(" + (x - 90) + ") translate(" + y + ")";
    });
    setOnEachToRoot = function(tn, val){
      var results$ = [];
      import$(tn, val);
      while (tn = tn.parent) {
        results$.push(import$(tn, val));
      }
      return results$;
    };
    circlePalette = d3.scale.category20();
    nodeIds = unique(map(function(it){
      return it.id;
    }, nodes));
    circleFill = compose$([
      circlePalette, bind$(nodeIds, 'indexOf'), function(it){
        return it.id;
      }
    ]);
    circles = node.append('circle').attr('r', function(it){
      if (it.nodeType === 'root') {
        return 10;
      } else {
        return 3.5;
      }
    }).attr('class', function(it){
      if (in$(it.id, directNodes)) {
        return 'direct';
      } else {
        return it.nodeType;
      }
    }).attr('fill', circleFill).on('mouseover', function(tn){
      var i$, ref$, len$, n;
      setOnEachToRoot(tn, {
        focus: true
      });
      for (i$ = 0, len$ = (ref$ = nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        if (n.id === tn.id && n !== tn) {
          n.synonym = true;
        }
      }
      return showFocussed();
    }).on('mouseout', function(tn){
      var i$, ref$, len$, n;
      setOnEachToRoot(tn, {
        focus: false
      });
      for (i$ = 0, len$ = (ref$ = nodes).length; i$ < len$; ++i$) {
        n = ref$[i$];
        n.synonym = false;
      }
      return showFocussed();
    });
    texts = node.append('text').attr('class', 'go-name').attr('dx', function(arg$){
      var x;
      x = arg$.x;
      if (x < 180) {
        return 8;
      } else {
        return -8;
      }
    }).attr('dy', '.31em').text(function(it){
      return it.label;
    }).attr('text-anchor', 'start').attr('text-anchor', function(arg$){
      var x, children;
      x = arg$.x, children = arg$.children;
      switch (false) {
      case !(x < 180):
        return 'start';
      case !(children.length > 1):
        return 'start';
      default:
        return 'end';
      }
    }).attr('transform', function(arg$){
      var x, children;
      x = arg$.x, children = arg$.children;
      switch (false) {
      case !(children.length > 1):
        return 'rotate(0)';
      case !(x < 45):
        return 'rotate(45)';
      case !(x < 180):
        return 'rotate(-45)';
      case !(x < 315):
        return 'rotate(240)';
      default:
        return 'rotate(120)';
      }
    });
    return (showFocussed = function(){
      texts.attr('opacity', function(arg$){
        var focus;
        focus = arg$.focus;
        switch (false) {
        case !focus:
          return 1;
        case !(nodes.length > 50):
          return 0;
        default:
          return 0.1;
        }
      });
      link.attr('stroke-width', function(arg$){
        var focus;
        focus = arg$.target.focus;
        if (focus) {
          return '5px';
        } else {
          return '1.5px';
        }
      });
      return circles.attr('r', function(arg$){
        var nodeType, synonym;
        nodeType = arg$.nodeType, synonym = arg$.synonym;
        switch (false) {
        case nodeType !== 'root':
          return 10;
        case !synonym:
          return 7;
        default:
          return 3.5;
        }
      });
    })();
  };
  drawDag = function(directNodes, edges, nodeForIdent){
    var graph, svg, svgGroup, x$, svgBBox;
    graph = makeGraph.apply(this, arguments);
    svg = d3.select('svg');
    svgGroup = svg.append('g').attr('transform', 'translate(5, 5)');
    x$ = svgBBox = svg.node().getBBox();
    x$.width = 5000;
    x$.height = 2000;
    return render(svg, svgGroup, graph);
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
        return it.source;
      }, n.edges));
    };
    isLeaf = function(n){
      return all((function(it){
        return it === n;
      }), map(function(it){
        return it.target;
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
  render = curry$(function(svg, svgGroup, arg$){
    var nodes, edges, reset, reRender, update, svgBBox, mvEdge, svgEdges, edgesEnter, svgNodes, nodesEnter, x$, rects, dragCp, labels, focusEdges, relationships, palette, edgeStroke, getDragX, getDragY, dragHandler, nodeDrag, edgeDrag, zoom;
    nodes = arg$.nodes, edges = arg$.edges, reset = arg$.reset;
    reRender = render(svg, svgGroup);
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
    mvEdge = translateEdge(svgBBox);
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
    rects = nodesEnter.append('rect');
    edgesEnter.append('path').attr('marker-start', 'url(#arrowhead)');
    dragCp = d3.behavior.drag().on('drag', function(d){
      d.y += d3.event.dy;
      mvEdge(d.parent, d3.event.dx, 0);
      return d3.select('#' + d.parent.dagre.id).attr('d', spline);
    });
    labels = nodesEnter.append('text').attr('text-anchor', 'middle').attr('x', 0).attr('class', function(it){
      if (it.isDirect) {
        return 'direct';
      } else {
        return 'indirect';
      }
    });
    labels.append('tspan').attr('x', 0).attr('dy', '1em').text(function(it){
      return it.label;
    });
    labels.each(function(d){
      var bbox;
      bbox = this.getBBox();
      d.bbox = bbox;
      d.width = bbox.width + 2;
      return d.height = bbox.height + 2;
    });
    rects.attr('width', compose$([
      (function(it){
        return nodePadding + it;
      }), function(it){
        return it.width;
      }
    ])).attr('height', compose$([
      (function(it){
        return nodePadding + it;
      }), function(it){
        return it.height;
      }
    ])).attr('x', function(it){
      return -it.bbox.width / 2 - nodePadding;
    }).attr('y', function(it){
      return -it.bbox.height / 2 - nodePadding / 2;
    }).attr('class', function(it){
      switch (false) {
      case !it.isFocus:
        return 'focus';
      case !it.isDirect:
        return 'direct';
      default:
        return 'indirect';
      }
    });
    labels.attr('x', function(it){
      return -it.bbox.width / 2;
    }).attr('y', function(it){
      return -it.bbox.height / 2;
    });
    dagre.layout().nodeSep(50).edgeSep(10).rankSep(50).nodes(nodes).edges(edges).debugLevel(1).run();
    nodesEnter.attr('transform', function(it){
      return "translate(" + it.dagre.x + "," + it.dagre.y + ")";
    });
    focusEdges = function(){
      return svgEdges.selectAll('path').attr('class', function(it){
        switch (false) {
        case !it.highlight:
          return 'highlight';
        default:
          return it.label;
        }
      });
    };
    nodesEnter.on('mouseover', function(node){
      var i$, ref$, len$, e;
      for (i$ = 0, len$ = (ref$ = node.edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
        e.highlight = true;
      }
      return focusEdges();
    });
    nodesEnter.on('mouseout', function(node){
      var i$, ref$, len$, e;
      for (i$ = 0, len$ = (ref$ = node.edges).length; i$ < len$; ++i$) {
        e = ref$[i$];
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
    getDragX = getNodeDragPos('width', 'x', svgBBox);
    getDragY = getNodeDragPos('height', 'y', svgBBox);
    dragHandler = function(d, i){
      var prevX, prevY, dx, dy, i$, ref$, len$, e, results$ = [];
      prevX = d.dagre.x;
      prevY = d.dagre.y;
      d.dagre.x = getDragX(d);
      d.dagre.y = getDragY(d);
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
    zoom = d3.behavior.zoom().on('zoom', function(){
      return svgGroup.attr('transform', "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);
    nodesEnter.call(nodeDrag);
    return edgesEnter.call(edgeDrag);
  });
  flatten = concatMap(id);
  rowToNode = function(arg$){
    var target, label, source;
    target = arg$[0], label = arg$[1], source = arg$[2];
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
  function in$(x, arr){
    var i = -1, l = arr.length >>> 0;
    while (++i < l) if (x === arr[i] && i in arr) return true;
    return false;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
