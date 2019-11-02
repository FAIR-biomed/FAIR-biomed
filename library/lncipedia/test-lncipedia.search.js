/** Unit tests specific to JASPAR TF motif search plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./lncipedia.search');


it('claims long queries with varying strength', function () {
    var result1 = plugin.claim('HOTAIR');
    var result2 = plugin.claim('ENSG00000228630');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.9);
});

it('claims more weakly when special characters are present', function () {
    var result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    var result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});


it('generates external urls', function () {
    var result = plugin.external('HOTAIR');
    assert.ok(result.includes('HOTAIR'))
});
