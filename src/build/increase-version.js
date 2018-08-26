/**
 * Maintenance script
 * reads package.json and increases the minor version number
 *
 * */


var fs = require("fs-extra");


var package_file = 'package.json'

var npm_package = JSON.parse(fs.readFileSync(package_file).toString());
var previous = npm_package['version'];
var version = previous.split(".").map(x => parseInt(x));
version[-1+version.length]++;
var current = version.join(".");
npm_package['version'] = current;

console.log(previous+" -> "+current);
fs.writeFileSync(package_file, JSON.stringify(npm_package, null, 2))
