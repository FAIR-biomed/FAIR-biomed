/** Unit tests for tools available to the plugins */

let assert = require('assert');
let querytools = require('../library/_querytools.js');


describe('Query tools', function () {

    it('isGeneSymbol accepts genes, rejects sets, numbers', function () {
        // possible gene symbols
        assert.equal(querytools.isGeneSymbol("abc"), true);
        assert.equal(querytools.isGeneSymbol("abc2"), true);
        // not gene symbols
        assert.equal(querytools.isGeneSymbol("a"), false);
        assert.equal(querytools.isGeneSymbol("ab:123"), false);
        assert.equal(querytools.isGeneSymbol("abc xyz"), false);
        assert.equal(querytools.isGeneSymbol("25"), false);
        assert.equal(querytools.isGeneSymbol("0.5"), false);
    });

    it('isGeneSet counts number of gene symbols', function () {
        assert.equal(querytools.isGeneSet("abc xyz"), 2);
        assert.equal(querytools.isGeneSet("abc2"), 1);
        // the following returns 1 because "x" does not quality as a gene
        assert.equal(querytools.isGeneSet("abc2 x"), 1);
    });

    it('isIdentifier recognizes identifiers', function () {
        // well-formed identifiers
        assert.equal(querytools.isIdentifier("AB:123", "AB:"), true);
        assert.equal(querytools.isIdentifier("AB:123.3", prefix="AB:"), true);
        assert.equal(querytools.isIdentifier("XYZ001", prefix="XYZ"), true);
        // not well-formed identifiers
        assert.equal(querytools.isIdentifier("ABCD", "XY:"), false);
        assert.equal(querytools.isIdentifier("AB:XYZ", "AB:"), false);
    });

    it('parseGenomicPosition cleans up punctuation', function () {
        // single positions (cleans commas)
        let position = querytools.parseGenomic("chr1:123,456");
        assert.equal(position[0], "chr1");
        assert.equal(position[1], 123456);
        // intervals (cleans commas, punctuation)
        let interval = querytools.parseGenomic("chr1:10,000 -20,000.");
        assert.equal(interval[0], "chr1");
        assert.equal(interval[1], 10000);
        assert.equal(interval[2], 20000);
    });

    it('isGenomicPosition recognizes chr:position', function () {
        // well-formed positions
        assert.equal(querytools.isGenomicPosition("chr1:123"), true);
        assert.equal(querytools.isGenomicPosition("chr1:123,456"), true);
        assert.equal(querytools.isGenomicPosition("MT:1234"), true);
        // not well-formed positions
        assert.equal(querytools.isGenomicPosition("abcd"), false);
        assert.equal(querytools.isGenomicPosition("chr1:"), false);
        assert.equal(querytools.isGenomicPosition("chr2:abc"), false);
        assert.equal(querytools.isGenomicPosition("chr1:100-200"), false);
    });

    it('isGenomicInterval recognizes chr:start-end', function () {
        // well-formed positions
        assert.equal(querytools.isGenomicInterval("chr1:100-200"), true);
        assert.equal(querytools.isGenomicInterval("chr1:1,000-2,000"), true);
        assert.equal(querytools.isGenomicInterval("MT 200 400"), true);
        // not well-formed positions
        assert.equal(querytools.isGenomicInterval("abcd"), false);
        assert.equal(querytools.isGenomicInterval("chr1:100"), false);
        assert.equal(querytools.isGenomicInterval("chr1:100-end"), false);
        assert.equal(querytools.isGenomicInterval("chr1:100-"), false);
    });

    it('scoreQuery produces scores that penalize special characters', function () {
        // scores with default parameters
        assert.equal(querytools.scoreQuery("abc"), 1.0);
        assert.ok(querytools.scoreQuery("abc#2")<0.81);
        assert.ok(querytools.scoreQuery("abc:123")< 0.81);
        assert.ok(querytools.scoreQuery("abc#2$")< 0.61);
        assert.ok(querytools.scoreQuery("abc#2$%&?;")>= 0.0);
        // scores with custom penalties
        assert.ok(querytools.scoreQuery("abc#4$1", ["#", "$"], 0.4)< 0.4);
        assert.ok(querytools.scoreQuery("abc$4$1", ["#"], 0.4)> 0.5);
    });
});

