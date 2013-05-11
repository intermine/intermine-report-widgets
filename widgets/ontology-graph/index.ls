/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */

{Service} = intermine

# The Service#rows function
{rows, query} = new Service root: 'www.flymine.org/query'

interop =
    * taxonId: 4932
      root: \yeastmine-test.yeastgenome.org/yeastmine-dev
      name: \SGD
    * taxonId: 10090
      root: \http://beta.mousemine.org/mousemine
      name: \MGI
    * taxonId: 6239
      root: \http://intermine.modencode.org/release-32
      name: \modMine

interop-later-maybe-when-they-upgrade =
    * taxonId: 7955
      root: \zmine.zfin.org/zebrafishmine
      name: \ZFin
    * taxonId: 10116
      root: \http://ratmine.mcw.edu/ratmine
      name: \RGD

non-curated-evidence-codes = <[ IBA IBD IEA IGC IKR ISA ISO ISS RCA ]>

node-padding = 10

min-ticks = 20

link-opacity =
    normal: 0.6
    muted: 0.3
    focus: 0.8
    unfocus: 0.2

objectify = (key, value, list) --> list |> list-to-obj << map (-> [(key it), (value it)])

error = (msg) -> $.Deferred -> @reject msg

# Two reasons: a) alert needs wrapping to prevent rebinding of this, and b) we can swap
# out alert for a better notification system later.
notify = -> alert it

fail-when-empty = (msg, promise) --> promise.then -> if empty it then error msg else it

# Simple alias that makes for cleaner fmapping
do-to = (f, x) -> f x
any-test = (tests, x) --> any (`do-to` x), tests

interop-mines = objectify (.taxon-id), (({root, name}) -> (<<< {name}) new Service {root}), interop

# Get the ontology terms for a gene.
direct-terms = ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: {symbol: [it]}

get-homology-where-clause = (genes) ->
    primaryIdentifier: genes
    'goAnnotation.evidence.code.code': {'NONE OF': non-curated-evidence-codes}

direct-homology-terms = (genes) ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: get-homology-where-clause genes

all-go-terms = (symbol) ->
    name: \ALL-TERMS
    select: <[ goAnnotation.ontologyTerm.identifier goAnnotation.ontologyTerm.parents.identifier ]>
    from: \Gene
    where: {symbol}

flatten = concat-map id

flat-rows = (get-rows, q) --> get-rows(q).then unique . flatten

#all-homology-terms = (genes) -> all-go-terms! |> (<<< where: get-homology-where-clause genes)
all-homology-terms = (children) ->
    name: \ALL-HOMOLOGY
    select: <[ parents.identifier ]>
    from: \OntologyTerm
    where: {identifier:children}

whole-graph-q = (terms) ->
    name: \EDGES
    select: <[ childTerm.identifier relationship parentTerm.identifier ]>
    from: \OntologyRelation
    where:
        'childTerm.identifier': terms
        direct: \true

count-query = (terms) ->
    select: <[ symbol ]>
    from: \Gene
    where:
        'goAnnotation.ontologyTerm.parents.identifier': terms

homologue-query = (symbol, targetOrganism) -->
  select: <[ homologues.homologue.primaryIdentifier ]>
  from: \Gene
  where:
    symbol: [symbol]
    "homologues.homologue.organism.taxonId": targetOrganism

#'relations.relationship': \is_a

class Node
    (@label, @id, @description, origin, syms) ~>
        @counts = []
        @sources = [origin]
        @symbols = syms.slice!
        @edges = []
        @depths = []

    marked: false
    muted: false
    is-leaf: false
    is-root: false
    is-direct: false

    radius: ->
        k = 5
        count-portion = if empty @counts then 0 else 1.5 * ln sum @counts
        marked-fac = if @marked then 2 else 1
        (k + count-portion) * marked-fac

    add-count: (c) -> @counts.push c if c?

new-node = (src, syms, id, label, desc) --> Node label, id, desc, src, syms

# Get all the names for our ontology terms in one fell swoop, and build a mapping.
fetch-names = (source, get-rows, symbols, identifier) -->
    q =
        select: <[ identifier name description ]>
        from: \OntologyTerm
        where: {identifier}

    node = new-node source, symbols

    get-rows(q).then objectify (.0), (-> node ...it)

do-line = d3.svg.line!
        .x (.x)
        .y (.y)
        .interpolate \basis

calculate-spline = (dir, {source: {dagre:source}, target:{dagre:target}, dagre: {points}}) -->
    p0 =
        | dir is \LR => x: (source.x + source.width / 2), y: source.y
        | otherwise => x: target.x, y: (target.y + 10px + target.height / 2)
    pN =
        | dir is \LR => x: (target.x - 15px - target.width / 2), y: target.y
        | otherwise => x: source.x, y: (source.y - source.height / 2)
    ps = [p0] ++ points ++ [pN]

    do-line if dir is \LR then ps else reverse ps

translate-edge = (svg, e, dx, dy) -->
    for p in e.dagre.points
        p.x = p.x + dx
        p.y = p.y + dy

get-node-drag-pos = (pos-prop) -> -> d3.event[pos-prop]

to-node-id = (\node +) << (.replace /:/g, \_) << (.id)

add-labels = (selection) ->

    label-g = selection.append \g
        ..attr \class, \label
        ..append \rect
        ..append \text

    label-g.each (d) ->
        d.bbox = @getBBox!
        if d.label?.length
            d.width = d.bbox.width + 2 * node-padding
            d.height = d.bbox.height + 2 * node-padding
        else
            d.width = d.height = 0

    label-g.select \text
        .attr \text-anchor, \left
        .append \tspan
            .attr \dy, \1em
            .text (.label)

    label-g #.select \rect
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)

    label-g.attr \transform, ({dagre: {points}}) ->
        x = mean map (.x), points
        y = mean map (.y), points
        "translate(#{ x },#{ y })"

!function mv-towards how-much, goal, n
    scale = (* how-much)
    dx = scale goal.x - n.x
    dy = scale goal.y - n.y
    n.x += dx
    n.y += dy

mark-reachable = (node) ->
    node.is-focus = true
    queue = [node]
    moar = (n) -> reject (is n), map (.target), n.edges
    while n = queue.shift!
        n.marked = true
        each queue~push, moar n

unmark = (nodes) ->
    for n in nodes
        n.marked = false
        n.is-reachable = false
        n.is-focus = false
        n.is-source = false
        n.is-target = false

only-marked = (nodes, edges) ->
    nodes: filter (.marked), nodes
    edges: filter (.marked) << (.source), edges

# Roots are those nodes that only have edges coming in, not going out.
find-roots = ({nodes}) -> [n for n in nodes when all ((is n) << (.source)), n.edges]

grow-tree = ({id, label, edges}) ->
    tn = {id, label, children: []}
    tn.node-type = \root
    for e in reject ((is id) << (.id) << (.target)), edges
        branch = grow-tree e.target
            ..node-type = \branch
            ..parent = tn
            ..relationship = e.label
        tn.children.push branch
    return tn

all-children = (tree) ->
    children = {}
    queue = [tree]
    while c = queue.shift!
        children[c.id] ?= c
        for gc in c.children
            queue.push gc
    return values children

function mark-subtree root, prop, val
    queue = [root]
    moar = ({edges}) -> map (.source), edges |> reject (is val) << (.[prop])
    while n = queue.shift!
        n[prop] = val
        each queue~push, moar n
    root

relationship-palette = d3.scale.category10!
link-fill = relationship-palette << (.label)
link-stroke = (.darker!) << d3~rgb << link-fill

