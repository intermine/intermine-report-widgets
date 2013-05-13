
DEFAULT_GRAPH_STATE =
      view: 'dag'
      smallGraphThreshold: 20
      jiggle: null
      spline: 'curved'
      dagDirection: 'LR'
      maxmarked: 20
      tickK: 15
      translate: [5, 5]
      elision: null
      relationships: []

getGraphState = ( config, elem ) ->

    initVals =
        root: null
        animating: 'waiting'
        dimensions:
            w: elem.offsetWidth
            h: elem.offsetHeight

    new Backbone.Model _.extend {}, DEFAULT_GRAPH_STATE, initVals, config.graphState

$ = jQuery

class Widget extends Backbone.View

    initialize: (@config, @templates) ->
        @service = new intermine.Service @config.service

    render: (target) ->

        @setElem $(target)[0]
        @model = getGraphState @config, elem

        @renderChrome()
        @startListening()
        @loadData()

        return this

    @BINDINGS:
        tickK: '.min-ticks'
        jiggle: '.jiggle'
        spline: '.spline'

    startListening: ->

        for key, sel of Widget.BINDINGS then do (sel) =>
            @listenTo @model, 'change:' + key, (m, v) => @$(sel).val v

    renderChrome: ->
        @$el.html @templates.widget
        for key, sel of Widget.BINDINGS
          @$(sel).val @model.get key

    events: ->
        state = @model
        evts =
            'submit .graph-control': (e) -> e.preventDefault()
            'click .graph-control .resizer': 'toggleDisplayOptions'
            'click .graph-reset': => @trigger 'graph:reset'


        for key, sel of Widget.BINDINGS
            evts['change ' + sel] = -> state.set key, $(@).val()

        switches =
            '.switch-view-dag': {view: 'dag'}
            '.switch-view-force': {view: 'force'}
            '.switch-orient-lr': {dagDirection: 'LR'}
            '.switch-orient-tb': {dagDirection: 'TB'}

        for selector, args of switches then do (args) ->
              evts['change  ' + selector] = -> state.set args if $(@).is ':checked'

        return evts

    toggleDisplayOptions: ->
        @$ '.graph-control .resizer'
          .toggleClass 'icon-resize-small icon-resize-full'
        @$ '.graph-control .hidable'
          .slideToggle()

    loadData: ->

