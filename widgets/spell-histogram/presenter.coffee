# This is my widget definition, needs to have a set signature.
# There always needs to be one and only one class `Widget`.
class Widget

    # Google Visualization chart options.
    chartOptions:
        # The default font face for all text in the chart.
        fontName: 'Sans-Serif'
        # The default font size, in pixels, of all text in the chart.
        fontSize: 9
        # The colors to use for the chart elements.
        colors:   [ '#8E0022' ]
        # An object with members to configure various aspects of the legend.
        legend:
            # No legend is displayed.
            position: 'none'
        # An object with members to configure various horizontal axis elements.
        hAxis:
            # The title of the horizontal axis.
            title: 'Log2 Ratios'
            # An object that specifies the horizontal axis title text style.
            titleTextStyle:
                # The font face for the text in the horizontal axis.
                fontName: 'Sans-Serif'
        # An object with members to configure various vertical axis elements.
        vAxis:
            # The title of the vertical axis.
            title: 'Number of Experiments'
            # An object that specifies the vertical axis title text style.
            titleTextStyle:
                # The font face for the text in the vertical axis.
                fontName: 'Sans-Serif'

    ###
    Have access to config and templates compiled in.
    This function needs to always be present and will always accept the following two Objects.
    By using the at sign I am saving the two parameters on `this` object.
    @param {Object} config A key value dictionary of config coming from the server.
    @param {Object} templates A key value dictionary of template functions.
    ###
    constructor: (@config, @templates) ->

    ###
    Render accepts a target to draw results into.
    This function needs to always be present and will always accept the target string.
    @param {jQuery selector} target Either a string or a jQuery selected object where to draw the output to.
    ###
    render: (@target) ->
        # 1. Generate a range of 1000 numberic values
        # 2. Generate a random number with an Irwin–Hall distribution.
        # 3. Applies the range of values to the random distribution, returning an array of key-values entries.
        values = d3.range(1000).map(d3.random.irwinHall(10))

        # 1. Construct a linear quantitative scale.
        # 2. Set the scale's input domain to 0, 1.
        # 3. Set the scale's output range to -20, 20.
        x = d3.scale.linear().domain([0, 1]).range([-20, 20])

        # 1. Construct a new histogram layout.
        # 2. Organize into bins of 20 representative values from the linear scale.
        data = d3.layout.histogram().bins(x.ticks(20))(values)

        # Coerce the data into the Google Visualization format.
        twoDArray = _(data).map (bin) -> from = x(bin.x) ; [ "#{from} to #{from + 2}", bin.y ]

        # Render template.
        $(@target).html @templates.chart()

        # Render the chart itself.
        google.load 'visualization', '1.0',
            'packages': [ 'corechart' ]
            # Once we have loaded the CoreChart package, render the chart.
            callback: => # Using the fat arrow means I can reference objects one scope up.
                # Point the chart to render to the `target` element's specified `chart` div.
                chart = new google.visualization.ColumnChart($(@target).find('.chart')[0])
                # 1. Take the 2-dimensional array and turn it into a DataTable, first row is header labels.
                # 2. Draw the visualization on the page passing in options that we specified higher up.
                chart.draw(google.visualization.arrayToDataTable(twoDArray, false), @chartOptions)