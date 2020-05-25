/** Unit tests specific to UCSC genome browser **/

const assert = require('assert');
const plugin = require('./ucsc.genomebrowser');


it('claims genomic sites', function () {
    // claims weaker than 1 because sites can be confused with identifiers (HGNC:123)
    assert.equal(plugin.claim('chr1:123'), 0.9);
    assert.equal(plugin.claim('chr1 123'), 0.9);
    assert.equal(plugin.claim('X 456'), 0.9);
    assert.equal(plugin.claim("Y 123,456"), 0.9);
});

it('does not claim very short or very long queries', function () {
    assert.equal(plugin.claim('A B C D E'), 0, "query with too any parts");
    assert.equal(plugin.claim('ABC'), 0, "single-word query");
});

it('claims genomic intervals', function () {
    assert.equal(plugin.claim('chr1:123-456'), 1);
    assert.equal(plugin.claim('chr1 123 456'), 1);
    assert.equal(plugin.claim('2 1,000,000 2,000,000'), 1);
});

it('does not claim non-numerical', function () {
    assert.equal(plugin.claim('chr1:456 1000'), 1, "interval is proper");
    assert.equal(plugin.claim('chr1:456 abcd'), 0, "interval is not numeric");
});

it('processes a site into an object', function () {
    let result = plugin.process("chr1:123");
    assert.equal(result.status, 1);
});

it('processes an interval into an object', function () {
    let result = plugin.process("chr1:123-456");
    assert.equal(result.status, 1);
});
