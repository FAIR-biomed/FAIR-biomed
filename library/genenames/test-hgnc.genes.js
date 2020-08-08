/** Unit tests specific to hgnc genes plugin (some parts borrowed from the IMPC plugin) **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./hgnc.genes');

it("does not claim long queries", function () {
    let result = plugin.claim("long text query");
    assert.equal(result, 0)
});

it("claims HGNC identifiers", function () {
    let result = plugin.claim("HGNC:1234");
    assert.equal(result, 1)
});

it("claims single-word queries that don't start with HGNC", function () {
    let result = plugin.claim("abc");
    assert.equal(result, 0.8)
});

it("does not claim when 2nd part is not a number", function () {
    let result = plugin.claim("HGNC:text");
    assert.equal(result, 0)
});

it("does not claim other identifiers", function () {
    let result = plugin.claim("MP:0000001");
    assert.equal(result, 0)
});

it("construct urls differently for ids and searches", function () {
    let result = plugin.url("HGNC:1097");
    assert.ok(result.includes("fetch"));
    let result2 = plugin.url("BraF");
    assert.ok(result2.includes("search"));
});

it("processes search query to extract id", function () {
    let r0 = fs.readFileSync(__dirname + '/response-hgnc-0.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.status, 0.5);
    assert.equal(result.data, 'HGNC:1097');
});

it("processes response into table of data", function () {
    let r0 = fs.readFileSync(__dirname+'/response-hgnc-1.json').toString();
    let result = plugin.process(r0, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("BRAF"));
});

it("processes response into table without gene groups", function () {
    let r0 = fs.readFileSync(__dirname+'/response-hgnc-2.json').toString();
    let result = plugin.process(r0, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("TP53"));
});

it("processes response into table without omim", function () {
    let r0 = fs.readFileSync(__dirname+'/response-hgnc-3.json').toString();
    let result = plugin.process(r0, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("PRR25"));
});

it("constructs external URL based on HGNC id", function () {
    let result1 = plugin.external('BRAF');
    let result2 = plugin.external('HGNC:1097');
    assert.ok(result1===null);
    assert.ok(result2.includes('symbol-report'));
});

it("processes empty search result", function () {
    let empty = fs.readFileSync(__dirname + '/response-hgnc-empty.json').toString();
    let result = plugin.process(empty, 0);
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("no hits"));
});

