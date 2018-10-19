/** Unit tests specific to impc models plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./impc.models');

it("does not claim long queries", function () {
    var result = plugin.claim("long text query");
    assert.equal(result, 0)
});

it("claims single-word queries that don't start with MGI", function () {
    var result = plugin.claim("text");
    assert.equal(result, 0.8)
});

it("does not claim when 2nd part is not a number", function () {
    var result = plugin.claim("MGI:text");
    assert.equal(result, 0)
});

it("does not claim other identifiers", function () {
    var result = plugin.claim("MP:0000001");
    assert.equal(result, 0)
});

it("claims proper-looking terms", function () {
    var result = plugin.claim("MGI:1234");
    assert.equal(result, 1)
});

it("construct urls differently for ids and searches", function () {
    var result = plugin.url("MGI:1234");
    assert.ok(result.includes("mousemodels"));
    var result2 = plugin.url("abcd");
    assert.ok(result2.includes("solr"));
});

it("processes search query without results", function () {
    var r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-empty.json').toString();
    var result = plugin.process(r0, 0);
    assert.equal(result.status, 0);
});

it("processes search query to extract MGI id", function () {
    var r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-Cog2.json').toString();
    var result = plugin.process(r0, 0);
    assert.equal(result.data, 'MGI:1923582')
});

it("processes search query to extract MGI id - 2", function () {
    var r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-Myo7a.json').toString();
    var result = plugin.process(r0, 0);
    // TO DO - extract the appropriate MGI id (if it is not the first one in the list)
    //assert.equal(result.data, 'MGI:1923582')
});

it("processes response into allele table", function () {
    var r0 = fs.readFileSync(__dirname+'/response-impc.models-0.json').toString();
    var result = plugin.process(r0, 0);
    // this example is for gene Gpa33
    assert.equal(result.data['IMPC models'].length, 1);
    assert.equal(result.data['Other models (MGI)'].length, 2)
    assert.ok(result.data['IMPC models'][0].includes('Gpa33'));
});

it("constructs external URL based on MGI id", function () {
    var result1 = plugin.external('Gene');
    var result2 = plugin.external('MGI:123');
    assert.ok(result1===null)
    assert.ok(result2.includes('genes'))
});
