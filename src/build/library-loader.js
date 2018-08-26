/**
 * Module for loading info on the api library from original disk files
 *
 * **/


var fs = require("fs");
var _ = require("underscore");
var path = require("path");


/**
 * determine if a path is a directory
 *
 * @param x
 */
function isDir(x) {
    return fs.lstatSync(x).isDirectory();
};


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
};


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
    var content = fs.readdirSync(dirpath).map(function(x) {
        return dirpath + path.sep + x;
    })
    return {
        "path": dirpath,
        "subdirs": content.filter(isDir),
        "configs": content.filter(isJson),
        "plugins": content.filter(isJs)
    };
};



/**
 * load all plugins recursively starting from a directory
 *
 * @param dirpath string, path to look into
 * @returns
 * array of plugins. Each plugin is augmented with private field _filepath
 */
function loadPlugins(dirpath, rootdir) {
    var content = getDirContent(dirpath)
    var subplugins = _.flatten(_.map(content.subdirs, loadPlugins))
    var plugins = content.plugins.map(function(x) {
        var plugin = require(x);
        plugin._filepath = x;
        return plugin
    })

    return [].concat(plugins).concat(subplugins);
}




/** ************************************************************************ */


module.exports = new function() {
    this.load = function(dirpath) {
        return loadPlugins(dirpath);
    };
}();

