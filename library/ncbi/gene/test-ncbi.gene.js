/** Unit tests specific to NCBI gene plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./ncbi.gene');

it('claims long queries with varying strength', function () {
    assert.equal(plugin.claim('Brca1'), 0.9);
    assert.equal(plugin.claim('breast cancer'), 0.5);
});

it('claims queries like human gene symbols', function () {
    assert.equal(plugin.claim('KRAS'), 0.95);
});

it('does not claim dbsnp ids', function () {
    assert.equal(plugin.claim('rs123'), 0);
});

it('generates different urls for round 1 and round 2', function () {
    let result1 = plugin.url('Gene', 0);
    let result2 = plugin.url('Gene', 1);
    assert.ok(result2.length !== result1.length)
});

it('extracts a single id from round 1 response', function() {
    let r1 = fs.readFileSync(__dirname+'/response-ncbi.gene-0.json').toString();
    let result = plugin.process(r1, 0);
    // round 1 should signal status not yet done <1
    assert.ok(result.status<1);
    // in this example, the most relevant hit is PTPN2, id 5771
    let hits = result.data.split(',');
    assert.ok(hits.length>2);
    assert.equal(hits[0], "5771");
    assert.equal(hits[1], "19255");
});

it('processes round 2 1 response', function() {
    let r2 = fs.readFileSync(__dirname+'/response-ncbi.gene-1.json').toString();
    let result = plugin.process(r2, 1);
    // round 1 should signal status not yet done <1
    assert.equal(result.status, 1);
    // in this example, the response only has details for one uid
    let hits = result.data
    assert.equal(hits.length, 1);
    // content should be another array with several items
    assert.ok(hits[0].length, 3);
    assert.ok(JSON.stringify(hits).includes("PTPN2"));
});

it('generates external urls based on round 1 query', function () {
    let result1 = plugin.external('Gene', 0);
    let result2 = plugin.external('Gene', 1);
    assert.ok(result2===null);
    assert.ok(result1.includes('Gene'));
});
