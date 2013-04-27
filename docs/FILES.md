## Files

A description of files involved follows:

<dl>
    <dt>/docs</dt>
    <dd>documentation files</dd>
    <dt>/Cakefile</dt>
    <dd>runs jobs, similar to <code>make</code></dd>
    <dt>/client.coffee</dt>
    <dd>the source file for the lightweight client that loads widgets on a page</dd>
    <dt>/config.json</dt>
    <dd>configuration of the widgets (as if coming from a mine)</dd>
    <dt>/precompile.coffee</dt>
    <dd>the file used by <code>cake</code> to actually precompile widget sources</dd>
    <dt>/service.coffee</dt>
    <dd>the service that starts the app on a port so you can see how the widgets look</dd>
    <dt>/start.js</dt>
    <dd>a file that can be called from <code>node</code> to compile the client source and start serving the app</dd>
</dl>