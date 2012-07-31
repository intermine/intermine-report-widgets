# This is my displayer definition
class Displayer

	# Have access to config and templates compiled in.
	initialize: (@config, @templates) ->

	# Render simply returns a string to be returned to the target.
	render: (target) ->
		$(target).html 'Hello world'