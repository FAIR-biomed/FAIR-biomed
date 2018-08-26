# Code structure

The repo source code is organized in distinct parts. 

 - documentation - `docs`
 - plugin library - `library`
 - core extension - `src/app`
 - build scripts  - `src/build`
 - tests - `test`
 
 Other directories are created during installation and development.
 
 - dependencies - `node_modules`
 - browser extension - `dist`
 
In order to create or to maintain a plugin, the parts of interest are the `library` and the `test` components. You should be able to install the extension and create a new plugin without accessing the other parts.



