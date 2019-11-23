/**
 *  Executable build script
 *  Generates a browser-ready file with the api library
 *
 *  **/


// node dependencies
let browserify = require("browserify");
let path = require("path");
let fs = require("fs-extra");
let uglify = require("uglify-es");
// from this repo
let libraryloader = require("./library-loader");


/** helper function to copy a resource defined in a plugin to the distribution directory **/
function copyResource(plugin, type) {
    let infile = null;
    if (type==="logo") {
        infile = plugin.logo
    } else if (type==="info") {
        infile = plugin.info
    } else {
        throw "Invalid resource type: "+type
    }

    if (typeof infile !== "undefined" && infile !== null) {
        infile = path.basename(infile);
        let indir = path.dirname(plugin._filepath);
        let inpath = [indir, infile].join(path.sep);
        let outpath = [distlibdir, type, plugin.namespace+"."+infile].join(path.sep);
        fs.writeFileSync(outpath, fs.readFileSync(inpath))
    }
}


/***************************************************************************
 * Setup
 *************************************************************************** */

// get source directory
var libdir = process.argv[2];
if (typeof libdir === "undefined") {
    libdir = "library";
}
libdir = path.resolve(libdir);

// default library (the na logo is there)
var defaultdir = ["library"].join(path.sep);
// define output directories
var logodir = ["dist", "library", "logo"].join(path.sep);
var infodir = ["dist", "library", "info"].join(path.sep);
var distlibdir = ["dist", "library"].join(path.sep);




/***************************************************************************
 * Main Script
 *************************************************************************** */

console.log("Building library from: "+libdir);


console.log("Reading plugin test status");
let plugin_status = {};
plugin_status_file = "library"+path.sep+"plugin_status";
if (fs.existsSync(plugin_status_file)) {
    fs.readFileSync(plugin_status_file)
        .toString().split("\n")
        .map(function(x) {
            if (x!="") {
                plugin_status[x] = true
            }
        })
} else {
    console.log("Plugin status file does not exist. Run tests before building library.");
    return;
}


console.log("Setting up output directories");
fs.ensureDirSync(distlibdir);
fs.ensureDirSync(logodir);
fs.ensureDirSync(infodir);


// copy the _logo_na.png file
let na_logo_inpath = [defaultdir, "_logo_na.png"].join(path.sep);
let na_logo_outpath = [distlibdir, "logo", "_logo_na.png"].join(path.sep);
fs.writeFileSync(na_logo_outpath, fs.readFileSync(na_logo_inpath));


console.log("Searching for plugins");
let plugins = libraryloader.load(libdir);


console.log("Validating plugins");
plugins = plugins.filter(function(plugin) {
    let dots = ".".repeat(3+Math.max(0, 30-plugin.id.length));
    let tested = plugin_status[plugin.id] === true;
    let decision = "OK";
    if (!tested) {
        decision = "SKIPPING: not tested";
    }
    console.log("  " + plugin.id + " " + dots + " " + decision);
    return tested
});


console.log("Building library file");
let ids = plugins.map((x)=> x["id"]);
let out = [];
out.push("/**");
out.push("    This is an automatically generated file; do not edit manually.");
out.push("    To generate this file, run: 'npm run build-lib'");
out.push("**/");
out.push("library = {");
out.push("  'names': "+JSON.stringify(ids)+",");
out.push("  'plugins': {}");
out.push("};");
plugins.map(function(x) {
    // register the plugin into the library object
    let reqpath = path.dirname(x._filepath) + path.sep + path.basename(x._filepath, ".js");
    if (!reqpath.startsWith(libdir)) {
        console.log("SKIPPING "+x.id+ "- something went wrong with filepath");
        return
    }
    let namespace = path.dirname(x._filepath).substr(libdir.length+1);
    namespace = namespace.split("/").join(".");
    out.push("library['plugins']['"+x.id+"'] = require('"+reqpath+"');");
    out.push("library['plugins']['"+x.id+"']['namespace'] = '"+namespace+"'");
    // copy associated resources
    x.namespace = namespace;
    copyResource(x, "logo");
    copyResource(x, "info")
});
out.push("");


console.log("Writing raw library file");
let outprefix = "dist/library/library";
let outraw = outprefix+"-raw.js";
let outfinal = outprefix+"-min.js";
fs.writeFileSync(outraw, out.join("\n"));


console.log("Preparing library for browser");
browserify([outraw]).bundle(function(err, code){
    if (err) {
        return console.error(err.message);
    }
    // also minify and remove the raw file
    let codemin = uglify.minify(code.toString());
    fs.writeFileSync(outfinal, codemin.code);
    fs.removeSync(outraw);
});


console.log("done");
