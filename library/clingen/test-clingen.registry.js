/** Unit tests specific to ClinGen variant search plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./clingen.registry');

it("does not claim long or short queries", function () {
    assert.equal(plugin.claim("long text query"), 0)
    assert.equal(plugin.claim("abc"), 0)
});

it("claims canonical allele ids", function() {
    assert.equal(plugin.claim("CA6146346"), 1)
});

it("claims dbSNP ids", function() {
    assert.ok(plugin.claim("rs2847281") > 0.8);
});

it("claims numerical ", function() {
    assert.ok(plugin.claim("6146346") > 0.8)
});

it("processes search query without results", function () {
    var r0 = fs.readFileSync(__dirname + '/response-clingen.registry-empty.json').toString();
    var result = plugin.process(r0, 0);
    assert.equal(result.status, 0);
});

it("processes search query with some hits", function () {
    var raw = fs.readFileSync(__dirname + '/response-clingen.registry-search-0.json').toString();
    var result = plugin.process(raw, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 3);
    assert.ok(result.data[0].includes('CA6146346'));
});
