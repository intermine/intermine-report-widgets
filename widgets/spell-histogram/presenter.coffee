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

    # Render accepts a target to draw results into.
    render: (@target) ->
        # Generate an Irwin–Hall distribution of 10 random variables.
        values = d3.range(1000).map(d3.random.irwinHall(10))

        # Map to a -20, 20 range.
        x = d3.scale.linear().domain([0, 1]).range([-20, 20])

        # Generate a histogram using twenty uniformly-spaced bins.
        data = d3.layout.histogram().bins(x.ticks(20))(values)

        # Map the labels to data.
        twoDArray = _(data).map (bin, i) -> from = x(bin.x) ; [ "#{from} to #{from + 2}", bin.y ]

        # Render template.
        $(@target).html @templates.chart()

        # Google Viz.
        google.load 'visualization', '1.0',
            'packages': [ 'corechart' ]
            callback: =>
                chart = new google.visualization.ColumnChart($(@target).find('.chart')[0])
                chart.draw(google.visualization.arrayToDataTable(twoDArray, false), @chartOptions)