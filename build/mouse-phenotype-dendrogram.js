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
 *  Generated: Thu, 27 Sep 2012 12:04:56 GMT
 */

(function() {
var root = this;

  /**#@+ the presenter */
  var Widget,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  
  Widget = (function() {
  
    Widget.prototype.pq = {
      alleleTerms: {
        "select": ["Gene.symbol", "Gene.alleles.id", "Gene.alleles.genotypes.id", "Gene.alleles.genotypes.phenotypeTerms.id", "Gene.alleles.genotypes.phenotypeTerms.name"],
        "constraints": [
          {
            "path": "Gene",
            "op": "LOOKUP",
            "value": "MGI:97747",
            "extraValue": ""
          }
        ]
      },
      highLevelTerms: {
        "select": ["Allele.highLevelPhenotypeTerms.name", "Allele.highLevelPhenotypeTerms.relations.childTerm.name"],
        "constraints": []
      }
    };
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      this.dendrogram = __bind(this.dendrogram, this);
  
      this.service = new intermine.Service({
        'root': 'http://metabolicmine.org/beta/service/'
      });
    }
  
    Widget.prototype.render = function(target) {
      var _this = this;
      this.target = target;
      return this.alleleTerms(function(top, children) {
        return _this.highLevelTerms(top, children, _this.dendrogram);
      });
    };
  
    Widget.prototype.alleleTerms = function(cb) {
      return this.service.query(this.pq.alleleTerms, function(q) {
        return q.records(function(records) {
          var allele, genotype, max, term, terms, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
          max = 1;
          terms = {};
          _ref = records[0]['alleles'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            allele = _ref[_i];
            _ref1 = allele.genotypes;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              genotype = _ref1[_j];
              _ref2 = genotype.phenotypeTerms;
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                term = _ref2[_k];
                if (terms[term.name] != null) {
                  terms[term.name].count += 1;
                  if (terms[term.name].count > max) {
                    max = terms[term.name].count;
                  }
                } else {
                  terms[term.name] = {
                    'count': 1
                  };
                }
              }
            }
          }
          return cb(max, terms);
        });
      });
    };
  
    Widget.prototype.highLevelTerms = function(max, children, cb) {
      var k, pq, v;
      pq = this.pq.highLevelTerms;
      pq.constraints.push({
        "path": "Allele.highLevelPhenotypeTerms.relations.childTerm.name",
        "op": "ONE OF",
        "values": (function() {
          var _results;
          _results = [];
          for (k in children) {
            v = children[k];
            _results.push(k);
          }
          return _results;
        })()
      });
      return this.service.query(pq, function(q) {
        return q.rows(function(rows) {
          var child, parent, t, terms, _i, _len, _ref;
          terms = {};
          for (_i = 0, _len = rows.length; _i < _len; _i++) {
            _ref = rows[_i], parent = _ref[0], child = _ref[1];
            if (terms[parent] != null) {
              terms[parent].children.push({
                'name': child,
                'count': children[child].count,
                'band': Math.floor(children[child].count / (max / 4))
              });
            } else {
              terms[parent] = {
                'name': parent,
                'children': []
              };
            }
          }
          terms = (function() {
            var _j, _len1, _ref1, _results;
            _ref1 = _(terms).toArray();
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              t = _ref1[_j];
              if (t.children.length !== 0) {
                _results.push(t);
              }
            }
            return _results;
          })();
          return cb({
            'name': 'MGI:97747',
            'children': terms
          });
        });
      });
    };
  
    Widget.prototype.dendrogram = function(data) {
      var cluster, d, depths, diagonal, height, link, links, n, node, nodes, rx, ry, sort, vis, width, _i, _j, _len, _len1, _ref, _results;
      width = 1000;
      height = 800;
      rx = width / 2;
      ry = height / 2;
      sort = function(a, b) {
        switch (a.depth - b.depth) {
          case -1:
            return -1;
          case 1:
            return 1;
          default:
            if ((a.count != null) && (b.count != null)) {
              return a.count - b.count;
            }
        }
        return 0;
      };
      cluster = d3.layout.cluster().size([360, ry - 50]).sort(sort);
      diagonal = d3.svg.diagonal.radial().projection(function(d) {
        return [d.y, d.x / 180 * Math.PI];
      });
      vis = d3.select($(this.target)[0]).append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("transform", "translate(" + rx + "," + ry + ")");
      vis.append("svg:path").attr("class", "arc").attr("d", d3.svg.arc().innerRadius(ry - 50).outerRadius(ry - 20).startAngle(0).endAngle(2 * Math.PI));
      nodes = cluster.nodes(data);
      links = vis.append("svg:g").attr("class", "links");
      _ref = cluster.links(nodes);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        links.append("svg:path").attr("class", "link").attr("d", diagonal(link));
      }
      n = vis.append("svg:g").attr("class", "nodes");
      depths = [n.append("svg:g").attr("class", "depth-2"), n.append("svg:g").attr("class", "depth-1"), n.append("svg:g").attr("class", "depth-0")];
      _results = [];
      for (_j = 0, _len1 = nodes.length; _j < _len1; _j++) {
        d = nodes[_j];
        node = depths[Math.abs(d.depth - 2)].append("svg:g").attr("class", d.count != null ? "node depth-" + d.depth + " count-" + d.count : "node depth-" + d.depth).attr("transform", "rotate(" + (d.x - 90) + ")translate(" + d.y + ")");
        node.append("svg:circle").attr("r", Math.abs(d.depth - 6)).attr("class", d.band ? "band-" + d.band : void 0);
        node.append("svg:title").text(d.name);
        _results.push(node.append("svg:text").attr("dx", d.x < 180 ? 8 : -8).attr("dy", ".31em").attr("text-anchor", d.x < 180 ? "start" : "end").attr("transform", d.x < 180 ? null : "rotate(180)").text(d.name.length > 50 ? d.name.slice(0, 50) + '...' : d.name));
      }
      return _results;
    };
  
    return Widget;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  
  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK path.arc{fill:#FFF}div#w#@+CALLBACK .node.depth-0{font-size:18px}div#w#@+CALLBACK .node.depth-1{font-size:14px}div#w#@+CALLBACK .node.depth-2{font-size:10px}div#w#@+CALLBACK .node circle{fill:#FFF;stroke:#CCC;stroke-width:1.5px}div#w#@+CALLBACK .node.depth-2 circle{stroke:#FEE5D9;fill:#FEE5D9}div#w#@+CALLBACK .node circle.band-1{stroke:#FCAE91;fill:#FCAE91}div#w#@+CALLBACK .node circle.band-2{stroke:#FB6A4A;fill:#FB6A4A}div#w#@+CALLBACK .node circle.band-3{stroke:#DE2D26;fill:#DE2D26}div#w#@+CALLBACK .node circle.band-4{stroke:#A50F15;fill:#A50F15}div#w#@+CALLBACK .node.depth-2 text{display:none}div#w#@+CALLBACK .link{fill:none;stroke:#CCC;stroke-width:1.5px}';
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