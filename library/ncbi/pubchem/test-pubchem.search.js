/** Unit tests specific to Pubchem compound search plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./pubchem.search');


it('claims long queries with varying strength', function () {
    let result1 = plugin.claim('aspirin');
    let result2 = plugin.claim('EGFR inhibitor');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.5);
});

it('claims more weakly when special characters are present', function () {
    let result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    let result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('generates different urls for round 1 and round 2', function () {
    let result1 = plugin.url('aspirin', 0);
    let result2 = plugin.url('aspirin', 1);
    assert.ok(result2.length !== result1.length)
});

it('extracts ids from round 1 response', function() {
    let r1 = fs.readFileSync(__dirname+'/response-pubchem.search-0.json').toString();
    let result = plugin.process(r1, 0);
    // round 1 should signal status not yet done <1
    assert.ok(result.status < 1);
    assert.ok(JSON.stringify(result).includes("66250"));
});

it('extracts titles from round 2 response', function() {
    let r2 = fs.readFileSync(__dirname+'/response-pubchem.search-1.json').toString();
    let result = plugin.process(r2, 1);
    console.log(JSON.stringify(result));
    assert.equal(result.status, 1);
    assert.ok(result.data.length > 1);
    assert.ok(JSON.stringify(result).includes("aspirin"));
});

