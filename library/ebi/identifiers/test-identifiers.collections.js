/** Unit tests specific to identifiers (collections) plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./identifiers.collections');


it("does not claim long queries", function () {
    assert.equal(plugin.claim("long query"), 0);
    assert.equal(plugin.claim("single-long-word"), 0);
});

it("claims true identifiers with prefixes", function () {
    assert.equal(plugin.claim("GO:0006355"), 0.95);
    assert.equal(plugin.claim("reactome:R-HSA-446203"), 0.95);
});

it("does not claim prefixes", function () {
    assert.equal(plugin.claim("GO"), 0);
    assert.equal(plugin.claim("go"), 0);
});

it("constructs urls to a resolver api endpoint", function () {
    assert.ok(plugin.url("GO:0006355").includes("resolver.api"));
});

it('extracts resources from round a typical response', function() {
    var r1 = fs.readFileSync(__dirname+'/response-identifiers.collections-mgi.json').toString();
    var result = plugin.process(r1, 0, 'MGI:2442292');
    assert.equal(result.status, 1);
    // this example has three hits
    assert.equal(result.data.length, 3);
    // this example should include Jackson and Jax
    var datastr = JSON.stringify(result.data);
    assert.ok(datastr.includes("jax"));
    assert.ok(datastr.includes("Jackson"));
});

it('extracts message from an empty/error response', function() {
    var r2 = fs.readFileSync(__dirname+'/response-identifiers.collections-abcd.json').toString();
    var result = plugin.process(r2, 0, 'abcd:001');
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("No providers"));
});

it('generates external urls', function () {
    var result = plugin.external('MP:0000001');
    assert.ok(result.includes('0001'))
});
