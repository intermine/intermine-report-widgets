/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */

{Service} = intermine

# The Service#rows function
{rows, query} = new Service root: 'www.flymine.org/query'

node-padding = 10

min-ticks = 20

# Get the ontology terms for a gene.
direct-terms = ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: {symbol: [it]}

all-go-terms = (symbol) ->
    select: <[ goAnnotation.ontologyTerm.identifier goAnnotation.ontologyTerm.parents.identifier ]>
    from: \Gene
    where: {symbol}

whole-graph-q = (terms) ->
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

#'relations.relationship': \is_a

# Get all the names for our ontology terms in one fell swoop, and build a mapping.
fetch-names = (identifier) ->
    q =
        select: <[ identifier name ]>
        from: \OntologyTerm
        where: {identifier}

    rows(q).then (listToObj << (map ([ident, label]) -> [ident, {label, id: ident, edges: []}]))

do-line = d3.svg.line!
        .x (.x)
        .y (.y)
        .interpolate \bundle

spline = ({source: {dagre:source}, target:{dagre:target}, dagre: {points}}) ->
    p0 =
        x: source.x + source.width / 2
        y: source.y + source.height / 2
    # dagre.util.intersect-rect e.source.dagre, points[0]
    pN =
        x: target.x - 25 - target.width / 2
        y: target.y + target.height / 2
    #dagre.util.intersect-rect e.target.dagre, points[* - 1]
    do-line [p0] ++ points ++ [pN]

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

mv-towards = !(how-much, goal, n) ->
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
        n.is-reachable = true
        each queue~push, moar n

unmark = (nodes) ->
    for n in nodes
        n.is-reachable = false
        n.is-focus = false
        n.is-source = false
        n.is-target = false

only-marked = (nodes, edges) ->
    nodes: filter (.is-reachable), nodes
    edges: filter (.is-reachable) << (.source), edges

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