brighten = (.brighter!) << (d3~rgb)
darken = (.darker!) << (d3~rgb)

term-palette = darken << d3~rgb << d3.scale.category20!
term-color = term-palette << (join \-) << (.sources) #(.id) << (.root)

BRIGHTEN = brighten << brighten

is-root = (.is-root)
is-leaf = (.is-leaf)
get-r = (.radius!)

link-distance = ({source, target}) ->
    ns = [source, target]
    edges = sum map (-> it.edges?.length or 0), ns
    marked-bump = 50 * length filter (.marked), ns
    muted-penalty = if (any (.muted), ns) then 100 else 0
    radii = sum map get-r, ns
    (3 * edges) + radii + 50 + marked-bump - muted-penalty

get-charge = (d) ->
    radius = get-r d
    root-bump = if is-root d then 150 else 0
    edge-bump = 10 * d.edges.length
    marked-bump = if d.marked then 2 else 1
    jiggle-bump = if query-params.jiggle is \strata then 20 else 0
    k = 250
    1 - (k + radius + root-bump + edge-bump) * marked-bump

mark-depth = (node, depth-at-node, max-depth) ->
    node.depths.push depth-at-node
    next-depth = depth-at-node + 1
    return if next-depth > max-depth
    for target in map (.target), node.edges when node isnt target
        mark-depth target, next-depth, max-depth

annotate-for-height = (nodes, level = 50) ->
    leaves = filter (.is-direct), nodes
    for leaf in leaves
        mark-depth leaf, 0, level
    each (-> it <<< steps-from-leaf: minimum it.depths), nodes


#console.log list-to-obj [["#{ node.id }: #{ node.label }", node.steps-from-leaf] for node in graph.nodes]

trim-graph-to-height = ({nodes, edges}, level) ->
    return {nodes, edges} unless level

    console.log "Trimming graph to #{ level }"

    at-or-below-height = (.steps-from-leaf) >> (<= level)
    acceptable = any-test [is-root, at-or-below-height]

    filtered =
        nodes: filter acceptable, nodes
        edges: filter (-> all acceptable, [it.source, it.target]), edges

    for n in filtered.nodes when (not n.is-root) and any (not) . acceptable, map (.target), n.edges
        elision = {source: n, target: n.root, label: \elision}
        filtered.edges.push elision

    console.log "Down to #{ length filtered.edges }, #{ (.to-fixed 2) filtered.edges.length / edges.length * 100 }% of the original number of edges"

    return filtered

set-into = (m, k, v) -> m <<< list-to-obj [ [k, v] ]

cache-func = ([mapping, key-func = id]) -> (obj-to-func mapping) << key-func

merge-graphs = (left, right) -->
    console.log "Starting with #{ length left.nodes} nodes and #{ length left.edges } edges"
    console.log "Currently there are #{ length filter (.is-direct), left.nodes } direct nodes"

    e-key = (e) -> e.source.id + e.label + e.target.id
    add-node-to-mapping = (m, n) -> if m[n.id] then m else set-into m, n.id, n
    add-edge-to-mapping = (m, e) ->
        key = e-key e
        if m[key] then m else set-into m, key, e

    [nodes-by-id, edges-by-key] = [ fold f, {}, concat-map attr, [left, right] for [f, attr]
        in [ [add-node-to-mapping, (.nodes)], [add-edge-to-mapping, (.edges)] ] ]
    [real-nodes, real-edges] = map cache-func, [[nodes-by-id, (.id)], [edges-by-key, e-key]]

    # Merge in properties of nodes that exist in both graphs,
    for [n, real] in zip right.nodes, map real-nodes, right.nodes
        if n is real
            real.root = real-nodes real.root
            real.edges = map real-edges, real.edges
        else
            real.sources .= concat n.sources
            real.symbols .= concat n.symbols
            real.is-direct or= n.is-direct
            real.edges = unique(real.edges ++ map real-edges, n.edges)

    # Ensure that new edges refer to nodes in the real graph.
    for [e, real] in zip right.edges, map real-edges, right.edges when e is real
        [source, target] = map real-nodes << (-> it e), [(.source), (.target)]
        e <<< {source, target}

    ret = {nodes: (values nodes-by-id), edges: (values edges-by-key)}
    annotate-for-height ret.nodes

    console.log "Merged graph has #{ length ret.nodes} nodes and #{ length ret.edges } edges"
    console.log "now there are #{ length filter (.is-direct), ret.nodes } direct nodes"
    for n in ret.nodes when n.is-direct and n.sources.length is 1
        console.log "#{ n.id }:#{ n.label } (#{ n.root.label }) is from #{ n.sources }"
    console.log "There are #{ length filter (> 1) . (.length) . (.sources), ret.nodes } merged nodes"
    return ret

edge-to-nodes = ({source, target}) -> [source, target]

annotate-for-counts = (make-query, nodes) ->
    making-q = make-query count-query map (.id), nodes
    summarising = making-q
        .then (.summarise \goAnnotation.ontologyTerm.parents.identifier)
        .then objectify (.item), (.count)

    summarising.done (summary) -> each (-> it.add-count summary[it.id]), nodes

class GraphState extends Backbone.Model

    initialize: ->
        @on 'annotated:height change:elision change:root change:all', @~update-graph
        @update-graph!

    update-graph: ->
        level = @get \elision
        current-root = @get \root
        {nodes:all-nodes, edges:all-edges} = @get \all
        nodes =
            | current-root => filter (is current-root) << (.root), all-nodes
            | otherwise => all-nodes.slice!
        edges =
            | current-root => filter (is current-root) << (.root) << (.target), all-edges
            | otherwise => all-edges.slice!
        graph =
            | level and any (.steps-from-leaf), nodes => trim-graph-to-height {nodes, edges}, level
            | otherwise => {nodes, edges}
        @set {graph}

# Take a set of promises, and report the proportion (as a number 0 .. 1)
# of them that are completed, when they each finish, and report
# that all are complete (ie. 1) if any of them fail.
monitor-progress = (report, stages) -->
    n-stages = stages.length
    complete = 0
    stage-complete = -> report ++complete / n-stages
    on-error = -> report 1

    report complete
    each (.done stage-complete), stages
    each (.fail on-error), stages

progress-monitor = (selector) ->
    $progress = $ selector
    monitor-progress (progress) ->
        $progress.find(\.meter).css \width, "#{ progress * 100}%"
        $progress.toggle progress < 1

