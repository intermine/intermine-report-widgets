new Error('This widget cannot be called directly');

/**
 *      _/_/_/  _/      _/   
 *       _/    _/_/  _/_/     InterMine Report Widget
 *      _/    _/  _/  _/      (C) 2013 InterMine, University of Cambridge.
 *     _/    _/      _/       http://intermine.org
 *  _/_/_/  _/      _/
 *
 *  Name: #@+TITLE
 *  Author: #@+AUTHOR
 *  Description: #@+DESCRIPTION
 *  Version: #@+VERSION
 *  Generated: Thu, 16 May 2013 18:36:36 GMT
 */
(function() {
  var clazz
    , root = this;

  /**#@+ the presenter */

  var AssertException, Config, Dendrogram, PopoverTable, RadialDendrogram, TreeDendrogram, Widget,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
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
    Widget.prototype.pq = {
      alleleTerms: {
        "select": ["Gene.symbol", "Gene.alleles.id", "Gene.alleles.genotypes.id", "Gene.alleles.genotypes.phenotypeTerms.id", "Gene.alleles.genotypes.phenotypeTerms.name"],
        "constraints": []
      },
      highLevelTerms: {
        "select": ["Allele.highLevelPhenotypeTerms.name", "Allele.highLevelPhenotypeTerms.relations.childTerm.name"],
        "constraints": []
      },
      alleles: {
        "select": ["Gene.alleles.genotypes.phenotypeTerms.name", "Gene.alleles.symbol", "Gene.alleles.primaryIdentifier", "Gene.alleles.name", "Gene.alleles.type", "Gene.alleles.genotypes.geneticBackground", "Gene.alleles.genotypes.zygosity", "Gene.alleles.organism.name"],
        "constraints": []
      }
    };
  
    Widget.prototype.alleleTerms = function(cb) {
      var c, i, pq, _i, _ref,
        _this = this;
  
      assert(this.config.symbol != null, '`symbol` of the gene in question not provided');
      pq = this.pq.alleleTerms;
      for (i = _i = 0, _ref = pq.constraints.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        c = pq.constraints[i];
        if ((c != null ? c.path : void 0) === 'Gene' && (c != null ? c.op : void 0) === 'LOOKUP') {
          pq.constraints.splice(i, 1);
        }
      }
      pq.constraints.push({
        "path": "Gene",
        "op": "LOOKUP",
        "value": this.config.symbol
      });
      return this.service.query(pq, function(q) {
        return q.records(function(records) {
          var allele, genotype, term, terms, _j, _k, _l, _len, _len1, _len2, _ref1, _ref2, _ref3;
  
          if (records.length === 0) {
            return _this.message('No results found');
          }
          _this.max = 1;
          terms = {};
          _ref1 = records[0]['alleles'];
          for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
            allele = _ref1[_j];
            _ref2 = allele.genotypes;
            for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
              genotype = _ref2[_k];
              _ref3 = genotype.phenotypeTerms;
              for (_l = 0, _len2 = _ref3.length; _l < _len2; _l++) {
                term = _ref3[_l];
                if (terms[term.name] != null) {
                  terms[term.name].count += 1;
                  if (terms[term.name].count > _this.max) {
                    _this.max = terms[term.name].count;
                  }
                } else {
                  terms[term.name] = {
                    'count': 1
                  };
                }
              }
            }
          }
          _this.band = _this.max / 4;
          return cb(terms);
        });
      });
    };
  
    Widget.prototype.highLevelTerms = function(children, cb) {
      var c, i, k, pq, v, _i, _ref,
        _this = this;
  
      assert(cb != null, 'callback `cb` needs to be provided, we use async data loading');
      assert(this.config.symbol != null, '`symbol` of the gene in question not provided');
      assert(this.band != null, '`band` of allele counts not provided');
      pq = this.pq.highLevelTerms;
      for (i = _i = 0, _ref = pq.constraints.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        c = pq.constraints[i];
        if ((c != null ? c.path : void 0) === 'Allele.highLevelPhenotypeTerms.relations.childTerm.name' && (c != null ? c.op : void 0) === 'ONE OF') {
          pq.constraints.splice(i, 1);
        }
      }
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
          var child, parent, t, terms, _j, _len, _ref1;
  
          terms = {};
          for (_j = 0, _len = rows.length; _j < _len; _j++) {
            _ref1 = rows[_j], parent = _ref1[0], child = _ref1[1];
            if (terms[parent] != null) {
              terms[parent].children.push({
                'name': child,
                'count': children[child].count,
                'band': Math.floor(children[child].count / _this.band),
                'type': 'leaf'
              });
            } else {
              terms[parent] = {
                'name': parent.replace(' phenotype', ''),
                'children': [],
                'type': 'hlt'
              };
            }
          }
          _this.hlts = [];
          terms = (function() {
            var _k, _len1, _ref2, _results,
              _this = this;
  
            _ref2 = _(terms).toArray();
            _results = [];
            for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
              t = _ref2[_k];
              if (t.children.length !== 0) {
                _results.push((function() {
                  _this.hlts.push(t.name);
                  return t;
                })());
              }
            }
            return _results;
          }).call(_this);
          return cb({
            'name': _this.config.symbol,
            'children': terms,
            'depth': 0
          });
        });
      });
    };
  
    function Widget(config, templates) {
      this.config = config;
      this.templates = templates;
      this.dendrogram = __bind(this.dendrogram, this);
      this.renderGraph = __bind(this.renderGraph, this);
      this.service = new intermine.Service({
        'root': 'http://metabolicmine.org/beta/service/'
      });
    }
  
    Widget.prototype.render = function(target) {
      var dis,
        _this = this;
  
      this.target = target;
      $(this.target).html(this.templates.widget({
        'symbol': this.config.symbol
      }));
      (dis = function() {
        return _this.alleleTerms(function(children) {
          return _this.highLevelTerms(children, _this.renderGraph);
        });
      })();
      return $(this.target).find('input.symbol').keyup(function(e) {
        var symbol;
  
        symbol = $(e.target).val();
        if (symbol !== _this.config.symbol) {
          _this.config.symbol = symbol;
          return dis();
        }
      });
    };
  
    Widget.prototype.message = function(text) {
      return $(this.target).find('.graph').html($('<div/>', {
        'class': 'alert-box',
        'text': text
      }));
    };
  
    /*
    Once data are loaded or updated, render the dendrogram and init config for it.
    @param {object} data A root to children object to render.
    */
  
  
    Widget.prototype.renderGraph = function(data) {
      var config,
        _this = this;
  
      assert(typeof data === 'object' && (data.children != null), '`data` needs to be an Object with `children`');
      assert(this.target != null, 'need to have a target for rendering defined');
      assert(this.band != null, '`band` of allele counts not provided');
      assert(this.max != null, '`max` top allele count not provided');
      config = new Config(this.templates.config, $(this.target).find('.config'));
      return config.update(function(config) {
        return _this.dendrogram(data, config);
      });
    };
  
    Widget.prototype.dendrogram = function(data, config) {
      var filterChildren, graph, params, target,
        _this = this;
  
      assert(this.target != null, 'need to have a target for rendering defined');
      assert(this.config.width != null, 'need to provide a `width` for the chart');
      assert(this.config.height != null, 'need to provide a `height` for the chart');
      assert(typeof config === 'object', '`config` of the graph are not provided');
      data = (filterChildren = function(node, bandCutoff, category) {
        var ch, children, _i, _len, _ref;
  
        assert(node != null, '`node` not provided');
        assert(bandCutoff != null, '`bandCutoff` not provided');
        assert(category != null, '`category` not provided');
        if (node.type === 'hlt') {
          if ((node.children == null) || node.children.length === 0) {
            return;
          }
          if (category !== 'all' && node.name !== category) {
            return;
          }
        }
        if (!((node.children != null) && node.children.length > 0)) {
          return node;
        }
        assert(node.children != null, 'need children at this point, knock me up!');
        children = [];
        _ref = node.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ch = _ref[_i];
          if (!((ch.band != null) && ch.band < (bandCutoff - 1))) {
            ch = filterChildren(ch, bandCutoff, category);
            if (ch != null) {
              children.push(ch);
            }
          }
        }
        if (children.length !== 0) {
          return {
            'name': node.name,
            'count': node.count,
            'band': node.band,
            'type': node.type,
            'children': children
          };
        }
      })(data, config.opts.hideTermsBand, config.opts.category);
      target = $(this.target).find('.graph');
      target.empty();
      if (data == null) {
        return this.message('Nothing to show. Adjust the filters above to display the graph.');
      }
      params = {
        'termTextBand': config.opts.termTextBand,
        'data': data,
        'width': this.config.width,
        'height': this.config.height,
        'el': target[0]
      };
      switch (config.opts.type) {
        case 'radial':
          graph = new RadialDendrogram(params);
          break;
        case 'tree':
          graph = new TreeDendrogram(params);
      }
      return graph.click(function(type, node) {
        var pq, _ref;
  
        switch (type) {
          case 'hlt':
            if (config.opts.category === 'all') {
              return config.set('category', node);
            } else {
              return config.set('category', 'all');
            }
            break;
          case 'leaf':
            pq = _this.pq.alleles;
            pq.constraints = [];
            pq.constraints.push({
              "path": "Gene.alleles.genotypes.phenotypeTerms.name",
              "op": "=",
              "value": node
            });
            pq.constraints.push({
              "path": "Gene",
              "op": "LOOKUP",
              "value": _this.config.symbol
            });
            if ((_ref = _this.popover) != null) {
              _ref.remove();
            }
            return _this.popover = new PopoverTable({
              'el': target,
              'pq': pq,
              'service': _this.service,
              'template': _this.templates.popover
            });
        }
      });
    };
  
    return Widget;
  
  })();
  
  Config = (function() {
    Config.prototype.opts = {
      'termTextBand': 3,
      'hideTermsBand': 2,
      'type': 'radial',
      'category': 'all'
    };
  
    function Config(template, target) {
      var k, v, _fn, _ref,
        _this = this;
  
      $(target).html(template(this.opts));
      _ref = this.opts;
      _fn = function(k) {
        return $(target).find("." + k + " input").change(function(e) {
          _this.opts[k] = $(e.target).val();
          return _this.fn(_this);
        });
      };
      for (k in _ref) {
        v = _ref[k];
        _fn(k);
      }
    }
  
    Config.prototype.set = function(key, value) {
      this.opts[key] = value;
      return this.fn(this);
    };
  
    Config.prototype.update = function(fn) {
      this.fn = fn;
      return this.fn(this);
    };
  
    return Config;
  
  })();
  
  Dendrogram = (function() {
    function Dendrogram() {}
  
    Dendrogram.prototype.click = function(fn) {
      this.fn = fn;
    };
  
    return Dendrogram;
  
  })();
  
  RadialDendrogram = (function(_super) {
    __extends(RadialDendrogram, _super);
  
    function RadialDendrogram(opts) {
      var arc, cluster, d, depths, diagonal, key, link, links, n, nodes, rx, ry, sort, value, vis, _fn, _i, _j, _len, _len1, _ref,
        _this = this;
  
      assert((opts.width != null) && typeof opts.width === 'number', '`width` is missing and needs to be a number');
      assert((opts.height != null) && typeof opts.height === 'number', '`height` is missing and needs to be a number');
      assert((opts.el != null) && typeof opts.el === 'object', '`el` is missing and needs to be an HTMLDivElement');
      assert(typeof opts.data === 'object', '`data` need to be provided in an Object form, read up on D3.js');
      assert(opts.termTextBand != null, "`termTextBand` representing the node text cutoff not present");
      for (key in opts) {
        value = opts[key];
        this[key] = value;
      }
      rx = this.width / 2;
      ry = this.height / 2;
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
      cluster = d3.layout.cluster().size([360, ry - 100]).sort(sort);
      diagonal = d3.svg.diagonal.radial().projection(function(d) {
        return [d.y, d.x / 180 * Math.PI];
      });
      vis = d3.select(this.el).append("svg:svg").attr("width", this.width).attr("height", this.height).append("svg:g").attr("transform", "translate(" + rx + "," + ry + ")");
      arc = vis.append("svg:path").attr("class", "arc").attr("d", d3.svg.arc().innerRadius(ry - 100).outerRadius(ry - 80).startAngle(0).endAngle(2 * Math.PI));
      nodes = cluster.nodes(this.data);
      links = vis.append("svg:g").attr("class", "links");
      _ref = cluster.links(nodes);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        links.append("svg:path").attr("class", link.target.band != null ? "link band-" + link.target.band : 'link').attr("d", diagonal(link));
      }
      n = vis.append("svg:g").attr("class", "nodes");
      depths = [n.append("svg:g").attr("class", "tier depth-2"), n.append("svg:g").attr("class", "tier depth-1"), n.append("svg:g").attr("class", "tier depth-0")];
      _fn = function(d) {
        var circle, node;
  
        node = depths[Math.abs(d.depth - 2)].append("svg:g").attr("class", d.count != null ? "node depth-" + d.depth + " count-" + d.count : "node depth-" + d.depth).attr("transform", "rotate(" + (d.x - 90) + ")translate(" + d.y + ")");
        circle = node.append("svg:circle").attr("r", Math.abs(d.depth - 6)).attr("class", d.band ? d.type ? "band-" + d.band + " type " + d.type : "band-" + d.band : d.type ? "type " + d.type : void 0);
        circle.on("click", function() {
          if (_this.fn != null) {
            return _this.fn(d.type, d.name);
          }
        });
        node.append("svg:title").text(d.name);
        if ((d.band == null) || d.band > (_this.termTextBand - 2)) {
          return node.append("svg:text").attr("dx", d.x < 180 ? 8 : -8).attr("dy", ".31em").attr("text-anchor", d.x < 180 ? "start" : "end").attr("transform", d.x < 180 ? null : "rotate(180)").text(d.name.length > 50 ? d.name.slice(0, 50) + '...' : d.name);
        }
      };
      for (_j = 0, _len1 = nodes.length; _j < _len1; _j++) {
        d = nodes[_j];
        _fn(d);
      }
    }
  
    return RadialDendrogram;
  
  })(Dendrogram);
  
  TreeDendrogram = (function(_super) {
    __extends(TreeDendrogram, _super);
  
    function TreeDendrogram(opts) {
      var cluster, d, depths, diagonal, key, link, links, n, nodes, sort, value, vis, _fn, _i, _j, _len, _len1, _ref,
        _this = this;
  
      assert((opts.width != null) && typeof opts.width === 'number', '`width` is missing and needs to be a number');
      assert((opts.height != null) && typeof opts.height === 'number', '`height` is missing and needs to be a number');
      assert((opts.el != null) && typeof opts.el === 'object', '`el` is missing and needs to be an HTMLDivElement');
      assert(typeof opts.data === 'object', '`data` need to be provided in an Object form, read up on D3.js');
      assert(opts.termTextBand != null, "`termTextBand` representing the node text cutoff not present");
      for (key in opts) {
        value = opts[key];
        this[key] = value;
      }
      sort = function(a, b) {
        switch (b.depth - a.depth) {
          case -1:
            return -1;
          case 1:
            return 1;
          default:
            if ((a.count != null) && (b.count != null)) {
              return b.count - a.count;
            }
        }
        return 0;
      };
      cluster = d3.layout.cluster().size([this.height, this.width / 2]).sort(sort);
      diagonal = d3.svg.diagonal().projection(function(d) {
        return [d.y, d.x];
      });
      vis = d3.select(this.el).append("svg").attr("width", this.width).attr("height", this.height).append("g").attr("transform", "translate(120, 0)");
      nodes = cluster.nodes(this.data);
      links = vis.append("svg:g").attr("class", "links");
      _ref = cluster.links(nodes);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        links.append("svg:path").attr("class", link.target.band != null ? "link band-" + link.target.band : 'link').attr("d", diagonal(link));
      }
      n = vis.append("svg:g").attr("class", "nodes");
      depths = [n.append("svg:g").attr("class", "tier depth-2"), n.append("svg:g").attr("class", "tier depth-1"), n.append("svg:g").attr("class", "tier depth-0")];
      _fn = function(d) {
        var circle, node;
  
        node = depths[Math.abs(d.depth - 2)].append("svg:g").attr("class", d.count != null ? "node depth-" + d.depth + " count-" + d.count : "node depth-" + d.depth).attr("transform", "translate(" + d.y + "," + d.x + ")");
        circle = node.append("svg:circle").attr("r", Math.abs(d.depth - 6)).attr("class", d.band ? d.type ? "band-" + d.band + " type " + d.type : "band-" + d.band : d.type ? "type " + d.type : void 0);
        circle.on("click", function() {
          if (_this.fn != null) {
            return _this.fn(d.type, d.name);
          }
        });
        node.append("svg:title").text(d.name);
        if ((d.band == null) || d.band > (_this.termTextBand - 2)) {
          return node.append("svg:text").attr("dx", d.children ? -8 : 8).attr("dy", "3").attr("text-anchor", d.children ? "end" : "start").text(d.name.length > 50 ? d.name.slice(0, 50) + '...' : d.name);
        }
      };
      for (_j = 0, _len1 = nodes.length; _j < _len1; _j++) {
        d = nodes[_j];
        _fn(d);
      }
    }
  
    return TreeDendrogram;
  
  })(Dendrogram);
  
  PopoverTable = (function() {
    function PopoverTable(opts) {
      this.remove = __bind(this.remove, this);
      var key, value,
        _this = this;
  
      for (key in opts) {
        value = opts[key];
        this[key] = value;
      }
      this.service.query(this.pq, function(q) {
        return q.rows(function(rows) {
          $(_this.el).append(_this.html = $(_this.template({
            'columns': _this.pq.select,
            'rows': rows,
            titleize: function(text) {
              return text.split('.').pop().replace(/([A-Z])/g, ' $1');
            }
          })));
          return _this.html.find('a.close').click(_this.remove);
        });
      });
    }
  
    PopoverTable.prototype.remove = function() {
      var _ref;
  
      return (_ref = this.html) != null ? _ref.remove() : void 0;
    };
  
    return PopoverTable;
  
  })();
  
  /**#@+ the config */
  var config = #@+CONFIG;

  /**#@+ the templates */
  var templates = {};
  templates.popover=function(e){e||(e={});var n,t=[],s=function(e){return e&&e.ecoSafe?e:e!==void 0&&null!=e?r(e):""},a=e.safe,r=e.escape;return n=e.safe=function(e){if(e&&e.ecoSafe)return e;(void 0===e||null==e)&&(e="");var n=new String(e);return n.ecoSafe=!0,n},r||(r=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){var e,n,a,r,i,o,l,c,p,u,d;for(t.push('<div class="popover">\n    <a class="close">close</a>\n    <div class="inner">\n        <table>\n            <thead>\n                <tr>\n                    '),u=this.columns,r=0,l=u.length;l>r;r++)e=u[r],t.push('\n                        <th title="'),t.push(s(e)),t.push('">'),t.push(s(this.titleize(e))),t.push("</th>\n                    ");for(t.push("\n                </tr>\n            </thead>\n            <tbody>\n                "),d=this.rows,i=0,c=d.length;c>i;i++){for(n=d[i],t.push("\n                    <tr>\n                        "),o=0,p=n.length;p>o;o++)a=n[o],t.push("\n                            <td>"),t.push(s(a)),t.push("</td>\n                        ");t.push("\n                    </tr>\n                ")}t.push("\n            </tbody>\n        </table>\n    </div>\n</div>")}).call(this)}.call(e),e.safe=a,e.escape=r,t.join("")};;
  templates.config=function(e){e||(e={});var n,t=[],a=function(e){return e&&e.ecoSafe?e:e!==void 0&&null!=e?r(e):""},s=e.safe,r=e.escape;return n=e.safe=function(e){if(e&&e.ecoSafe)return e;(void 0===e||null==e)&&(e="");var n=new String(e);return n.ecoSafe=!0,n},r||(r=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<div class="hideTermsBand">\n    Term cutoff\n    <input type="range" min="1" max="5" step="1" value="'),t.push(a(this.hideTermsBand)),t.push('" />\n</div>\n\n<div class="termTextBand">\n    Term text cutoff\n    <input type="range" min="1" max="5" step="1" value="'),t.push(a(this.termTextBand)),t.push('" />\n</div>\n\n<div class="type">\n    Use a radial\n    <input type="radio" name="type" value="radial" checked="checked">\n    or a tree\n    <input type="radio" name="type" value="tree">\n    dendrogram\n</div>')}).call(this)}.call(e),e.safe=s,e.escape=r,t.join("")};;
  templates.widget=function(e){e||(e={});var n,t=[],a=function(e){return e&&e.ecoSafe?e:e!==void 0&&null!=e?r(e):""},s=e.safe,r=e.escape;return n=e.safe=function(e){if(e&&e.ecoSafe)return e;(void 0===e||null==e)&&(e="");var n=new String(e);return n.ecoSafe=!0,n},r||(r=e.escape=function(e){return(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}),function(){(function(){t.push('<h4>Alleles phenotype terms for</h4> <input type="text" placeholder="MGI:97747" class="symbol three columns" value="'),t.push(a(this.symbol)),t.push('" />\n<div style="clear:both"></div>\n<div class="config">Loading &hellip;</div>\n<div class="graph"></div>')}).call(this)}.call(e),e.safe=s,e.escape=r,t.join("")};;

  /**#@+ css */
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'div#w#@+CALLBACK h4{float:left}div#w#@+CALLBACK input.symbol{color:#8e0022;background:0;border:0;font-family:\'Droid Serif\',serif;font-size:23px;font-weight:700;padding:0;margin:10px 0;margin-left:4px;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none}div#w#@+CALLBACK article{position:relative}div#w#@+CALLBACK .graph{float:left}div#w#@+CALLBACK path.arc{fill:#fff}div#w#@+CALLBACK .node.depth-0{font-size:18px}div#w#@+CALLBACK .node.depth-1{font-size:14px}div#w#@+CALLBACK .node.depth-2{font-size:10px}div#w#@+CALLBACK circle.hlt,div#w#@+CALLBACK circle.leaf{cursor:pointer}div#w#@+CALLBACK .node circle{fill:#fff;stroke:#ccc;stroke-width:1.5px}div#w#@+CALLBACK .node.depth-2 circle{stroke:#fee5d9;fill:#fee5d9}div#w#@+CALLBACK .node circle.band-1{stroke:#fcae91;fill:#fcae91}div#w#@+CALLBACK .node circle.band-2{stroke:#fb6a4a;fill:#fb6a4a}div#w#@+CALLBACK .node circle.band-3{stroke:#de2d26;fill:#de2d26}div#w#@+CALLBACK .node circle.band-4{stroke:#a50f15;fill:#a50f15}div#w#@+CALLBACK .link{fill:none;stroke:#ccc;stroke-width:1px}div#w#@+CALLBACK .link.band-0{stroke:#fee5d9}div#w#@+CALLBACK .link.band-1{stroke:#fcae91}div#w#@+CALLBACK .link.band-2{stroke:#fb6a4a}div#w#@+CALLBACK .link.band-3{stroke:#de2d26}div#w#@+CALLBACK .link.band-4{stroke:#a50f15}div#w#@+CALLBACK .config{background:#fff;padding:20px;box-shadow:0 0 10px #ccc;width:170px;float:left}div#w#@+CALLBACK .config>div{margin:0}div#w#@+CALLBACK .config>div:not(:last-child){margin-bottom:10px}div#w#@+CALLBACK .alert-box{margin-top:10px}div#w#@+CALLBACK .popover{position:absolute;top:0;left:0;z-index:1;width:100%}div#w#@+CALLBACK .popover .inner{max-height:300px;overflow-y:auto;clear:both;box-shadow:0 0 10px #ccc}div#w#@+CALLBACK .popover a.close{float:right;font-weight:700}div#w#@+CALLBACK .popover table{margin:0}div#w#@+CALLBACK .popover table th{text-transform:capitalize}';
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
  clazz = #@+CLASSEXPR;
  root.intermine.temp.widgets['#@+CALLBACK'] = [clazz, config, templates];


}).call(this);