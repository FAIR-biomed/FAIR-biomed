/** Unit tests specific to Reactome pathway search plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./reactome.pathways');


it('claims long queries with varying strength', function () {
    var result1 = plugin.claim('BRCA1');
    var result2 = plugin.claim('KRAS HRAS');
    var result3 = plugin.claim('KRAS KRAS KRAS');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.5);
    assert.equal(result3, 0);
});

it('claims more weakly when special characters are present', function () {
    var result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    var result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('extracts reactome id from a first-round response', function() {
    var r1 = fs.readFileSync(__dirname+'/response-pathways-0.json').toString();
    var result = plugin.process(r1, 0);
    assert.ok(result.status<1);
    assert.equal(result.data, "R-HSA-198861");
});

it('extracts pathways from second round response', function() {
    var r2 = fs.readFileSync(__dirname+'/response-pathways-1.json').toString();
    var result = plugin.process(r2, 1);
    assert.equal(result.status, 1);
})

it('generates external urls', function () {
    var result0 = plugin.external('Gene', 0);
    assert.ok(result0 == null);
    var result1 = plugin.external('R-HSA-198861', 1);
    assert.ok(result1.includes('198861'));
});
