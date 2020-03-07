# FAIR-biomed


<a href="https://addons.mozilla.org/en-GB/firefox/addon/fair-biomed/"><img align="right" src="docs/firefox_addons.png" width="206"></a>

<a href="https://chrome.google.com/webstore/detail/fair-biomed/kaacnnmpcdbebmkbcddpckgpgphhcdhn"><img align="right" src="docs/ChromeWebStore_Badge_v2_206x58.png" width="198"></a>

FAIR-biomed is a browser extension for accessing open data resources in the biomedical domain. 

See the [project website](https://fair-biomed.github.io/intro/) or [website source repo](https://github.com/FAIR-biomed/fair-biomed.github.io) for information on how to [install](https://fair-biomed.github.io/install/) the extension in a web browser, how to [personalize](https://fair-biomed.github.io/personalization/) the extension to your needs, and a list of all the supported [resources](https://fair-biomed.github.io/resources/).

The website also has the developer's [documentation](https://fair-biomed.github.io/documentation/) on the [code structure](https://fair-biomed.github.io/core/) in this repository, and how to [incorporate new plugins](https://fair-biomed.github.io/plugins/) into the resource library. 


## Setup

To compile the source code into a working extension, clone the repository into a local directory. You will need to use `node` and `npm`. The latest builds were performed using `node` v13.3.0, and `npm` v6.13.1, although other versions may also work. To check your version, execute the following commands.

```
node --version
npm --version
``` 

Next, install dependencies and build the extension.

```
npm install
npm run test
npm run build
```

*Note:* running the test suite is not optional, and the extension may not work if this step is skipped.

To prepare the extension for Chrome or Firefox using a single-line script, specify the target browser and build for production.

```
BROWSER=chrome npm run production
BROWSER=firefox npm run production
```

The extension files will appear in a directory `dist`.


## Archiving

An archiving script creates production builds for Chrome and Firefox and packages all source files into a separate zip. 

```
./archive-version VERSION_NUMBER
```

*Note:* the uppercase text in the above command is a placeholder - replace it with some version identifier, e.g. `0.0` or `dev`. 



## Get involved

Feedback and contributions are welcome. Please raise an issue in the github repository.

