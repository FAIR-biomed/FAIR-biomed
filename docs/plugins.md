# Plugins

Plugin definitions are located in subdirectories of `library`. For example, plugins accessing data from the [Wikimedia foundation](https://www.wikimedia.org) are located in `library/wikimedia`.  To create a new plugin, create new subdirectory with the name of your data source.


## Plugins as modules

Plugin definitions consist of javascript files (extension `.js`) written as modules. Each module is required to define a number of components. 

Static fields:

 - `id` - string, a unique identifier for the plugin. This is never seen by the end user, but it is used by the core app.
 - `title` - string, a short heading of the plugin. 
 - `subtitle` - string, a short description.
 - `tags` - array of strings, keywords associated with the plugin.
 - `logo` - string, name for a logo image file (svg, png, jpg)
 - `info` - string, name for a text/html file containing a description of the data source 
 
Functions:

 - `claim(query)` - should return a number [0,1] signaling to what extent the plugin can provide useful information given a query string. Higher numbers give the plugin a higher ranking in the results list.
 - `url(query, index)` - should return a url for an API call for the given query string. An integer index can be used if plugins require multiple round-trips to the API (see wikipedia plugin for an example)
 - `process(response, index)` - should transform data obtained from an API call into a simple object that can be displayed within the extension's output window. An integer index can be used if plugins require multiple round-trips to the API (see wikipedia for an example).
 - `extenal(query)` - should construct a url to a human-readable page holding more information pertaining to a query. 

Note that a plugin directory can contain more than one plugin definition file. However, each file can define only on plugin. 

TO DO - describe output for `process()`


## Auxiliary files

Plugins require auxiliary data components. Image files (logo) and text files (data source description) must be placed within the same directory as the plugin definition files. 


## Testing

Testing is carried out at two levels. The first is programmatic testing via unit tests. 

```
npm run test-plugin library/wikimedia
```

The `test-plugin` script executes a small number of tests on each plugin, for example checking that each plugin contains the required fields and functions. 

Additional, plugin-specific, tests can be included into the testing framework by adding test files in the plugin folders. These test files must be named as `test-[plugin-name].js`, see the folder with the wikimedia plugins for an example.

The second level of testing focuses on getting the plugin to display proper information in the browser. Build a new library incorporating the new plugin. To build the entire library containing all plugins, use the same command as above, `npm run build-lib`. However, it is also possible to build a library containing just the relevant plugin.

```
npm run build-lib library/wikimedia
```

The build script also performs some checks and signals development hints.   After a successful library build, reload the extension in the browser, navigate to a relevant webpage (or refresh an existing tab/window), and manually check whether relevant queries provide the expected output.  

Note, this manual process is sufficient for simple plugins that do not perform much processing on their API's output. In cases where more extensive processing is required, it is possible to set up dedicated unit tests for each plugin.

