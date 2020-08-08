/** Unit tests specific to LNCipedia search plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./lncipedia.search');

it('claims long queries with varying strength', function () {
    let result1 = plugin.claim('HOTAIR');
    let result2 = plugin.claim('ENSG00000228630');
    assert.equal(result1, 0.8);
    assert.equal(result2, 0.8);
});

it('claims more weakly when special characters are present', function () {
    let result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    let result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('generates external urls', function () {
    let result = plugin.external('HOTAIR');
    assert.ok(result.includes('HOTAIR'))
});
