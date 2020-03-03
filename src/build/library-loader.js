/**
 * Module for loading info on the api library from original disk files
 *
 * **/


let fs = require("fs");
let path = require("path");


/**
 * determine if a path is a directory
 *
 * @param x
 */
function isDir(x) {
    return fs.lstatSync(x).isDirectory();
}


/**
 * determine if a file path is a json
 *
 * @param x
 * @returns {boolean}
 */
function isJson(x) {
    if (!fs.lstatSync(x).isFile()) {
        return false;
    }
    return path.extname(x)===".json";
}


/** determine if a file path is a js, not a test **/
function isJs(x) {
    if (!fs.lstatSync(x).isFile()) {
        return false;
    }
    return path.extname(x)===".js" && !path.basename(x).startsWith("test");
}


/**
 * read content of a directory and split output into components
 *
 * @param dirpath
 * @returns {{subdirs: *, configs: *}}
 */
function getDirContent(dirpath) {
    let content = fs.readdirSync(dirpath).map(function(x) {
        return dirpath + path.sep + x;
    });
    return {
        "path": dirpath,
        "subdirs": content.filter(isDir),
        "configs": content.filter(isJson),
        "plugins": content.filter(isJs)
    };
}


/**
 * load all plugins recursively starting from a directory
 *
 * @param dirpath string, path to look into
 * @returns
 * array of plugins. Each plugin is augmented with private field _filepath
 */
function loadPlugins(dirpath) {
    let content = getDirContent(dirpath);
    let plugins = content.plugins.map(function(x) {
        let plugin = require(x);
        plugin._filepath = x;
        return plugin
    });
    if (content.subdirs.length) {
        let subdir_plugins = (content.subdirs).map(loadPlugins);
        subdir_plugins.map(function(subplugins) {
            plugins = plugins.concat(subplugins);
        });
    }
    return plugins;
}

function loadPluginStatuses(plugin_status_file) {
    if (!fs.existsSync(plugin_status_file))
        throw "Plugin status file does not exist. Run tests before building library.";
    let plugin_status = {};
    fs.readFileSync(plugin_status_file)
        .toString().split("\n")
        .map(function(x) {
            if (x!="") {
                plugin_status[x] = true
            }
        });
    return plugin_status;
}

module.exports = new function() {
    this.load = function(dirpath) {
        return loadPlugins(dirpath);
    };
    this.loadPluginStatuses = loadPluginStatuses;
}();

