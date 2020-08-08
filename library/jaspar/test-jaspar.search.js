/** Unit tests specific to JASPAR TF motif search plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./jaspar.search');


it('claims long queries with varying strength', function () {
    let result1 = plugin.claim('SMAD3');
    assert.equal(result1, 0.9);
});

it('claims more weakly when special characters are present', function () {
    let result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('trims decimals in query ids', function () {
    let result1 = plugin.url('MA123.1');
    assert.ok(result1.includes("MA123"));
    assert.ok(!result1.includes("MA123.1"));
});

it('generates external urls', function () {
    let result = plugin.external('MA1622.1');
    assert.ok(result.includes('MA1622.1'))
});
