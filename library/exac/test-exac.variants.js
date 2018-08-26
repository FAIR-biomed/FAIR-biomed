/** Unit tests specific to exac.variants **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./exac.variants');


it("does not claim non-variant queries", function () {
    var bad = ["bob", "four but non variant", "22 1000 X Y"];
    bad.map(function(x) {
        assert.equal(plugin.claim(x), 0);
    })
});

it("claims variant queries (allows malformations)", function () {
    var examples = ["1:1234 A T", "1 1234 G T", " 11:76869348 G / A", "chr11:76,839,310 T-C"];
    examples.map(function(x) {
        assert.equal(plugin.claim(x), 1, x);
    })
});

var prefix = __dirname + '/response-exac.variants-';

it("parses response when variant consequence is null", function() {
    // read in api response from a file
    var rdata = fs.readFileSync(prefix+'noconsequence.json').toString();
    var result = plugin.process(rdata);
    assert.equal(result.status, 1);
    assert.equal(typeof(result.data), "object")
    assert.deepEqual(result.data['Coverage'], 'true')
    assert.ok(result.data['Consequence'].includes('none'))
});

it("parses response when position has no coverage", function() {
    // read in api response from a file
    var rdata = fs.readFileSync(prefix+'nocov.json').toString();
    var result = plugin.process(rdata);
    assert.equal(result.status, 1);
    assert.equal(typeof(result.data), "object")
    assert.deepEqual(result.data['Coverage'], 'false')
    assert.ok(result.data['Consequence'].includes('none'))
});

it("parses response when position has data", function() {
    // read in api response from a file
    var rdata = fs.readFileSync(prefix+'0.json').toString();
    var result = plugin.process(rdata);
    assert.equal(result.status, 1);
    //console.log(JSON.stringify(result.data));
    assert.equal(typeof(result.data), "object")
    assert.deepEqual(result.data['Coverage'], 'true')
    assert.ok(result.data['Consequence'].includes('exon'))
});

