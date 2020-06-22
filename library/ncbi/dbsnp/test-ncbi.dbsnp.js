/** Unit tests specific to NCBI dbSNP plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./ncbi.dbsnp');


it('does not claim non-rs strings', function () {
    assert.equal(plugin.claim('abc def'), 0.0);
    assert.equal(plugin.claim('aaa'), 0.0);
    assert.equal(plugin.claim('MT:123'), 0.0);
    assert.equal(plugin.claim('1:100-200'), 0.0);
});

it('does not claim multiple rs ids', function () {
    assert.equal(plugin.claim('rs123 rs456'), 0.0);
});

it('claims rs ids', function () {
    assert.equal(plugin.claim('rs123'), 1);
    assert.equal(plugin.claim('rs000123'), 1);
});

it('generates search url', function () {
    let result = plugin.url("rs123");
    assert.ok(result.includes("search"));
    assert.ok(result.includes("rs123"));
});

it('extracts ids from first-round response', function() {
    let r2 = fs.readFileSync(__dirname+'/response-ncbi.dbsnp-0.json').toString();
    let result = plugin.process(r2, 0);
    assert.equal(result.status, 0.5);
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes("57332242"));
});

it('extracts study MAF from second-round response', function() {
    let r2 = fs.readFileSync(__dirname+'/response-ncbi.dbsnp-1.json').toString();
    let result = plugin.process(r2, 1);
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes("24926827"));
    assert.ok(result_str.includes("GnomAD"));
});
