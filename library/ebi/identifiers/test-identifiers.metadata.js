/** Unit tests specific to identifiers (metadata) plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./identifiers.metadata');


it("does not claim long queries", function () {
    assert.equal(plugin.claim("long query"), 0);
    assert.equal(plugin.claim("single-long-word"), 0);
});

//it("claims true identifiers with prefixes", function () {
//    assert.equal(plugin.claim("GO:0006355"), 0.96);
//    assert.equal(plugin.claim("reactome:R-HSA-446203"), 0.96);
//});

it("does not claim prefixes", function () {
    assert.equal(plugin.claim("GO"), 0);
    assert.equal(plugin.claim("go"), 0);
});

it("constructs urls to a metadata api endpoint", function () {
    assert.ok(plugin.url("GO:0006355").includes("metadata.api"));
});

it('extracts resources from round a typical response', function() {
    var r1 = fs.readFileSync(__dirname+'/response-identifiers.metadata-reactome.json').toString();
    var result = plugin.process(r1, 0, 'reactome:R-HSA-446203');
    assert.equal(result.status, 1);
    // this example has one table
    assert.equal(result.data.length, 1);
    // should have the query and
    var result_str = JSON.stringify(result.data[0]);
    assert.ok(result_str.includes('reactome:R-HSA-446203'));
    assert.ok(result_str.includes('protein'));
});

it('extracts message from an empty/error response', function() {
    var r2 = fs.readFileSync(__dirname+'/response-identifiers.metadata-abcd.json').toString();
    var result = plugin.process(r2, 0, 'abcd:001');
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("NO RESOURCES"));
});

it('generates external urls', function () {
    var result = plugin.external('MP:0000001');
    assert.ok(result.includes('0001'))
});