draw =  (graph) -> #direct-nodes, edges, node-for-ident, symbol) ->

    symbol = head unique concat-map (.symbols), graph.nodes

    state = new GraphState {
        view: (query-params.view or \dag)
        small-graph-threshold: 20
        animating: \waiting
        root: null
        symbol: symbol,
        jiggle: (query-params.jiggle) #or \centre)
        spline: (query-params.spline or \curved)
        dag-direction: \LR
        all: graph
        maxmarked: 20
        zoom: 1
        tick-k: min-ticks
        translate: [5, 5]
        dimensions: {w: $(\body).width!, h: $(\body).height!}
        elision: if query-params.elision then +query-params.elision else null
        relationships: (sort unique map (.label), graph.edges) ++ [\elision]
    }
    window.GRAPH = state # just fro testing, TODO remove TODO

    new-graph = graphify (progress-monitor '#dag .progress'), rows

    # Rerender with new value.
    $ \.button.symbol .on \click, ->
        new-symbol = $(\input.symbol).val!
        new-graph new-symbol
            .fail notify
            .done ({nodes}) -> annotate-for-counts query, nodes
            .done ({nodes}) -> do-height-annotation
            .done -> state.set \symbol, new-symbol
            .done state.set \all, _
            .done (.nodes) >> (filter is-root) >> head >> (state.set \root, _)

    $ \.graph-control
        .show!
        .on \submit, -> it.prevent-default!
        .find \.resizer .click ->
            $(@).toggle-class 'icon-resize-small icon-resize-full'
                .siblings \.hidable .slide-toggle!

    $ \#jiggle
        .val state.get \jiggle
        .on \change, -> state.set \jiggle, $(@).val!

    switches =
        '#switch-view-dag': {view: \dag}
        '#switch-view-force': {view: \force}
        '#switch-orient-lr': {dagDirection: \LR}
        '#switch-orient-tb': {dagDirection: \TB}

    for selector, state-args of switches
        let args = state-args
            $(selector).change -> state.set args if $(@).is \:checked

    $ \#min-ticks
        .val state.get \tickK
        .change -> state.set tick-k: $(@).val!

    state.on \change:tickK, flip $(\#min-ticks)~val

    state.on \change:jiggle, flip $(\#jiggle)~val

    $ \#spline
        .val state.get \spline
        .on \change, -> state.set \spline, $(@).val!

    state.on \change:spline, flip $(\#spline)~val

    $ \#force-reset
        .on \click, -> state.trigger \graph:reset
    state.on \graph:reset, -> unmark state.get(\graph).nodes

    root-selector = $ \#graph-root
        ..on \change, !->
            set-root = state.set \root, _
            {nodes} = state.get \all
            root-id = $(@).val!
            root-node = find (is root-id) << (.id), nodes
            set-root root-node

    state.on \change:root, (s, root) ->
        | root => root-selector.val root.id
        | otherwise => root-selector.val \null

    elision-selector = $ \#elision
        ..on \change, -> state.set \elision, parse-int $(@).val!, 10

    state.on \change:elision, flip elision-selector~val

    # Do initial graph analysis
    annotate-for-counts query, graph.nodes
    do-height-annotation graph.nodes

    # Do initial ontology set up
    set-up-ontology-table!
    set-up-interop!

    state.on 'graph:marked graph:reset', show-ontology-table

    render = ->
        | state.get(\view) is \force => render-force ...
        | otherwise => render-dag ...

    state.on \change:graph, -> set-timeout (-> render state, state.get \graph), 0
    state.on 'change:view change:dagDirection', -> set-timeout (-> render state, state.get \graph), 0

    state.on \controls:changed -> $ document .foundation!

    roots = filter is-root, graph.nodes

    for r in roots ++ [ { id: \null, label:"All" } ]
        root-selector.append """<option value="#{ r.id }">#{ r.label }</option>"""
    state.trigger \controls:changed

    if query-params.all-roots
        render state, state.get \graph
    else
        state.set \root, head roots

    state.on 'change:homologueProgress', (s, progress) ->
        $('#homologue-progress .meter').css \width, "#{ progress * 100}%"
        $('#homologue-progress').toggle progress < 1

    function do-height-annotation nodes
        # A bit computationally expensive, especially for large graphs, so
        # defer this into another tick.
        set-timeout ( ->
            annotate-for-height nodes
            heights = sort unique map (.steps-from-leaf), nodes
            elision-selector.empty!

            for h in heights
                text = switch h
                    | 0 => "Show all terms"
                    | 1 => "Show only direct parents of annotations, and the root term"
                    | otherwise => "show all terms within #{ h } steps of a directly annotated term"
                elision-selector.append """<option value="#{ h }">#{ text }</option>"""

            state.trigger \controls:changed
            if level = state.get \elision
                elision-selector.val level
                state.trigger \annotated:height
        ), 0

    function set-up-interop
        $ul = $ \#interop-sources
        to-option = (group) ->
            $li = $ """
                <li><a href="#" class="small button">#{ group.name }</a></li>
            """
            $li.find(\a).on \click, ->
                $this = $ @
                return if $this.has-class \disabled
                $this.add-class \disabled
                add-homologues group.taxon-id

        each $ul~append, map to-option, interop

    monitor-homologue-progress = monitor-progress state.set \homologueProgress, _

    function add-homologues source

        service = interop-mines[source]
        rs = flat-rows service~rows
        merge-graph = merge-graphs state.get \all

        getting-homologues = homologue-query state.get(\symbol), source
            |> flat-rows rows
            |> fail-when-empty "No homologues found"

        getting-direct = getting-homologues.then rs . direct-homology-terms
        getting-all = getting-direct.then rs . all-homology-terms
        getting-names = $.when getting-homologues, getting-all
            .then fetch-names service.name, service~rows
        getting-edges = getting-all
            .then service~rows . whole-graph-q
            .then map row-to-node

        monitor-homologue-progress [getting-homologues, getting-direct, getting-all, getting-names, getting-edges]

        $.when getting-direct, getting-edges, getting-names
            .then make-graph >> merge-graph
            .fail notify
            .done (merged) ->
                state.set \all, merged
                annotate-for-counts service~query, merged.nodes

    function set-up-ontology-table
        {w, h} = state.get \dimensions
        get-left = (is-open) ->
            | is-open => w - 50
            | otherwise => w - 50 - $('#ontology-table .section-container').outer-width!
        table = $ \#ontology-table
            ..css top: (0.05 * h), left: (get-left true), height: (0.9 * h), width: (0.6 * w)

        table.find \.slide-control
            .on \click, ->
                was-open = table.has-class \open
                table.toggle-class \open .animate left: get-left was-open
                icon = $ \i, @
                    ..remove-class 'icon-chevron-right icon-chevron-left'
                    ..add-class if was-open then \icon-chevron-left else \icon-chevron-right

        $ \#ontology-table
            .find \table
                .add-class \tablesorter
                .tablesorter!

    function show-ontology-table
        {w, h} = state.get \dimensions
        marked-statements = state.get \graph |> (.edges) |> filter (.marked) . (.source)
        evt = \relationship:highlight
        link-row = (link) ->
            $row = $ """
                <tr>
                    <td>#{ link.source.id }: #{ link.source.label }</td>
                    <td>#{ link.label }</td>
                    <td>#{ link.target.id}: #{ link.target.label }</td>
                </tr>
            """
            $row.on \mouseout, -> $row.toggle-class(\highlit, false); state.trigger evt, null
                .on \mouseover, -> $row.toggle-class(\highlit, true); state.trigger evt, link

        term-row = ({id, label, description, counts, sources, symbols}:term) ->
            $row = $ """
                <tr>
                    <td>#{ id }</td>
                    <td>#{ label }</td>
                    <td>#{ description }</td>
                    <td>#{ sum counts }</td>
                    <td>#{ join ', ', sources }</td>
                    <td>#{ join ', ', symbols }</td>
                </tr>
            """
            $row.on \mouseout, -> $row.toggle-class(\highlit, false); state.trigger \term:highlight, null
                .on \mouseover, -> $row.toggle-class(\highlit, true); state.trigger \term:highlight, term

        $stm-tbl = $ '#ontology-table .marked-statements'
            ..find \tbody .empty!
        $trm-tbl =  $ '#ontology-table .marked-terms'
            ..find \tbody .empty!

        each $stm-tbl~append << link-row, marked-statements
        each $trm-tbl~append << term-row, unique concat-map edge-to-nodes, marked-statements

        $ \#ontology-table
            .toggle marked-statements.length > 0
            .foundation \section, \reflow
            .find \table
                .trigger \update

# The following would make good tests...
#console.log fold ((m, depth) -> m[depth] = (m[depth] or 0) + 1; m), {}, map minimum << (.depths), graph.nodes

draw-pause-btn = (dimensions, state, svg) -->
    [cx, cy] = map (* 0.9), [dimensions.w, dimensions.h]
    radius = 0.075 * dimensions.h
    [x, y] = map (- radius), [cx, cy]

    svg.select-all \g.btn .remove!

    btn = svg.append \g
        .attr \class, \btn
        .attr \x, x
        .attr \y, y

    btn.append \circle
        .attr \r, radius
        .attr \cx, cx
        .attr \cy, cy
        .attr \stroke, \black
        .attr \stroke-width, 5px
        .attr \fill \#ccc
        .attr \opacity, 0.2

    draw-pause-bars = ->

        btn.select-all(\path.play-symbol).remove!

        pause-bar =
            width: 0.025 * dimensions.h
            height: 0.08 * dimensions.h

        for f in [-1.2, 0.2]
            btn.append \rect
                .attr \class, \pause-bar
                .attr \width, pause-bar.width
                .attr \x, cx + f * pause-bar.width
                .attr \height, pause-bar.height
                .attr \y, cy - pause-bar.height /2
                .attr \fill, \#555
                .attr \opacity, 0.2


    symbol-line = d3.svg.line!
        .x ([r, a]) -> cx + r * cos a
        .y ([r, a]) -> cy + r * sin a
        .interpolate \linear

    to-radians = (* Math.PI / 180)

    draw-play-symbol = ->

        btn.select-all(\.pause-bar).remove!

        inner-r = 0.75 * radius

        points = [ [inner-r, to-radians angle] for angle in [0, 120, 240] ]

        btn.append \path
            .attr \class, \play-symbol
            .attr \fill, \#555
            .attr \opacity, 0.2
            .attr \d, (+ \Z) symbol-line points

    draw-play-symbol!

    state.on \change:animating, (s, currently) -> switch currently
        | \paused => draw-play-symbol!
        | \running => draw-pause-bars!

    btn.on \click, -> switch state.get \animating
        | \paused => state.set animating: \running
        | \running => state.set animating: \paused

draw-source-legend = (state, palette, svg) -->
    dimensions = state.get \dimensions
    {nodes} = state.get \graph
    height = 50
    padding = 25
    width = if dimensions.h > dimensions.w then (dimensions.w - padding * 2) / relationships.length else 180
    sources = unique map (join \-) << (.sources), nodes

    [get-x, get-y] = [(flip -> padding + width * it), (-> padding + height)]

    source-g = svg.select-all \g.source-legend
        .data sources

    sg = source-g.enter!
        .append \g
        .attr \class, \source-legend
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .on \mouseover, (d, i) ->
            state.trigger \source:highlight, d
            d3.select(@).select-all(\rect).attr \fill, brighten . palette
        .on \mouseout, ->
            state.trigger \source:highlight, null
            d3.select(@).select-all(\rect).attr \fill, palette

    source-g.exit!remove!

    sg.append \rect
        .attr \opacity, 0.6
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .attr \fill, palette

    sg.append \text
        .attr \x, get-x
        .attr \y, get-y
        .attr \dy, height / 2
        .attr \dx, \0.5em
        .text id

draw-relationship-legend = (state, palette, svg) -->
    {dimensions, relationships} = state.toJSON!
    height = 50
    padding = 25
    width = if dimensions.h > dimensions.w then (dimensions.w - padding * 2) / relationships.length else 180

    [get-x, get-y] = [(flip -> padding + width * it), (-> padding)]
    #   | dimensions.h > dimensions.w => [(flip -> padding + width * it), (-> padding)]
    #   | otherwise => [ (-> padding), (flip -> padding + height * it)]

    legend = svg.select-all \g.legend
        .data relationships

    lg = legend.enter!
        .append \g
        .attr \class, \legend
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .on \mouseover, (d, i) ->
            state.trigger \relationship:highlight, d
            d3.select(@).select-all(\rect).attr \fill, brighten . palette
        .on \mouseout, ->
            state.trigger \relationship:highlight, null
            d3.select(@).select-all(\rect).attr \fill, palette
        .on \click, (rel) ->
            for e in state.get(\all).edges when e.label is rel
                for n in [e.source, e.target]
                    n.marked = true
            state.trigger \nodes:marked
    legend.exit!remove!

    lg.append \rect
        .attr \opacity, 0.6
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .attr \fill, palette

    lg.append \text
        .attr \x, get-x
        .attr \y, get-y
        .attr \dy, height / 2
        .attr \dx, \0.5em
        .text id

link-spline = (offset-scale, args) -->
    [source, target, line-length, end-point, radius-s, cos90, sin90] = args
    mean-x = mean map (.x), [source, target]
    mean-y = mean map (.y), [source, target]

    offset = (offset-scale * line-length) - (radius-s / 4)

    mp1-x = mean-x + offset * cos90
    mp1-y = mean-y + offset * sin90
    mp2-x = mean-x + offset * cos90
    mp2-y = mean-y + offset * sin90

    [
        [(source.x - radius-s * 0.9 * cos90), (source.y - radius-s * 0.9 * sin90)],
        [mp2-x, mp2-y],
        end-point,
        end-point,
        [mp1-x, mp1-y],
        [(source.x + radius-s * 0.9 * cos90), (source.y + radius-s * 0.9 * sin90)]
    ]

# http://bl.ocks.org/sboak/2942559
# http://bl.ocks.org/sboak/2942556
draw-curve = let line = d3.svg.line!interpolate \basis
    ({target, source}) ->
        {cos, sin, sqrt, atan2, pow, PI} = Math
        slope = atan2 (target.y - source.y), (target.x - source.x)
        [sin-s, cos-s] = map (-> it slope), [sin, cos]
        slope-plus90 = PI / 2 + slope
        [sin90, cos90] = map (-> it slope-plus90), [sin, cos]

        [radius-t, radius-s] = map get-r, [target, source]

        line-length = sqrt pow(target.x - source.x, 2) + pow(target.y - source.y, 2)
        end-point = [(target.x - radius-t * 0.9 * cos-s), (target.y - radius-t * 0.9 * sin-s)]

        args = [source, target, line-length, end-point, radius-s, cos90, sin90]

        args |> link-spline 0.1 |> line |> (+ \Z)

stratify = let sort-x = sort-by compare (.x)
    (state) ->
        {dimensions, graph, zoom} = state.toJSON!
        current-font-size = Math.min 40, 20 / zoom
        roots = sort-x filter is-root, graph.nodes
        leaves = sort-x filter (-> it.is-direct and it.is-leaf), graph.nodes
        surface = fold min, 0, map (.y), graph.nodes
        width-range = d3.scale.linear!
            .range [0.1 * dimensions.w, 0.9 * dimensions.w]
            .domain [0, leaves.length - 1]

        corners = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [0, dimensions.w]
        quantile =
            | not roots.length => -> dimensions.w / 2
            | otherwise =>
                d3.scale.quantile!
                    .domain [0, dimensions.w]
                    .range [0 til roots.length]

        roots.for-each (root, i) ->
            root.fixed = false
            mv-towards 0.01, {y: (surface - get-r root), x: root.x}, root #width-range i}, root

        for n in graph.nodes when (not n.is-root) and (n.y + get-r n) < surface
            mv-towards 0.001, {x: n.root.x, y: dimensions.h}, n

        leaves.for-each (n, i) ->
            speed = if n.y < (dimensions.h / 2) then 0.05 else 0.005
            if n.y < dimensions.h * 0.9
                mv-towards speed, {x: (width-range i), y: dimensions.h * 0.9}, n
            if n.y >= dimensions.h * 0.85
                n.y = dimensions.h * 0.9 + (current-font-size * 1.1 * i)

centrify = (state) ->
    {graph, dimensions} = state.toJSON!
    roots = sort-by (compare (.y)), filter is-root, graph.nodes
    mean-d = mean map (* 2) << get-r, roots
    half = (/ 2)

    # Put root nodes under a centripetal force.
    if roots.length is 1
        roots[0] <<< {x: (half dimensions.w), y: (half dimensions.h), fixed: true}
    else
        roots.for-each !(n, i) ->
            goal =
                x: half dimensions.w
                y: (half dimensions.h) - (mean-d * roots.length / 2) + (mean-d * i)
            mv-towards 0.05, goal, n

    # Put leaf nodes under a centrifugal force. Must be very faint to avoid reaching terminal
    # velocity.
    centre =
        x: half dimensions.w
        y: half dimensions.h
    max-h = maximum map (.steps-from-leaf), graph.nodes
    for leaf in graph.nodes when not is-root leaf
        base-speed = -0.0003
        speed =
            | leaf.is-leaf => base-speed
            | max-h => base-speed * (1 - leaf.steps-from-leaf * 1 / max-h)
            | otherwise => 0
        mv-towards speed, centre, leaf

unfix = !(state) -> state.get \graph |> (.nodes) |> filter is-root |> each (<<< fixed: false)

relationship-test = (link, def-val, x) -->
    | link and link.label => link is x
    | link                => link is x.label
    | otherwise           => def-val

colour-filter = (test, x) --> if test x then brighten else id

draw-root-labels = (graph, dimensions, svg) -->
    let roots = filter is-root, graph.nodes
        if roots.length is 1
            parts = roots[0].label.split \_
            root-g = svg.append \g
                .attr \class, \root-label
            root-label = root-g.append \text
                .attr \x, 0
                .attr \y, 0
                .attr \font-size, 0.2 * dimensions.h
                .attr \opacity, 0.05
            for word, i in parts
                root-label.append \tspan
                    .text word
                    .attr \x, 0
                    .attr \dx, \0.3em
                    .attr \dy, if i then \1em else 0

            {width:text-width, height: text-height} = root-label.node!getBBox!
            tx = dimensions.w - 1.1 * text-width
            ty = 60 + text-height / 2
            root-g.attr \transform, "translate(#{ tx },#{ ty })"

render-force = (state, graph) ->

    if graph.edges.length > 250 and not state.has(\elision)
        return state.set elision: 2

    dimensions = state.get \dimensions

    force = d3.layout.force!
        .size [dimensions.w, dimensions.h]
        .charge get-charge
        .gravity 0.04
        .link-strength 0.8
        .link-distance link-distance

    state.on \change:spline, -> state.set animating: \running
    state.on \change:jiggle, -> state.set animating: \running
    state.on \graph:reset, update-marked

    window.force = force

    state.on \change:animating, !->
        currently = state.get \animating
        switch currently
            | \running => force.resume!
            | \paused => force.stop!

    svg = d3.select \svg

    svg.select-all(\g).remove!

    throbber = svg.append \use
        .attr \x, dimensions.w / 2 - 150
        .attr \y, dimensions.h / 2 - 150
        .attr \xlink:href, \#throbber

    state.on \change:translate, (s, current-translation) ->
        svg-group.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"
        force.tick!

    state.on \change:zoom, (s, current-zoom) ->
        svg-group.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"
        force.tick!

    get-label-font-size = -> Math.min 40, 20 / state.get \zoom

    zoom = d3.behavior.zoom!
        .scale state.get \zoom
        .on \zoom, -> state.set {zoom: d3.event.scale, translate: d3.event.translate.slice!}

    svg.call zoom

    relationships = state.get \relationships

    svg
        .attr \width, dimensions.w
        .attr \height, dimensions.h
        .call draw-pause-btn dimensions, state
        .call draw-root-labels graph, dimensions

    svg-group = svg.append(\g)
        .attr \class, \ontology
        .attr \transform, 'translate(5, 5)'

    force.nodes graph.nodes
        .links graph.edges
        .on \tick, tick
        .on \end, ->
            state.set \animating, \paused
            tick! # Run the last tick.

    link = svg-group.select-all \.force-link
        .data graph.edges
    link.enter!
        .append (if state.has(\spline) then \path else \line)
        .attr \class, \force-link
        .attr \stroke-width, \1px
        .attr \stroke, link-stroke
        .attr \fill, link-fill
        .append \title, (e) -> "#{ e.source.label } #{ e.label } #{ e.target.label }"
    link.exit!remove!

    get-label-id = (\label- +) << (.replace /:/g, \-) << (.id)
    node = svg-group.select-all \.force-node
        .data graph.nodes
    n-g = node.enter!
        .append \g
        .attr \class, \force-node
        .call force.drag
        .on \click, draw-path-to-root
    node.exit!remove!

    n-g.append \circle
        .attr \class, ({sources}) -> join ' ', cons \force-term, sources
        .classed \root, is-root
        .classed \direct, (.is-direct)
        .attr \fill, term-color
        .attr \cx, -dimensions.w
        .attr \cy, -dimensions.h
        .attr \r, get-r

    n-g.append \text
        .attr \class, \count-label
        .attr \fill, \white
        .attr \text-anchor, \middle
        .attr \display, \none
        .attr \x, -dimensions.w
        .attr \y, -dimensions.h
        .attr \dy, \0.3em

    texts = svg-group.select-all \text.force-label
        .data graph.nodes

    texts.enter!
        .append \text
        .attr \class, \force-label
        .attr \text-anchor, \start
        .attr \fill, \#555
        .attr \stroke, \white
        .attr \stroke-width, \0.1px
        .attr \text-rendering, \optimizeLegibility
        .attr \display, -> if it.is-direct then \block else \none
        .attr \id, get-label-id
        .attr \x, -dimensions.w
        .attr \y, -dimensions.h
        .text (.label)
        .on \click, draw-path-to-root

    n-g.append \title
        .text (.label)

    svg.call draw-relationship-legend state, relationship-palette

    tick-count = 0

    state.set \animating, \running
    force.start!

    state.on \relationship:highlight, (rel) ->
        test = relationship-test rel, false
        col-filt = colour-filter test

        link.transition!
            .duration 50ms
            .attr \fill, (d) -> link-fill d |> col-filt d
            .attr \opacity, -> if (not rel) or (test it) then link-opacity.normal else link-opacity.unfocus
        link.classed \highlit, test

    state.on \term:highlight, (term) ->
        force.stop!
        n-g.select-all \circle.force-term
            .filter (.marked)
            .transition!
            .duration 50ms
            .attr \opacity, -> if (not term) or (it is term) then 1 else 0.5
        link.filter (.marked) << (.source)
            .transition!
            .duration 50ms
            .attr \opacity, -> if (not term) or (it.source is term) then link-opacity.focus else link-opacity.unfocus

    state.on \nodes:marked, update-marked

    state.once \force:ready, -> centre-and-zoom (.x), (.y), state, graph.nodes, zoom

    function is-ready
        {animating, tick-k, graph} = state.toJSON!
        ready = animating is \paused or tick-count > tick-k * ln length graph.edges
        if ready
            state.trigger \force:ready
        return ready

    function draw-path-to-root d, i
        state.set \animating, \running
        if is-root d
            toggle-subtree d
        else
            queue = [d]
            moar = -> it.edges |> map (.target) |> reject (.marked) |> unique
            count = 0
            max = state.get \maxmarked # don't overwhelm things
            while (count++ < max) and n = queue.shift!
                n.marked = true
                each queue~push, moar n
            update-marked!

    function toggle-subtree root
        mark-subtree root, \muted, not root.muted
        update-marked!

    function unmark
        for n in graph.nodes
            n.marked = n.muted = false
        update-marked!

    function update-marked
        state.trigger \graph:marked
        current-animation = state.get \animating
        state.set \animating, \running
        force.start! # needed to recalculate charges
        set-timeout (-> state.set \animating, current-animation), 150

    function tick

        tick-count++

        jiggle = switch state.get \jiggle
            | \strata => stratify
            | \centre => centrify
            | otherwise => unfix

        jiggle state if jiggle

        return unless is-ready!
        throbber?.remove!

        current-font-size = get-label-font-size!
        font-plus-pad = current-font-size * 1.1

        mean-x = mean map (.x), graph.nodes

        # find overlapping labels
        get-half = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [\left, \right]

        texts = svg-group.select-all \text.force-label
        displayed-texts = texts.filter -> \block is d3.select(@).attr \display
        displayed-texts.each (d1, i) ->
            ys = []
            this-half = get-half d1.x
            displayed-texts.each (d2) ->
                ys.push d2.y if d2 isnt d2 and (get-half d2.x is this-half) and abs(d1.y - d2.y) < font-plus-pad
            if ys.length
                op = if d1.y > mean ys then (+) else (-)
                d1.y = op d1.y, font-plus-pad # Jiggle them out of the way of each other.

        texts.attr \x, (.x)
            .attr \text-anchor, -> if it.x < mean-x then \end else \start
            .attr \y, (.y)
            .attr \dx, -> if it.x < mean-x then 1 - get-r it else get-r it

        if state.has(\spline)
            link.attr \d, draw-curve
        else
            link.attr \x1, (.x) << (.source)
                .attr \y1, (.y) << (.source)
                .attr \x2, (.x) << (.target)
                .attr \y2, (.y) << (.target)

        svg-group.select-all \text
            .attr \display ({marked, id, edges, is-direct}) ->
                | graph.nodes.length < state.get(\smallGraphThreshold) => \block
                | state.get(\zoom) > 1.2 => \block
                | (marked or is-direct) => \block
                | otherwise => \none

        node.select-all \text.count-label
            .text sum << (.counts)
            .attr \x, (.x)
            .attr \y, (.y)
            .attr \font-size, (/ 1.5) << get-r
            .attr \display ({marked, is-root, is-direct}) ->
                | marked or is-direct or is-root => \block
                | otherwise => \none

        svg-group.select-all \text.force-label
            .attr \font-size, current-font-size

        link.attr \stroke-width, ({target}) ->
            | target.marked => \2px
            | otherwise => \1px

        circles = node.select-all \circle
            .attr \r, get-r
            .attr \cx, (.x)
            .attr \cy, (.y)

        if any (.marked), graph.nodes
            circles.attr \opacity, -> if it.marked or it.is-root then 1 else 0.2
            link.attr \opacity, ({source, target}) ->
                | source.marked and (target.marked or target.is-root) => link-opacity.focus
                | otherwise => link-opacity.unfocus
            svg-group.select-all \text
                .attr \opacity, -> if it.marked then 1 else 0.2
        else
            link.attr \opacity, ({source: {muted}}) -> if muted then link-opacity.muted else link-opacity.normal
            circles.attr \opacity, ({muted, is-direct}) ->
                | muted => 0.3
                | is-direct => 1
                | otherwise => 0.9
            svg-group.select-all \text
                .attr \opacity, -> if it.muted then 0.3 else 1

make-graph = (direct-nodes, edges, node-for-ident) ->

    # Add edges to nodes. Edges belong to both the source and the target.
    for e in edges
        for prop in <[ source target ]>
            node = node-for-ident[e[prop]]
            throw new Error("Could not find node: #{ e[prop] }, the #{ prop } of #{ if prop is \source then e.target else e.source }") unless node?
            node.edges.push e

    # Lift idents to nodes
    for e in edges
        e.source = node-for-ident[e.source]
        e.target = node-for-ident[e.target]

    nodes = values node-for-ident

    is-root = (n) -> all (is n), map (.target), n.edges
    is-leaf = (n) -> all (is n), map (.source), n.edges

    # Precompute all these useful properties.
    for n in nodes
        n.is-direct = n.id in direct-nodes
        n.is-leaf = is-leaf n
        n.is-root = is-root n
        n.marked = n.muted = false
        if n.is-root
            mark-subtree n, \root, n

    {nodes, edges}

do-update = (group) ->

    group.select-all \circle.cp
        .attr \r, 10
        .attr \cx, (.x)
        .attr \cy, (.y)

    label-g = group.select-all \g.label

    label-g
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)
        .attr \transform, ({dagre: {points}, bbox}) ->
            x = mean map (.x), points
            y = mean map (.y), points
            "translate(#{ x },#{ y })"

get-min-max-size = (f, coll) ->
    map f, coll |> -> {min: (minimum it), max: (maximum it)} |> -> it <<< size: it.max - it.min

centre-and-zoom = (xf, yf, state, nodes, zoom) ->
    padding = 50
    {h, w}:dimensions = state.get \dimensions
    [x, y] = [ get-min-max-size f, nodes for f in [xf, yf] ]

    display-ratio = w / h
    graph-ratio   = x.size / y.size

    # Are we operating vertically or horizontally
    [dim, val] =
        | display-ratio < graph-ratio => [w, x.size]
        | otherwise => [h, y.size]

    # Calculate scale and translation
    scale = dim * 0.9 / (val + padding * 2)
    translate = map (+ padding) << (0 -) << (.min), [x, y]
        ..0 += w / 2 - scale * x.size / 2
        ..1 += h / 2 - scale * y.size / 2 - padding * scale

    console.log "x.min = #{ x.min }, y.min = #{ y.min }"

    console.log \translate, translate
    console.log \scale, scale

    # Apply
    zoom.scale scale
    zoom.translate translate
    state.set {zoom: scale, translate}

render-dag = (state, {reset, nodes, edges}) ->

    svg = d3.select \svg

    svg.select-all(\g).remove!

    dimensions = state.get \dimensions

    svg
       .attr \width, dimensions.w
       .attr \height, dimensions.h
       .call draw-relationship-legend state, relationship-palette
       .call draw-root-labels {nodes}, dimensions
       .call draw-source-legend state, term-palette

    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    update = -> do-update svg-group
    spline = calculate-spline state.get \dagDirection

    re-render = -> render-dag state, it

    reset ?= -> state.set \graph, {nodes, edges} if state.get(\view) is \dag

    state.on \graph:reset, reset

    console.log "Rendering #{ length nodes } nodes and #{ length edges } edges"

    svgBBox = svg.node!getBBox!

    mv-edge = translate-edge svg

    svg-group.select-all('*').remove!

    svg-edges = svg-group.select-all 'g .edge'
        .data edges

    edges-enter = svg-edges.enter!
        .append \g
        .attr \id, -> (it.source.id + it.label + it.target.id).replace /:/g, \_
        .attr \class, \edge

    svg-edges.exit!remove!

    svg-nodes = svg-group.select-all 'g .node'
        .data nodes

    nodes-enter = svg-nodes.enter!
        .append \g
        .attr \class, \node
        .attr \id, to-node-id

    svg-nodes..exit!remove!

    nodes-enter.on \click, (node) ->
        was-filtered = node.is-focus
        unmark nodes
        if was-filtered
            console.log "Resetting"
            reset!
        else
            mark-reachable node
            state.trigger \graph:marked
            filtered = only-marked nodes, edges
            re-render filtered <<< {reset}

    state.on \relationship:highlight, (link) ->
        scale = get-descale!
        test = relationship-test link, true
        node-test = (.edges) >> any test
        col-filt = colour-filter test
        nodes-enter
            .classed \highlight, if link then node-test else (-> false)
            .transition!
            .duration 100ms
            .attr \opacity, (node) -> if node-test node then 1 else 0.5

        edges-enter
            .transition!
            .duration 100ms
            .attr \opacity, (e) -> if test e then 0.8 else 0.2
            .attr \stroke, (e) -> link-stroke e |> col-filt e

    state.on \term:highlight, (node) ->
        scale = get-descale!
        nodes-enter
            .classed \highlight, (is node)
            .attr \opacity, (datum) -> if (not node) or (datum is node) then 1 else 0.5
            .attr \transform, ->
                | it is node => "translate(#{ it.dagre.x },#{ it.dagre.y }), scale(#{ scale })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y })"

    state.on \source:highlight, (sources) ->
        pattern = new RegExp sources
        test = pattern~test << (join \-) << (.sources)
        scale = min 2, max 1, get-descale!
        nodes-enter
            .classed \highlight, test
            .attr \opacity, -> if (not sources) or (test it) then 1 else 0.5
            .attr \transform, ->
                | test it => "translate(#{ it.dagre.x },#{ it.dagre.y }), scale(#{ scale })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y })"


    marker-end = if state.get(\dagDirection) is \LR then 'url(#Triangle)' else 'url(#TriangleDown)'
    edges-enter.append \path
        .attr \marker-end, marker-end
        .attr \stroke-width, 5px
        .attr \opacity, 0.8
        .attr \stroke, link-stroke

    rects = nodes-enter.append \rect

    #nodes-enter.append \title
    #    .text (.label)

    drag-cp = d3.behavior.drag!
        .on \drag, (d) ->
            d.y += d3.event.dy
            mv-edge d.parent, d3.event.dx, 0
            d3.select(\# + d.parent.dagre.id).attr \d, spline

    line-wrap = (str) ->
        buff = ['']
        max-ll = 25
        for word in str.split ' '
            if buff[* - 1].length + word.length + 1 > max-ll
                buff.push ''
            buff[* - 1] += ' ' + word
        map (.substring 1), buff

    labels = nodes-enter.append \text
        .attr \class, \dag-label
        .attr \text-anchor, \middle
        .attr \x, 0
        .classed \direct, (.is-direct)

    labels.each (n) ->
        text = line-wrap n.label
        el = d3.select @
        for line in text
            el.append \tspan
                .text line
                .attr \dy, \1em
                .attr \x, 0
        bbox = @getBBox!
        n.bbox = bbox
        n.width = bbox.width + 2 * node-padding
        n.height = bbox.height + 2 * node-padding

    rects
        .attr \class, ({sources}) -> join ' ', cons \dag-term, sources
        .attr \width, (.width)
        .attr \height, (.height)
        .attr \x, (1 -) << (/ 2) << (.width)
        .attr \y, (1 -) << (/ 2) << (.height)
        .attr \fill, term-color
        .classed \focus, (.is-focus)
        .classed \direct, (.is-direct)
        .classed \root, (.is-root)

    labels
        .attr \x, -> -it.bbox.width
        .attr \y, -> -it.bbox.height / 2

    dagre.layout!
        .nodeSep 50
        .edgeSep 50
        .rankSep 75
        .rankDir state.get(\dagDirection)
        .nodes nodes
        .edges edges
        .debugLevel 1
        .run!

    if state.get(\dagDirection) isnt \LR
        {h} = state.get \dimensions
        y-stats = get-min-max-size (.y) << (.dagre), nodes
        invert-scale = d3.scale.linear!
            .domain [y-stats.min, y-stats.max]
            .range [h * 0.9, 0]
        invert-node = -> invert-scale it.dagre.y
        invert-points = reverse << map ({y}:pt) -> pt <<< y: invert-scale y
        for n in nodes
            n.dagre.y = invert-node n
        for e in edges
            e.dagre.points = invert-points e.dagre.points

    # Apply the layout
    do apply-layout = ->
        nodes-enter.attr \transform, -> "translate(#{ it.dagre.x },#{ it.dagre.y })"

    max-y = fold max, 0, map (-> it.dagre.y), nodes

    zoom = d3.behavior.zoom!
        .scale state.get \zoom
        .on \zoom, -> state.set {zoom: d3.event.scale, translate: d3.event.translate.slice!}

    state.on \change:translate, (s, current-translation) ->
        svg-group.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"

    state.on \change:zoom, (s, current-zoom) ->
        svg-group.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"

    svg.call zoom

    centre-and-zoom ((.x) << (.dagre)), ((.y) << (.dagre)), state, nodes, zoom

    de-dup = (f) -> fold ((ls, e) -> if (any (is f e), map f, ls) then ls.slice! else ls ++ [e]), []
    to-combos = de-dup (join \-) << sort << (map (.id))

    get-overlapping = (things) ->
        to-combos [ [t, tt] for t in things for tt in things when t isnt tt and overlaps t, tt]

    get-descale = -> 1 / state.get \zoom

    separate-colliding = (left, right) ->
        [pt-a, pt-b] = map (to-xywh << (.bounds)), [left, right]
        speed = 0.1
        mv-towards -speed, pt-a, pt-b unless right.is-centre
        mv-towards -speed, pt-b, pt-a unless left.is-centre
        left.bounds <<< to-ltrb pt-a
        right.bounds <<< to-ltrb pt-b

    draw-collisions = (collisions) ->
        for collision in collisions
            for node in collision
                draw-debug-rect svg-group, node

    explodify = (highlit, i, rounds-per-run, max-rounds, done) ->
        collisions = get-overlapping highlit
        next-break = i + rounds-per-run

        while collisions.length and i++ < max-rounds and i < next-break
            for [left, right] in collisions

                separate-colliding left, right

            collisions = get-overlapping highlit

        if collisions.length and i < max-rounds
            done!
            set-timeout (-> explodify highlit, i, rounds-per-run, max-rounds, done), 0
        else
            console.log "#{ collisions.length } collisions left after #{ i } rounds"
            done!


    fix-dag-box-collisions = (max-i, d, i) -->
        return if i < max-i # only fire once, and only at the end of all transitions.
        scale = get-descale!
        half-pad = node-padding / 2
        is-focussed = -> any (.highlight), it.edges

        highlit = map (-> it <<< {bounds: to-ltrb it.dagre{x, y, height, width}, scale}), filter is-focussed, nodes

        return unless highlit.length

        max-rounds = 80
        round = 0
        rounds-per-run = 6

        focussed-nodes = nodes-enter.filter is-focussed
        affected-edges = edges-enter.filter (.highlight)
            .select-all \path

        reroute = ({source, target, dagre}) ->
            [s, t] = map (-> dagre: to-xywh it.bounds), [source, target]
            spline {dagre, source: s, target: t}

        explodify highlit, round, rounds-per-run, max-rounds, ->
            focussed-nodes.attr \transform, (n) ->
                {x, y} = to-xywh n.bounds
                "translate(#{ x },#{ y }) scale(#{ scale })"
            focussed-nodes.select-all \rect .attr \fill, (n) ->
                n |> term-color |> if n.is-centre then brighten else id
            # Can't get this to work without crashing, on my laptop at least...
            affected-edges.each (edge, i) ->
                f = ~> d3.select(@).attr \d, reroute edge
                set-timeout f, 0

    var cooldown

    focus-edges = ->
        some-lit = any (.highlight), edges

        unless some-lit
            clear-timeout cooldown

        delay = if some-lit then 250ms else 0

        cooldown := set-timeout (animate-focus some-lit), delay

    animate-focus = (some-lit) -> ->

        duration = 100ms
        de-scale = Math.max 1, get-descale!
        max-i = nodes.length - 1

        not-focussed = -> not some-lit or not any (.highlight), it.edges

        nodes-enter.transition!
            .duration duration * 2
            .attr \transform, ->
                | not-focussed it => "translate(#{ it.dagre.x },#{ it.dagre.y })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y }) scale(#{ de-scale })"
            .attr \opacity, ->
                | not some-lit => 1
                | any (.highlight), it.edges => 1
                | otherwise => 0.3
            .each \end, if (some-lit and de-scale > 1) then fix-dag-box-collisions max-i else (->)

        edge-paths = svg-edges.select-all \path
            .transition!
                .duration duration
                .attr \stroke-width, -> if it.highlight then 10px * de-scale else 5px
                .attr \stroke, ->
                    | it.highlight => BRIGHTEN link-stroke it
                    | otherwise    => link-stroke it
                .attr \fill, ->
                    | it.highlight => BRIGHTEN link-fill it
                    | otherwise    => link-fill it
                .attr \opacity, ->
                    | not some-lit or it.highlight => 0.8
                    | some-lit => 0.2
                    | otherwise => 0.5

        # see fix-dag-box-collisions
        unless some-lit
            edge-paths.attr \d, spline

        svg-edges.select-all \text
            .transition!
                .duration duration
                .attr \font-weight, -> if it.highlight then \bold else \normal
                .attr \font-size, -> if it.highlight then 28px else 14px

    highlight-targets = (node) ->
        svg-group.node().append-child this # Move to front

        moar = (n) -> reject (is n), map (.target), n.edges
        node.is-centre = true
        queue = [node]
        max-marked = 15 # Crashing the browser with too many...
        marked = 0

        while (n = queue.shift!) and marked++ < max-marked
            each (<<< highlight: true), reject (is n) << (.target), n.edges
            each queue~push, moar n
        focus-edges!

    nodes-enter.on \mouseover, highlight-targets

    nodes-enter.on \mouseout, (node) ->
        for e in edges
            e.source.is-centre = e.target.is-centre = false
            e.highlight = false
        focus-edges!

    # ensure two control points between source and target
    edges-enter.each (d) ->
        {points} = d.dagre
        unless points.length
            s = d.source.dagre
            t = d.target.dagre
            # Add the midpoint.
            points.push x: (s.x + t.x) / 2, y: (s.y + t.y) / 2

        if points.length is 1
            points.push x: points[0].x, y: points[0].y

    add-labels edges-enter

    edges-enter.select-all \circle.cp
        .data (d) ->
            [p.parent = d for p in d.dagre.points]
            d.dagre.points.slice!reverse!
        .enter!
        .append \circle
            .attr \class, \cp
            .call drag-cp

    relationships = reverse unique map (.label), edges
    palette = d3.scale.category10!
    edge-stroke = (palette) << (relationships~index-of) << (.label)

    svg-edges.select-all \path
        .attr \id, (.id) << (.dagre)
        .attr \d, spline
        .attr \stroke, edge-stroke

    update!

    get-drag-x = get-node-drag-pos \x
    get-drag-y = get-node-drag-pos \y

    drag-handler = (d, i) ->
        prev-x = d.dagre.x
        prev-y = d.dagre.y
        # Must be inside the svg box
        d.dagre.x = get-drag-x!
        d.dagre.y = get-drag-y!

        d3.select(@).attr \transform, "translate(#{ d.dagre.x },#{ d.dagre.y })"

        dx = d.dagre.x - prev-x
        dy = d.dagre.y - prev-y

        for e in d.edges
            mv-edge e, dx, dy
            update!
            d3.select(\# + e.dagre.id).attr \d, spline(e)

    node-drag = d3.behavior.drag!
        .origin ({pos, dagre}) -> (if pos then pos else dagre) |> ({x, y}) -> {x, y}
        .on \drag, drag-handler

    edge-drag = d3.behavior.drag!
        .on \drag, (d, i) ->
            mv-edge d, d3.event.dx, d3.event.dy
            d3.select(@).attr \d, spline d


    svg.call zoom

    nodes-enter.call node-drag
    edges-enter.call edge-drag

row-to-node = ([source, label, target]) -> {target, label, source}

query-params =
    (location.search or '?')
    |> (.substring 1)
    |> (.split \&)
    |> map (map decodeURIComponent) << (.split \=)
    |> list-to-obj

current-symbol = -> query-params.symbol or \bsk

graphify = (monitor, get-rows, symbol) -->
    console.log "Drawing graph for #{ symbol }"
    fetch-flat = flat-rows get-rows

    getting-direct = symbol |> direct-terms |> fetch-flat |> fail-when-empty "No annotation found for #{ symbol }"
    getting-all = symbol |> all-go-terms |> fetch-flat
    getting-names = getting-all.then fetch-names \flymine, get-rows, [symbol]
    getting-edges = getting-all.then(get-rows << whole-graph-q).then map row-to-node

    monitor [getting-direct, getting-all, getting-names, getting-edges]

    (.then make-graph) $.when getting-direct, getting-edges, getting-names

main = (.then draw, notify) << graphify (progress-monitor '#dag .progress'), rows

# Let's go!
$ -> main current-symbol!

### Utils.

function to-ltrb {x, y, height, width}, k = 1 then
    l: x - k * width / 2
    t: y - k * height / 2
    r: x + k * width / 2
    b: y + k * height / 2

function to-xywh {l, t, r, b} then
    x: l + (r - l) / 2
    y: t + (b - t) / 2
    height: b - t
    width: r - l

debug-colors = d3.scale.category10!

function draw-debug-rect svg-group, node
    console.log \drawing, node.id
    let tracked = to-xywh node.bounds
        svg-group.append \circle
            .attr \cx, tracked.x
            .attr \fill, \green
            .attr \cy, tracked.y
            .attr \r, 10
        svg-group.append \rect
            .attr \x, tracked.x - tracked.width / 2
            .attr \y, tracked.y - tracked.height / 2
            .attr \width, tracked.width
            .attr \height, tracked.height
            .attr \stroke, \red
            .attr \stroke-width, 1px
            .attr \opacity, 0.3
            .attr \fill, debug-colors node.id

sort-on-x = sort-by compare (.l)
sort-on-y = sort-by compare (.t)

function overlaps {bounds:a}, {bounds:b}
    p = node-padding

    # Check for:
    #
    #    +- +-----+----+
    #    |  |     |    |
    #    |  |     |    |
    #    + -+-----+----+
    #
    [a, b] = sort-on-x [a, b]
    overlaps-h =
        | a.l - p < b.l and b.l - p < a.r => true
        | a.l - p < b.r and b.r + p < a.r => true
        | otherwise => false

    [a, b] = sort-on-y [a, b]
    overlaps-v =
        | a.t - p < b.t and b.t - p < a.b => true
        | a.t - p < b.b and b.b + p < a.b => true
        | otherwise => false

    contained =
        | overlaps-h or overlaps-v => false
        | a.l < b.l and b.l < a.r and a.t < b.t and b.t < a.b => true
        | otherwise => false

    contained or (overlaps-h and overlaps-v)

