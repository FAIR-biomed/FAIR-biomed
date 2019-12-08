# Installation

## Clone or fork

If you would only like to experiment with the repo, clone it into a local directory. 

If you would like to develop new components and merge with the parent repo, make a fork first and then clone the forked version. (Also see the [guide for contributors](contributing.md)).


## Install dependencies

After you have a local copy of the source code, the next steps are to install all dependencies and then building the application. 

First, install all dependencies using the node package manager.

```
npm install
```

This step may take ime as several dependencies are installed in a new folder `node_modules`. 


## Test

The next stage in the installation process is testing. Although testing is sometimes an optional step during an installation procedure, that is not the case for FAIR-biomed. This is because the testing stage evaluates the types of plugins that are available and in working condition. Only properly functioning plugins are made available for the next build stage.

Thus, run the entire test suite.

```
npm run test
```

This should display a positive message at the end.


## Build the extension

Finally, build the app. 

```
npm run build
```

This command creates a a directory `dist` and populates it with files required for the extension to work in the browser.

If you are aiming to develop new components, look into `package.json` to examine the steps to generate the core of the extension as well as the plugin library. The individual steps will be useful during development.


## Load into the browser

After these build steps, add the extension to your browser. Under the `customize menu` (vertical dots beside the navigation bar), select `More tools` and `Extensions`. A screen should appear. Turn on `developer mode` (switch on top-right), then click `Load unpacked`. In the popup window, select the location of the `dist` folder. 

