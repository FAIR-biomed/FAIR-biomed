/** Unit tests specific to HOCOMOCO TF motif search plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./hocomoco.search');

it('pass', function(){
    assert.equal(0, 0);
});

it('claims long queries with varying strength', function () {
    var result1 = plugin.claim('SMAD3');
    var result2 = plugin.claim('Homeo domain');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.5);
});

it('claims more weakly when special characters are present', function () {
    var result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    var result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});


it('generates external urls', function () {
    var result = plugin.external('P53_HUMAN.H11MO.0.A');
    assert.ok(result.includes('P53_HUMAN.H11MO.0.A'))
});
