# This is my widget definition, needs to have a set signature.
class Widget

    # Google Visualization chart options.
    chartOptions:
        fontName: 'Sans-Serif'
        fontSize: 9
        colors:   [ '#8E0022' ]
        legend:
            position: 'none'
        hAxis:
            title: 'Log2 Ratios'
            titleTextStyle:
                fontName: 'Sans-Serif'
        vAxis:
            title: 'Number of Experiments'
            titleTextStyle:
                fontName: 'Sans-Serif'

    # Have access to config and templates compiled in.
    constructor: (@config, @templates) ->

    # Fake data...
    data: ->
        # The values.
        data = [ 0, 0, 0, 0, 0, 1, 5, 17, 115, 2028, 3347, 176, 50, 368, 692, 64, 155, 29, 9, 0 ]
        
        # The labels.
        columns = [] ; i = -18
        while i isnt 22
            columns.push "#{i - 2} to #{i}"
            i += 2
        
        # Map them together.
        _(columns).map (label, i) -> [ label, data[i] ]

    # Render accepts a target to draw results into.
    render: (@target) ->
        twoDArray = @data()

        google.load 'visualization', '1.0',
            'packages': [ 'corechart' ]
            callback: =>
                chart = new google.visualization.ColumnChart($(@target)[0])
                chart.draw(google.visualization.arrayToDataTable(twoDArray, false), @chartOptions)