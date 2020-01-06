/** Unit tests specific to NCBI Clinvar plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./ncbi.clinvar');


it('does not claim extremely long queries', function () {
    assert.equal(plugin.claim('ignore more than four words'), 0.0);
});

it('claims long queries with varying strength', function () {
    // lowercase gene names - moderate claim
    assert.equal(plugin.claim('Brca1'), 0.8);
    // multi-word query - lower claim
    assert.equal(plugin.claim('breast cancer'), 0.5);
});

it('claims queries like human gene symbols', function () {
    assert.equal(plugin.claim('KRAS'), 0.9);
});

it('claims queries like variant accession numbers', function () {
    assert.equal(plugin.claim('VCV000663254'), 1);
});

it('claims genomic positions', function () {
    assert.equal(plugin.claim('10:123'), 0.95);
    assert.equal(plugin.claim('chr10:1234'), 0.95);
    assert.equal(plugin.claim('chr5:1,000,000'), 0.95);
});

it('claims genomic intervals', function () {
    assert.equal(plugin.claim('10:123-456'), 0.95);
    assert.equal(plugin.claim('chr10 1000 2000'), 0.95);
});

it('generates different urls for round 1 and round 2 (symbols)', function () {
    let result1 = plugin.url('LEPR', 0);
    let result2 = plugin.url('LEPR', 1);
    assert.ok(result2.length !== result1.length);
});

it('generates different urls for round 1 and round 2 (positions)', function () {
    let result1 = plugin.url('10:123', 0);
    let result2 = plugin.url('10:123', 1);
    assert.ok(result2.length !== result1.length);
});

it('generates urls with both genome37 and genome38', function () {
    let result = plugin.url('10:102030', 0);
    assert.ok(result.includes("37"));
    assert.ok(result.includes("38"));
});

it('generates urls without string chr', function () {
    let result = plugin.url('chr10 123', 0);
    assert.ok(!result.includes("chr10"));
});

it('detect response with no hits', function() {
    let r1 = fs.readFileSync(__dirname+'/response-ncbi.clinvar-0.json').toString();
    let result = plugin.process(r1, 0);
    assert.equal(result.status, 0);
});

it('extracts ids from first-round response', function() {
    let r1 = fs.readFileSync(__dirname+'/response-ncbi.clinvar-1.json').toString();
    let result = plugin.process(r1, 0);
    // round 1 should signal status not yet done <1
    assert.ok(result.status<1);
    // the results should be a list of ids
    let hits = result.data.split(',');
    assert.ok(hits.length>2);
    assert.equal(hits[0], "663254");
    assert.equal(hits[1], "623732");
});

it('extracts ids from second-round response (SNV)', function() {
    let r2 = fs.readFileSync(__dirname+'/response-ncbi.clinvar-2.json').toString();
    let result = plugin.process(r2, 1);
    assert.equal(result.status, 1);
    // the results should include trait name, significance, location
    let rstr = JSON.stringify(result.data);
    assert.ok(rstr.includes("Search results"));
    assert.ok(rstr.includes("Barakat"));
    assert.ok(rstr.includes("Uncertain"));
    assert.ok(rstr.includes("GRCh38"));
});

it('extracts ids from second-round response (deletion)', function() {
    let r2 = fs.readFileSync(__dirname+'/response-ncbi.clinvar-deletion.json').toString();
    let result = plugin.process(r2, 1);
    assert.equal(result.status, 1);
    // the results should include trait name and significance
    var rstr = JSON.stringify(result.data);
    assert.ok(rstr.includes("Search results"));
    assert.ok(rstr.includes("syndrome"));
    assert.ok(rstr.includes("Pathogenic"));
    assert.ok(rstr.includes("GRCh37"));
});

it('stop at round 1 if many hits', function() {
    let r1 = fs.readFileSync(__dirname+'/response-ncbi.clinvar-many.json').toString();
    let result = plugin.process(r1, 0);
    assert.equal(result.status, 1);
    // the results should show a message about number of hits
    var rstr = JSON.stringify(result.data);
    assert.ok(rstr.includes("Search results"));
});
