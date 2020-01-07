# Contributing

Contributions to the FAIR-biomed browser extension are welcome. Please raise an issue in the github repository. 


## Plugins

Plugins are meant to be lightweight components that link the core app to external APIs. 

 - **Short**. Keep computations within each plugin to a minimum for performance and readability. 
 - **Simple**. Use pure javascript without any external libraries.
 - **Small**. Use small-sized files for the logo and information resources.
 - **Self-contained**. Restrict each function to process its inputs only; calls for outside resources (e.g. ajax) will not be considered.
 - **Complete**. Provide all relevant information, especially a description of the data source with appropriate attribution and examples of queries that the plugin should be able to claim and process. 

To incorporate a new plugin into the main extension:

 1. Create a github issue in the parent repo with a proposal for a new plugin. This is a means to gather suggestions and ideas.
 2. Fork the parent repo and develop a new plugin within that fork. 
 3. Make sure the plugin passes unit tests and contains appropriate tests of its own. Check that it can be incorporated into the main library, and produces desired output in the browser.
 5. Send a pull request to the parent repo.  


## App

Updates/improvements to the main app are also welcome. These are likely not to be as standardized as plugins and must be consistent with the existing plugin library. Please use issues to discuss proposed changes.

