/** Unit tests specific to marrvel omim plugin  **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./marrvel.omim');

it("does not claim variants", function () {
    let result = plugin.claim("1-100-A-T");
    assert.equal(result, 0)
});

it("does not claim multi word items", function () {
    let result = plugin.claim("abc xyz");
    assert.equal(result, 0)
});

it("claims single word items", function () {
    let result = plugin.claim("FBXL4");
    assert.equal(result, 0.8)
});

it("processes response into table without gene groups", function () {
    let r0 = fs.readFileSync(__dirname+'/response-marrvel-omim-0.json').toString();
    let result = plugin.process(r0, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("mutation 1"));
    assert.ok(result_str.includes("mutation 2"));
    assert.ok(result_str.includes("Phenotype Name"));
});

it("gracefully handling of server-error ", function () {
    let r0 = '{"message": "Server error occurred"}';
    let result = plugin.process(r0, 1);
    assert.equal(result.status, 1);
});

it("processes response when no phenotypes", function () {
    let r1 = fs.readFileSync(__dirname+'/response-marrvel-omim-1.json').toString();
    let result = plugin.process(r1, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("but"));
});

it("processes response with missing fields", function () {
    let r1 = fs.readFileSync(__dirname+'/response-marrvel-omim-2.json').toString();
    let result = plugin.process(r1, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result);
    assert.ok(result_str.includes("missing"));
});
