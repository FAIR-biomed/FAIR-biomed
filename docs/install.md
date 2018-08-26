# Installation

## Clone or fork

If you would only like to experiment with the repo, clone it into a local directory. 

If you would like to develop new components and merge with the parent repo, make a fork first and then clone the forked version. (Also see the [guide for contributors](CONTRIBUTING.md)).


## Build

After you have a local copy of the source code, the next steps are to install all dependencies and then building the application. 

First, install all dependencies using the node package manager.

```
npm install
```

This step may take some time as several dependencies are installed in a new folder `node_modules`. 

Next, install the app with the following command. 

```
npm run build
```

This command creates a a directory `dist` and populates it with all the files required for the extension to work in the browser.

If you aiming to develop new components, consider looking into `package.json` to examine the steps to generate the core of the extension as well as the plugin library. The individual steps will be useful during development.


## Load into the browser

After the build steps, add the extension to your browser. Under the `customize menu` (vertical dots beside the navigation bar), select `More tools` and `Extensions`. A screen should appear. Turn on `developer mode` (switch on top-right), then click `Load unpacked`. In the popup window, select the location of the `dist` folder. 

