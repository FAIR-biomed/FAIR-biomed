/**
 * Maintenance script
 * reads package.json and increases the minor version number
 *
 * */


let fs = require("fs-extra");


let package_file = 'package.json';

let npm_package = JSON.parse(fs.readFileSync(package_file).toString());
let previous = npm_package['version'];
let version = previous.split(".").map(x => parseInt(x));
version[-1+version.length]++;
let current = version.join(".");
npm_package['version'] = current;

console.log(previous+" -> "+current);
fs.writeFileSync(package_file, JSON.stringify(npm_package, null, 2));
