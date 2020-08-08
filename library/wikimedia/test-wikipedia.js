/** Unit tests specific to wikipedia plugin **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./wikipedia');


it('claims long queries with varying strength', function () {
    let result1 = plugin.claim('short query');
    let result2 = plugin.claim('very long text query');
    let result3 = plugin.claim('very long text query too long');
    assert.equal(result1, 0.5);
    assert.equal(result2, 0.25);
    assert.equal(result3, 0)
});

it('claims more weakly when special characters are present', function () {
    let result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    let result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('generates different urls for round 1 and round2', function () {
    let result1 = plugin.url('Gene', 0);
    let result2 = plugin.url('Gene', 1);
    assert.ok(result2.length > result1.length);
    assert.ok(result1.includes('opensearch'));
    assert.ok(result2.includes('extracts'));
});

it('processes initial round data', function() {
    let r1 = fs.readFileSync(__dirname+'/response-wikipedia-0.json').toString();
    let result = plugin.process(r1, 0);
    // round 1 should signal status not yet done <!
    assert.ok(result.status<1);
    // in this example, the best hit title is "Gene"
    assert.equal(result.data, "Gene");
});

it('processes second round data', function() {
    let r2 = fs.readFileSync(__dirname+'/response-wikipedia-1.json').toString();
    let result = plugin.process(r2, 1);
    // round 2 should signal processing is complete
    assert.equal(result.status, 1);
    // in this example, the best hit title is "Gene"
    assert.ok(result.data.includes("In biology"));
});

it('processes second round data, signals empty result', function() {
    let r2 = fs.readFileSync(__dirname+'/response-wikipedia-2.json').toString();
    let result = plugin.process(r2, 1);
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("no hits"));
});


it('generates external urls based on round 2 query', function () {
    let result1 = plugin.external('Gene', 0);
    let result2 = plugin.external('Gene', 1);
    assert.ok(result1 === null);
    assert.ok(result2.includes('Gene'))
});

