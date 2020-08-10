/** Unit tests specific to panelapp plugin **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./panelapp.entities');

it("does not claim long queries", function () {
    let result = plugin.claim("rare disease");
    assert.equal(result, 0)
});

it("does not claim identifiers", function () {
    let result = plugin.claim("HGNC:1234");
    assert.equal(result, 0)
});

it("penalizes special characters", function () {
    let result = plugin.claim("abc#$2");
    assert.ok(result < 0.7);
});

it("claims single-word queries", function () {
    let result = plugin.claim("ABC");
    assert.equal(result, 0.8)
});

it("construct urls to api", function () {
    let result = plugin.url("BRAF");
    assert.ok(result.includes("api"));
});

it("processes search query to extract id", function () {
    let r0 = fs.readFileSync(__dirname + '/response-entities-0.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 3);
});

it("processes empty search result", function () {
    let empty = fs.readFileSync(__dirname + '/response-entities-empty.json').toString();
    let result = plugin.process(empty, 0);
    assert.equal(result.status, 0);
});

