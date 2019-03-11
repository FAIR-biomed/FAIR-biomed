/** Unit tests specific to STRING PPI network search **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./string.network');


it('claims long queries with varying strength', function () {
    var result1 = plugin.claim('BRCA1');
    var result2 = plugin.claim('KRAS HRAS');
    var result3 = plugin.claim('KRAS KRAS KRAS');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.5);
    assert.equal(result3, 1/3);
});

it('claims more weakly when special characters are present', function () {
    var result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    var result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('joins words into a single sequence for search url', function() {
    var r1 = plugin.url("TP53 EGFR");
    assert.ok(r1.includes("network"));
    assert.ok(r1.includes("TP53%0dEGFR"));
});

it('generates external urls', function () {
    var result0 = plugin.external('TP53', 0);
    assert.ok(result0.includes("string-db.org"));
});
