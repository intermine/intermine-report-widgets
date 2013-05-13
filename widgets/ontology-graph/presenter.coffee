
DEFAULT_GRAPH_STATE =
      view: 'Dag'
      smallGraphThreshold: 20
      jiggle: null
      spline: 'curved'
      dagDirection: 'LR'
      maxmarked: 20
      tickK: 15
      translate: [5, 5]
      elision: null

getGraphState = ( config, elem ) ->

    initVals =
        root: null
        animating: 'waiting'
        dimensions:
            w: elem.offsetWidth
            h: elem.offsetHeight

    new Backbone.Model _.extend {}, DEFAULT_GRAPH_STATE, initVals, config.graphState

$ = jQuery

# Requires a libray called 'dagify' with the following functions:
# - progressMonitor (elem) -> ([Promise]) -> () # Monitors progress from the promises in the elem
# - graphify monitor -> (Query -> Promise[Rows]) -> Query -> Promise[Graph]
# - fetchAndMergeHomology monitor -> Service -> Service -> Graph -> Query -> ()
# - annotateForCounts (obj -> Query) -> [Node] -> ()
# - doHeightAnnotation [Node] -> ()
# - edgesToNodes [Edge] -> [Node]
# - renderDag / renderForce :: elem -> Model -> Graph -> ()
# The model passed to any render function expects the following events:
# - 'nodes:marked', [Node] -- The list of marked nodes
# - 'edges:marked', [Edge] -- The list of marked edges
#


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

      @listenTo @model, 'change:query', @loadData
      @listenTo @model, 'change:all', @resetHomologyButtons
      @listenTo @model, 'change:heights', @fillElisionSelector
      @listenTo @model, 'change:root', @onRootChange
      @listenTo @model, 'change:elision', (m, elision) => @$('.elision').val elision
      @listenTo @model, 'graph:marked graph:reset', @showOntologyTable
      @listenTo @model, 'change:all', @renderRoots
      @listenTo @model, 'change:all', => @model.set root: @model.getRoots()[0]
      @listenTo @model, 'change:graph change:view change:dagDirection', @presentGraph
      @on 'controls:changed', => @$el.foundation()
      @on 'graph:reset', => @state.get('graph').unmark()

    onRootChange: =>
      root = @model.get 'root'
      @$('.graph-root').val root.id if root?

    renderRoots: =>
      roots = @model.get 'roots'
      select = @$('select.graph-root').empty()
      for r in roots.concat({id: null, label: 'All'})
        select.append """<option value="#{ r.id }">#{ r.label }</option>"""
      @trigger 'controls:changed'

    presentGraph: =>
      view = @model.get 'view'
      render = dagify['render' + view] or dagify.renderDag
      setTimeout (=> render @model, @model.get('graph')), 0

    resetHomologyButtons: =>

    fillElisionSelector: =>
      elisionSelector = @$ 'select.elision'
      elisionSelector.empty()

      for h in @model.get 'heights'
        text = if h is 0
          "Show all terms"
        else if h is 1
          "Show only direct terms, and the root term"
        else
          "Show all terms within #{ h } steps of a directly annotated term"

        elisionSelector.append """<option value="#{ h }">#{ text }</option>"""

      @trigger 'controls:changed'
      if level = @model.get 'elision'
        elisionSelector.val level

    renderChrome: ->
      @$el.html @templates.widget
      for key, sel of Widget.BINDINGS
        @$(sel).val @model.get key
      setUpOntologyTable()

    setUpOntologyTable: =>
      {w, h} = @model.get 'dimensions'
      table = @$('.ontology-table').css
        top: (0.05 * h)
        left: (w - 50)
        height: (0.9 * h)
        width: (0.6 * w)
      table.find('table').addClass('tablesorter').tablesorter()

    setupInterop: ->
      $ul = @$ '.interop-sources'
      self = @
      toOption = (group) ->
        $li = $ """<li><a href="#" class="small button">#{ group.name }</a></li>"""
        $li.on 'click', ->
          $this = $ @
          return if $this.hasClass 'disabled'
          $this.addClass 'disabled'
          self.addDataFrom group.taxonId

    addDataFrom: (taxonId) ->

      service = @interopMines[taxonId]
      monitor = dagify.progressMonitor @$ '.homologue-progress'
      merging = dagify.fetchAndMergeHomology monitor, @service, service, @model.get('all'), @config.query

      merging.fail @reportError
      merging.done (merged) => @annotate merged
      merging.done (merged) => @model.set all: merged
      merging.done (merged) => @model.set roots: merged.getRoots()

    linkRow: (link) ->
      $row = $ @templates.ontologyRelationshipRow link
      $row.on('mouseout',  => $row.removeClass('highlit'); @model.trigger evt, null)
          .on('mouseover', => $row.addClass('highlit'); @model.trigger evt, link)

    termRow: (term) ->
      evt = 'term:highlight'
      $row = $ @templates.ontologyTermRow term
      $row.on('mouseout',  => $row.removeClass('highlit'); @model.trigger evt, null)
          .on('mouseover', => $row.addClass('highlit'); @model.trigger evt, term)

    showOntologyTable: =>
        {w, h} = @model.get 'dimensions'
        markedStatements = @model.get('all').getMarkedStatements()

        $statements = @$('.ontology-table .marked-statements')
        $terms =  @$('.ontology-table .marked-terms')

        for $e in [$statements, $terms]
          $e.find('tbody').empty()

        for statement in markedStatements
          $statements.append @linkRow statement

        for term in dagify.edgesToNodes(markedStatements)
          $terms.append @termRow term

        @$('.ontology-table')
            .toggle(markedStatements.length > 0)
            .foundation('section', 'reflow')
            .find('table').trigger 'update'

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

      evts['click .button.symbol'] = ->
        newSymbol = @$('input.symbol').val()
        state.set query: newSymbol

      evts['change .graph-root'] = (e) ->
        rootId = $(e.target).val()
        state.set root: state.get('all').getNode rootId

      evts['change .elision'] = -> state.set 'elision', parseInt($(@).val(), 10)

      getLeft = (isOpen) =>
        w - 50 - (if isOpen then 0 else @$ '.ontology-table .section-container'.outerWidth())

      evts['click .slide-control'] = =>
        table = @$('.ontology-table')
        wasOpen = table.hasClass 'open'
        table.toggleClass('open').animate( left: getLeft(wasOpen) )
        icon = $('.slide-control i')
          .removeClass('icon-chevron-right icon-chevron-left')
          .addClass(if wasOpen then 'icon-chevron-left' else 'icon-chevron-right')

      return evts

    toggleDisplayOptions: ->
      @$ '.graph-control .resizer'
        .toggleClass 'icon-resize-small icon-resize-full'
      @$ '.graph-control .hidable'
        .slideToggle()

    loadData: =>
      monitor = dagify.progressMonitor @$ '.dag .progress'
      building = dagify.graphify monitor, @service.rows, @model.get 'query'
      building.fail @reportError
      building.done (graph) => @annotate graph
      building.done (graph) => @model.set all: graph
      building.done (graph) => @model.set roots: graph.getRoots()

    annotate: (graph) ->
      dagify.annotateForCounts @service.query, graph.nodes
      dagify.doHeightAnnotation(graph.nodes).done =>
        @model.set heights: graph.getHeights()
        @model.trigger 'annotated:height'

    reportError: (e) -> alert "Error: #{ e }"

