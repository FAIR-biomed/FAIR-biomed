/**
 * Build script
 * Copies resource files from node modules to dist
 *
 * */


var path = require("path");
var fs = require("fs-extra");
var utf8 = require("utf8");


console.log("Setting up output directories")
fs.ensureDirSync("dist");


console.log("Preparing manifest");
var npm_package = JSON.parse(fs.readFileSync("package.json").toString());
var manifest = fs.readFileSync(__dirname+"/configurations/manifest.json").toString();
var manifest_file = ['dist', 'manifest.json'].join(path.sep)
manifest = manifest.replace("_version_", npm_package['version'])
fs.writeFileSync(manifest_file, manifest);


console.log("Reading bundle configuration files")
var dependencies_path = "./configurations/dependencies-"
var dependencies = {};
for (let type of ["development", "production", "background"]) {
    dependencies[type] = require(dependencies_path+type)
}

/** process an array of dependency declarations - copy files from one place to another **/
function build_static(dependencies_array) {
    dependencies_array.forEach(function(x) {
        var target = x["to"];
        // ensure target directory is present
        fs.ensureDirSync(path.dirname(target));
        // read contents of all the source files
        var result = x['from'].map(function(frompath) {
            if (frompath=="") {
                return "";
            }
            return utf8.encode(fs.readFileSync(frompath)+"\n");
        });
        fs.writeFileSync(target, result.join("\n"));
    })
}

var type = process.argv[2]

console.log("Building browser-side bundle")
build_static(dependencies["background"]);

if (type==="development" || type==="production") {
    console.log("Building client-side bundle ("+type+")")
    build_static(dependencies[type]);
} else {
    console.log("To build a bundle, specify either 'development' or 'production'")
}
