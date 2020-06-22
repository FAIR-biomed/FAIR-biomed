/** Unit tests specific to STRING PPI network search **/

const assert = require('assert');
const plugin = require('./string.network');


it('claims long queries with varying strength', function () {
    assert.equal(plugin.claim('BRCA1'), 0.9);
    assert.equal(plugin.claim('RS1'), 0.9);
    assert.equal(plugin.claim('KRAS HRAS'), 0.5);
    assert.equal(plugin.claim('KRAS KRAS KRAS'), 1/3);
});

it('does not claim dbsnp identifiers', function () {
    assert.equal(plugin.claim('rs123'), 0);
});

it('claims more weakly when special characters are present', function () {
    let result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    let result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('generates external urls', function () {
    let result0 = plugin.external('TP53', 0);
    assert.ok(result0.includes("string-db.org"));
});
