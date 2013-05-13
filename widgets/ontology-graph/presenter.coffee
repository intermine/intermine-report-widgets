{flip} = prelude

class Widget extends Backbone.View

    initialize: (@config, @templates) ->
        @service = new intermine.Service @config.service

    render: (target) ->

        @set-elem first $ target
        @model = get-graph-state @config, elem

        @render-chrome!
        @start-listening!
        @load-data!

        return this

    @BINDINGS:
        tick-k: \.min-ticks
        jiggle: \jiggle
        spline: \spline

    start-listening: ->

        for key, sel of Widget.BINDINGS
            @listen-to @model, 'change:' + key, flip @$(sel)~val!

    render-chrome: ->
        @$el.html @templates.widget
        @$ \.jiggle .val @model.get \jiggle
        @$ \.min-ticks .val @model.get \tickK

    events: ->
        state = @model
        evts =
            'submit .graph-control': (.prevent-default!)
            'click .graph-control .resizer': @~toggle-display-options
            'click .graph-reset': @trigger \graph:reset, _


        for key, sel of Widget.BINDINGS
            evts['change ' + sel] = -> state.set key, $(@).val!

        switches =
            '.switch-view-dag': {view: \dag}
            '.switch-view-force': {view: \force}
            '.switch-orient-lr': {dagDirection: \LR}
            '.switch-orient-tb': {dagDirection: \TB}

        for selector, state-args of switches
            let args = state-args
                evts[\change + ' ' + selector] = -> state.set args if $(@).is \:checked

        return evts

    toggle-display-options: ->
        @$ '.graph-control .resizer' .toggle-class 'icon-resize-small icon-resize-full'
        @$ '.graph-control .hidable' .slide-toggle!



    load-data: ->

function get-graph-state config, elem

    defaults =
        view: \dag
        small-graph-threshold: 20
        jiggle: null
        spline: \curved
        dag-direction: \LR
        maxmarked: 20
        tick-k: 15
        translate: [5, 5]
        elision: null
        relationships: []

    init-vals =
        root: null
        animating: \waiting
        dimensions:
            w: elem.offset-width
            h: elem.offset-height

    from-conf = config.graph-state

    new Backbone.Model defaults <<< init-vals <<< from-conf