draw-chord = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    roots = find-roots graph

    trees = map grow-tree, roots

    ontology = label: \GO, children: [], id: \go-ontology

    node-mapping = {}

    for tree in trees
        sub-ontology =
            label: tree.label
            id: tree.id
            children: all-children tree
        console.log sub-ontology
        for term in sub-ontology.children
            term.parent = sub-ontology
            term.children = []
            node-mapping[term.id] = term
        sub-ontology.parent = ontology
        ontology.children.push sub-ontology

    get-mapped = -> node-mapping[it.id]

    links = graph.edges
            |> map ({source, target}) -> {source: (get-mapped source), target: (get-mapped target)}
            |> filter ({source, target}) -> source and target

    console.log links.length

    svg = d3.select \svg

    svg
        .attr \width, 2000
        .attr \height, 1000

    orientation = angle: 0

    svg-group = svg.append(\g).attr \transform, 'translate(500, 500)'

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    bundle = d3.layout.bundle!

    cluster = d3.layout.cluster!
        .size [360, 250]

    line = d3.svg.line.radial!
        .interpolate \bundle
        .tension 0.85
        .radius (.y)
        .angle -> it.x / 180 * Math.PI

    nodes = cluster.nodes ontology

    console.log length all-children ontology
    console.log nodes.length

    splines = bundle links

    path = svg-group.select-all \path.chord
        .data links
        .enter!
            .append \path
            .attr \class, \chord
            .attr \stroke, \#555
            .attr \d, (d, i) -> line splines[i]

    angle-between = ([xa, ya], [xb, yb]) ->
        | xa is xb and ya is yb => Math.PI / 2
        | otherwise => Math.atan2 yb - ya, xb - xa

    drag-g-terms = d3.behavior.drag!
        .origin ->
            t = d3.select @
            {x: t.attr(\x), y: t.attr(\y)}
        .on \drag (d) ->
            angle = Math.atan2 d3.event.dx, d3.event.dy
            orientation.angle += angle
            svg-group.attr \transform, "translate(500, 500) rotate(#{ orientation.angle * 180 / 2 })"

    go-terms = svg-group.select-all \g.node
        .data nodes
        .enter!
            .append \g
            .attr \class, \node
            .attr \id, (.replace /:/g, \_) << (.id)
            .attr \transform, ({x, y}) -> "rotate(#{ x - 90 }) translate(#{ y })"
        .append \text
            .attr \class, \chord-label
            .attr \dx, ({x}) -> if x < 180 then 8 else -8
            .attr \dy, \.31em
            .attr \text-anchor, ({x}) -> if x < 180 then \start else \end
            .attr \transform, ({x}) -> if x < 180 then null else 'rotate(180)'
            .text (.label)
            .classed \direct, (.id) >> (in direct-nodes)
            .on \mouseover, show-links
            .on \mouseout, hide-links
            #.call drag-g-terms

    linkage-palette = d3.scale.category20b!

    function show-links d, i, level = 1
        return if level > 20 or d.seen
        svg-group.select-all \path.chord
            .attr \stroke, ({source, target}) ->
                next-level = level + 1
                #if source is d
                #    source.seen = level
                #    setTimeout (-> show-links target, i, next-level), 0
                #    linkage-palette level
                if target is d
                    target.seen = level
                    set-timeout (-> show-links source, i, next-level), 0
                    linkage-palette level
                else
                    lowest = Math.max (target.seen or 0), (source.seen or 0)
                    if lowest then linkage-palette lowest else null

    function hide-links d
        for n in nodes
            n.seen = false
        set-timeout (-> svg-group.select-all \path.chord .attr \stroke, \#555), 0

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

term-palette = d3.scale.category20!
term-color = (.darker!) << (d3~rgb) << (term-palette) << (.id) << (.root)

brighten = (.brighter!) << (d3~rgb)
darken = (.darker!) << (d3~rgb)

BRIGHTEN = brighten << brighten

draw-force =  (direct-nodes, edges, node-for-ident) ->

    current-zoom = 1
    animation-state = \paused

    $ \#jiggle
        .show!
        .val query-params.jiggle
        .on \change, !->
            query-params.jiggle = $(@).val!
            run-animation!
    $ \#spline
        .show!
        .val query-params.spline
        .on \change, !->
            query-params.spline = $(@).val!
            tick!

    run-animation = ->
        force.start!
        animation-state := \running

    $ \#force-stop
        .show!
        .on \click !->
            [action, next-state, next-label] = switch animation-state
                | \running => [force~stop, \paused, 'Start animation']
                | \paused  => [force~resume, \running, 'Pause animation']

            action!
            animation-state := next-state
            $(@).text next-label

    graph = make-graph ...

    for n in graph.nodes
        n.count = 1

    is-root = (.is-root)
    is-leaf = (.is-leaf)
    get-r = -> ((1.5 * ln it.count) + 5) * (if it.marked then 2 else 1)

    dimensions =
        w: $ \body .width!
        h: $ \body .height!

    get-charge = (d) ->
        radius = get-r d
        root-bump = if is-root d then 150 else 0
        edge-bump = 10 * d.edges.length
        marked-bump = if d.marked then 150 else 0
        jiggle-bump = if query-params.jiggle is \strata then 100 else 0
        k = 150
        1 - (k + radius + root-bump + edge-bump + marked-bump)

    link-distance = ({source, target}) ->
        ns = [source, target]
        edges = sum map (-> it.edges?.length or 0), ns
        marked-bump = 50 * length filter (.marked), ns
        muted-penalty = if (any (.muted), ns) then 100 else 0
        radii = sum map get-r, ns
        (3 * edges) + radii + 50 + marked-bump - muted-penalty

    force = d3.layout.force!
        .size [dimensions.w, dimensions.h]
        .charge get-charge
        .gravity 0.04
        .link-strength 0.8
        .link-distance link-distance

    (node-for-ident |> keys |> count-query |> query)
        .then (.summarise \goAnnotation.ontologyTerm.parents.identifier)
        .then list-to-obj << map ({count, item}) -> [item, count]
        .then (summary) ->
            for n in graph.nodes
                n.count = summary[n.id]
            n-g.select-all \circle
                .attr \r, get-r
            update-marked!

    svg = d3.select \svg
    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    get-label-font-size = -> Math.min 40, 20 / current-zoom

    zoom = d3.behavior.zoom!
        .on \zoom, ->
            current-zoom := d3.event.scale
            svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ current-zoom })"
            force.tick!
            tick!

    svg.call zoom

    relationships = unique map (.label), graph.edges

    svg
        .attr \width, dimensions.w
        .attr \height, dimensions.h

    force.nodes graph.nodes
        .links graph.edges
        .on \tick, tick


    link = svg-group.select-all \.force-link
        .data graph.edges
    link.enter!
        .append (if query-params.spline then \path else \line)
        .attr \class, \force-link
        .attr \stroke-width, \1px
        .attr \stroke, link-stroke
        .attr \fill, link-fill
    link.exit!remove!


    get-label-id = (\label- +) << (.replace /:/g, \-) << (.id)
    node = svg-group.select-all \.force-node
        .data graph.nodes
    n-g = node.enter!
        .append \g
        .attr \class, \force-node
        .call force.drag
        .on \click, draw-path-to-root

    n-g.append \circle
        .attr \class, \force-term
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

    n-g.append \text
        .attr \class, \force-label
        .attr \text-anchor, \start
        .attr \fill, \#555
        .attr \stroke, \black
        .attr \stroke-width, \0.1px
        .attr \display, -> if it.is-direct then \block else \none
        .attr \id, get-label-id
        .attr \x, -dimensions.w
        .attr \y, -dimensions.h
        .text (.label)

    n-g.append \title
        .text (.label)

    legend = svg.select-all \g.legend
        .data relationships
    lg = legend.enter!
        .append \g
        .attr \class, \legend
        .attr \width, 140
        .attr \height, 50
        .attr \x, 25
        .attr \y, (d, i) -> 25 + 50 * i
        .on \click, (rel) ->
            for e in graph.edges when e.label is rel
                for n in [e.source, e.target]
                    n.marked = true
            update-marked true
            set-timeout unmark, 10_000ms

    lg.append \rect
        .attr \opacity, 0.6
        .attr \width, 180
        .attr \height, 50
        .attr \x, 25
        .attr \y, (d, i) -> 50 * i
        .attr \fill, relationship-palette

    lg.append \text
        .attr \x, 25
        .attr \y, (d, i) -> 25 + 50 * i
        .attr \dy, \0.31em
        .attr \dx, \1em
        .text id

    tick-count = 0

    update-marked!

    var timer

    function is-ready then tick-count > min-ticks * ln length graph.edges

    function draw-path-to-root d, i
        if is-root d
            toggle-subtree d
        else
            clear-timeout timer
            queue = [d]
            moar = -> it.edges |> map (.target) |> reject (.marked) |> unique
            count = 0
            max = 15 # don't overwhelm things
            while (count++ < max) and n = queue.shift!
                n.marked = true
                for sn in moar n
                    queue.push sn
            update-marked true
            timer := set-timeout unmark , 25000ms

    function toggle-subtree root
        mark-subtree root, \muted, not root.muted
        update-marked!

    function unmark
        for n in graph.nodes
            n.marked = n.muted = false
        update-marked!

    function update-marked after-mark
        if not after-mark or animation-state is \running
            run-animation!
        tick!

    function show-label d, i
        for n in concat-map (-> [it.source, it.target]), d.edges
            d3.select(\# + get-label-id n).attr \display, \block
        set-timeout (-> hide-label d, i), 6000ms

    function hide-label d, i
        for n in concat-map (-> [it.source, it.target]), d.edges
            d3.select(\# + get-label-id n).attr \display, \none

    /* http://bl.ocks.org/sboak/2942559 */
    /* http://bl.ocks.org/sboak/2942556 */
    basis-line = d3.svg.line!
            .interpolate \basis

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
            [(source.x - radius-s * cos90), (source.y - radius-s * sin90)],
            [mp2-x, mp2-y],
            end-point,
            end-point,
            [mp1-x, mp1-y],
            [(source.x + radius-s * cos90), (source.y + radius-s * sin90)]
        ]


    draw-curve = ({target, source}) ->
        {cos, sin, sqrt, atan2, pow, PI} = Math
        slope = atan2 (target.y - source.y), (target.x - source.x)
        [sin-s, cos-s] = map (-> it slope), [sin, cos]
        slope-plus90 = PI / 2 + slope
        [sin90, cos90] = map (-> it slope-plus90), [sin, cos]

        [radius-t, radius-s] = map get-r, [target, source]

        line-length = sqrt pow(target.x - source.x, 2) + pow(target.y - source.y, 2)
        end-point = [(target.x - radius-t * 0.9 * cos-s), (target.y - radius-t * 0.9 * sin-s)]

        args = [source, target, line-length, end-point, radius-s, cos90, sin90]

        points = switch query-params.spline
            | \straight => link-spline 0.0
            | otherwise => link-spline 0.1

        args |> points |> basis-line |> (+ \Z)


    by-x = compare (.x)
    width-range = d3.scale.linear!
        .range [0.1 * dimensions.w, 0.9 * dimensions.w]

    stratify = !->
        roots = sort-by by-x, filter is-root, graph.nodes
        leaves = sort-by by-x, filter (-> it.is-direct and it.is-leaf), graph.nodes
        surface = fold min, 0, map (.y), graph.nodes
        current-font-size = get-label-font-size!

        corners = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [0, dimensions.w]
        quantile = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [0 til roots.length]

        roots.for-each (root, i) ->
            mv-towards 0.01, {y: (surface - get-r root), x: width-range i}, root

        for n in graph.nodes when not (n.is-root and (n.y - get-r n) < surface)
            mv-towards 0.001, {x: n.root.x, y: dimensions.h}, n

        width-range.domain [0, roots.length - 1]


        #for n in graph.nodes
        #    [qn, qr] = map quantile, [n.x, n.root.x]
        #    if qn isnt qr and (abs(qn - qr) > 1 or any (-> it.root isnt n.root), filter (-> qr is quantile it.x), graph.nodes)
        #        mv-towards 0.02, {n.y, x: n.root.x}, n

        leaves.for-each (n, i) ->
            speed = if n.y < (dimensions.h / 2) then 0.05 else 0.005
            if n.y < dimensions.h * 0.9
                mv-towards speed, {n.x, y: dimensions.h * 0.9}, n
            if n.y >= dimensions.h * 0.85
                n.y = dimensions.h * 0.9 + (current-font-size * 1.1 * i)

    centrify = !->
        roots = sort-by (compare (.y)), filter is-root, graph.nodes
        mean-d = mean map (* 2) << get-r, roots
        half = (/ 2)
        # Put root nodes under a centripetal force.
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
        for leaf in graph.nodes when is-leaf leaf
            mv-towards -0.001, centre, leaf

    function tick

        tick-count++

        jiggle = switch query-params.jiggle
            | \strata => stratify
            | \centre => centrify

        do jiggle if jiggle

        return unless is-ready!

        current-font-size = get-label-font-size!
        font-plus-pad = current-font-size * 1.1

        mean-x = mean map (.x), graph.nodes

        # find overlapping labels
        get-half = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [\left, \right]

        texts = node.select-all \text.force-label
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

        node.select-all \text.count-label
            .attr \x, (.x)
            .attr \y, (.y)
            .attr \font-size, (/ 1.5) << get-r
            .text (.count)

        if query-params.spline
            link.attr \d, draw-curve
        else
            link.attr \x1, (.x) << (.source)
                .attr \y1, (.y) << (.source)
                .attr \x2, (.x) << (.target)
                .attr \y2, (.y) << (.target)

        node.select-all \text
            .attr \display ({marked, id, edges, is-direct}) ->
                | current-zoom > 2 => \block
                | (marked or is-direct) => \block
                | all (is id), map (.id) << (.source), edges => \block
                | otherwise => \none

        node.select-all \text.force-label
            .attr \font-size, current-font-size

        link.attr \stroke-width, ({target}) ->
            | target.marked => \2px
            | otherwise => \1px

        circles = node.select-all \circle
            .attr \r, get-r
            .attr \cx, (.x)
            .attr \cy, (.y)

        if any (.marked), graph.nodes
            circles.attr \opacity, -> if it.marked then 1 else 0.2
            link.attr \opacity, ({source}) ->
                | source.marked => 0.8
                | otherwise => 0.1
            node.select-all \text
                .attr \opacity, -> if it.marked then 1 else 0.2
        else
            link.attr \opacity, ({source: {muted}}) -> if muted then 0.3 else 0.5
            circles.attr \opacity, ({muted, is-direct}) ->
                | muted => 0.3
                | is-direct => 1
                | otherwise => 0.9
            node.select-all \text
                .attr \opacity, -> if it.muted then 0.3 else 1


draw-radial = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    roots = find-roots graph

    root =
        | query-params?.root => find ((is query-params.root) << (.id)), roots
        | otherwise => head roots

    tree = grow-tree root

    svg = d3.select \svg

    svg
        .attr \width, 2000
        .attr \height, 1000

    svg-group = svg.append(\g).attr \transform, 'translate(500, 500)'

    zoom = d3.behavior.zoom!
        .on \zoom, -> svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ d3.event.scale })"

    svg.call zoom

    cluster = d3.layout.cluster!
        .size [360, 225]
        .sort (a, b) -> d3.ascending a.children.length, b.children.length

    diagonal = d3.svg.diagonal.radial!
        .projection ({x,y}) -> [y, x / 180 * Math.PI]

    nodes = cluster.nodes tree
    links = cluster.links nodes

    #if query-params?.join-leaves
    #    [nodes, links] = join-leaves nodes, links

    palette = d3.scale.category10!
    relationships = unique map (.relationship), nodes

    link = svg-group.select-all \path.link
        .data links
        .enter!
            .append \path
            .attr \class, \link
            .attr \stroke, link-stroke
            .attr \d, diagonal

    node = svg-group.select-all \g.treenode
        .data nodes
        .enter!
            .append \g
            .attr \class, \treenode
            .attr \transform, ({x, y}) -> "rotate(#{ x - 90 }) translate(#{ y })"

    set-on-each-to-root = (tn, val) ->
        tn <<< val
        while tn = tn.parent
            tn <<< val

    circle-palette = d3.scale.category20!
    node-ids = unique map (.id), nodes
    circle-fill = (circle-palette) << (node-ids~index-of) << (.id)

    circles = node.append \circle
        .attr \r, -> if it.node-type is \root then 10 else 3.5
        .attr \class, -> if it.id in direct-nodes then \direct else it.node-type
        .attr \fill, circle-fill
        .on \mouseover, (tn) ->
            set-on-each-to-root tn, focus: true
            for n in nodes when n.id is tn.id and n isnt tn
                n.synonym = true
            show-focussed!
        .on \mouseout, (tn) ->
            set-on-each-to-root tn, focus: false
            for n in nodes
                n.synonym = false
            show-focussed!

    texts = node.append \text
        .attr \class, \go-name
        .attr \dx, ({x}) -> if x < 180 then 8 else -8
        .attr \dy, \.31em
        .text (.label)
        .attr \text-anchor, \start
        .attr \text-anchor, ({x, children}) ->
            | x < 180 => \start
            | children.length > 1 => \start
            | otherwise => \end
        .attr \transform, ({x, children}) ->
            | children.length > 1 => 'rotate(0)'
            | x < 45  => 'rotate(45)'
            | x < 180 => 'rotate(-45)'
            | x < 315 => 'rotate(240)'
            | otherwise => 'rotate(120)'

    do show-focussed = ->
        texts.attr \opacity, ({focus}) ->
            | focus => 1
            | nodes.length > 50 => 0
            | otherwise => 0.1
        link.attr \stroke-width, ({target: {focus}}) -> if focus then 10px else 5px
        circles.attr \r, ({node-type, synonym}) ->
            | node-type is \root => 10px
            | synonym            => 7px
            | otherwise          => 3.5px


