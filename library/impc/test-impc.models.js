/** Unit tests specific to impc models plugin **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./impc.models');

it("does not claim long queries", function () {
    let result = plugin.claim("long text query");
    assert.equal(result, 0)
});

it("claims single-word queries that don't start with MGI", function () {
    let result = plugin.claim("text");
    assert.equal(result, 0.8)
});

it("does not claim when 2nd part is not a number", function () {
    let result = plugin.claim("MGI:text");
    assert.equal(result, 0)
});

it("does not claim other identifiers", function () {
    let result = plugin.claim("MP:0000001");
    assert.equal(result, 0)
});

it("claims proper-looking terms", function () {
    let result = plugin.claim("MGI:1234");
    assert.equal(result, 1)
});

it("construct urls differently for ids and searches", function () {
    let result = plugin.url("MGI:1234");
    assert.ok(result.includes("mousemodels"));
    let result2 = plugin.url("abcd");
    assert.ok(result2.includes("solr"));
});

it("processes search query without results", function () {
    let r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-empty.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("no hits"));
});

it("processes search query to extract MGI id", function () {
    let r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-Cog2.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.data, 'MGI:1923582')
});

it("processes search query to extract MGI id - 2", function () {
    let r0 = fs.readFileSync(__dirname + '/response-impc.models-symbol-Myo7a.json').toString();
    let result = plugin.process(r0, 0);
    // TO DO - extract the appropriate MGI id (if it is not the first one in the list)
    assert.equal(result.data, 'MGI:104510')
});

it("processes response into allele table", function () {
    let r0 = fs.readFileSync(__dirname+'/response-impc.models-0.json').toString();
    let result = plugin.process(r0, 0);
    // this example is for gene Gpa33
    assert.equal(result.data['IMPC models'].length, 1);
    assert.equal(result.data['Other models (MGI)'].length, 2);
    assert.ok(result.data['IMPC models'][0].includes('Gpa33'));
});

it("constructs external URL based on MGI id", function () {
    let result1 = plugin.external('Gene');
    let result2 = plugin.external('MGI:123');
    assert.ok(result1===null);
    assert.ok(result2.includes('genes'))
});
