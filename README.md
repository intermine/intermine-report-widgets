# InterMine Report Widgets Service & Client
##Deprecated

Has been retired and made into something better. See [InterMine Docs](https://intermine.readthedocs.org/en/1.2.3/embedding/apps-a/). The changes are as follows:

1. Widget becomes an App.
1. The main class in `presenter.[js|ts|ls|coffee]` has been changed from `Widget` to `App`.
1. A config file with dependencies for a particular App is moved to its folder in the form of a `config.js` file. The contents of this file is being `exported` and contains example config to be passed from middleware and/or client.
1. The Java service serving Report Widgets has been retired from InterMine core.
1. The Node.js service now works as a middleware. You can plug it into your (Node.js) app by passing an array of paths on local or remote systems where it can find the App sources.
1. There is a repo for the [Middleware](https://github.com/intermine/apps-a-middleware) and for the [Sources](https://github.com/intermine/intermine-apps-a).
1. Folders and modules are now allowed and can be required across.
1. The root `App` now needs to be exported from the main class.
1. To use a template you need to include its suffix.