draw-dag = (direct-nodes, edges, node-for-ident) ->
    graph = make-graph ...

    svg = d3.select \svg
    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    # Hacky hack for now - should not have to do this...
    #svgBBox = svg.node!getBBox!
    #    ..width = 5000
    #    ..height = 2000

    d3.select-all(svg.node)
        .attr \width, $(\body).width()
        .attr \height, $(\body).height()

    render svg, svg-group, graph

make-graph = (direct-nodes, edges, node-for-ident) ->

    # Add edges to nodes. Edges belong to both the source and the target.
    for e in edges
        for prop in <[ source target ]>
            node-for-ident[e[prop]].edges.push e

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

render = (svg, svg-group, {nodes, edges, reset}) -->

    re-render = render svg, svg-group

    update = -> do-update svg-group

    reset ?= -> re-render {nodes, edges}

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
            filtered = only-marked nodes, edges
            re-render filtered <<< {reset}

    edges-enter.append \path
        .attr \marker-end, 'url(#Triangle)'
        .attr \stroke-width, 5px
        .attr \opacity, 0.8
        .attr \stroke, link-stroke

    rects = nodes-enter.append \rect

    nodes-enter.append \title
        .text (.label)

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

    labels.each (d) ->
        bbox = @getBBox!
        d.bbox = bbox
        d.width = bbox.width + 2 # * node-padding
        d.height = bbox.height + 2  # * node-padding

    rects
        .attr \width, (node-padding * 2 +) << (.width)
        .attr \height, (node-padding * 2 +) << (.height)
        .attr \x, -> -it.bbox.width / 2 - node-padding
        .attr \y, -> -it.bbox.height / 2 - node-padding / 2
        .attr \fill, term-color
        .classed \focus, (.is-focus)
        .classed \direct, (.is-direct)
        .classed \root, (.is-root)

    labels
        .attr \x, -> -it.bbox.width / 2
        .attr \y, -> -it.bbox.height / 2

    dagre.layout!
        .nodeSep 100
        .edgeSep 20
        .rankSep 200
        .rankDir \LR
        .nodes nodes
        .edges edges
        .debugLevel 1
        .run!

    # Apply the layout
    do apply-layout = ->
        nodes-enter.attr \transform, -> "translate(#{ it.dagre.x },#{ it.dagre.y })"

    overlaps = ({dagre:a}, {dagre:b}) ->
        required-separation = node-padding
        dx = a.x - b.x
        dy = a.y - b.y
        adx = abs dx
        ady = abs dy
        mdx = (1 + required-separation) * mean map (.width), [a, b]
        mdy = (1 + required-separation) * mean map (.height), [a, b]

        adx < mdx and ady < mdy

    get-overlapping = (things) ->
        [ [t, tt] for t in things for tt in things when t isnt tt and overlaps t, tt]

    separate-colliding = ({dagre:left}, {dagre:right}) ->
        mv-towards -0.1, left, right
        mv-towards -0.1, right, left

    fix-dag-box-collisions = (d, i) ->
        return if i
        return false
        highlit = filter (-> any (.highlight), it.edges), nodes
        colliding = get-overlapping highlit
        max-rounds = 50
        i = 0
        while colliding.length and i++ < max-rounds
            console.log "Found #{ colliding.length } collisions"
            for [left, right] in colliding
                separate-colliding left, right
            colliding = get-overlapping highlit

        /* Finding collisions work, but avoiding them is a TODO */
        nodes-enter.filter (.highlight)
            .attr \transform, ->
                "translate(#{ it.dagre.x },#{ it.dagre.y }) scale(#{ Math.min 3, 1 / current-zoom })"

        console.log "#{ colliding.length } collisions left after #{ i } rounds"

    focus-edges = ->
        some-lit = any (.highlight), edges

        duration = 250ms
        max-scale = 2.5
        de-scale = Math.max 1, Math.min max-scale, 1 / current-zoom

        not-focussed = -> not some-lit or not any (.highlight), it.edges

        nodes-enter.transition!
            .duration duration
            .attr \transform, ->
                | not-focussed it => "translate(#{ it.dagre.x },#{ it.dagre.y })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y }) scale(#{ de-scale })"
            .attr \opacity, ->
                | not some-lit => 1
                | any (.highlight), it.edges => 1
                | otherwise => 0.3
            .each \end, fix-dag-box-collisions

        svg-edges.select-all \path
            .transition!
                .duration duration
                .attr \stroke-width, -> if it.highlight then 15px else 5px
                .attr \stroke, ->
                    | it.highlight => BRIGHTEN link-stroke it
                    | otherwise    => link-stroke it
                .attr \fill, ->
                    | it.highlight => BRIGHTEN link-fill it
                    | otherwise    => link-fill it
                .attr \opacity, -> if not some-lit or it.highlight then 0.8 else 0.5

        svg-edges.select-all \text
            .transition!
                .duration duration
                .attr \font-weight, -> if it.highlight then \bold else \normal
                .attr \font-size, -> if it.highlight then 28px else 14px

    highlight-targets = (node) ->
        moar = (n) -> reject (is n), map (.target), n.edges
        queue = [node]
        while n = queue.shift!
            each (<<< highlight: true), reject (is n) << (.target), n.edges
            each queue~push, moar n
        focus-edges!

    nodes-enter.on \mouseover, highlight-targets

    nodes-enter.on \mouseout, (node) ->
        for e in edges
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

    current-zoom = 1

    zoom = d3.behavior.zoom!
        .on \zoom, ->
            current-zoom := d3.event.scale
            svg-group.attr \transform, "translate(#{ d3.event.translate }) scale(#{ current-zoom })"

    svg.call zoom

    nodes-enter.call node-drag
    edges-enter.call edge-drag

flatten = concat-map id

row-to-node = ([source, label, target]) -> {target, label, source}

query-params =
    (location.search or '?')
    |> (.substring 1)
    |> (.split \&)
    |> map (map decodeURIComponent) << (.split \=)
    |> list-to-obj

current-symbol = -> query-params.symbol or \bsk

main = (symbol) ->
    console.log "Drawing graph for #{ symbol }"

    getting-direct = symbol |> direct-terms |> rows |> (.then flatten)
    getting-all = symbol |> all-go-terms |> rows
    getting-names = getting-all.then (fetch-names << flatten)
    getting-edges = getting-all.then(rows << whole-graph-q << flatten).then map row-to-node

    draw = switch query-params.view
        | \radial => draw-radial
        | \chord  => draw-chord
        | \force => draw-force
        | otherwise => draw-dag

    $.when(getting-direct, getting-edges, getting-names).then draw

# Let's go!
main current-symbol!

