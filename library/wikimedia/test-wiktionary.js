/** Unit tests specific to wictionary plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./wiktionary')


it('does not claim long queries', function () {
    var result = plugin.claim('long text query')
    assert.equal(result, 0)
});

it('claims single words (character-only)', function () {
    var result = plugin.claim('unbelievable')
    assert.equal(result, 0.8)
});

it('does not claim queries with fancy characters', function () {
    var result = plugin.claim('some:word')
    assert.equal(result, 0)
});

it('processes round 1 data', function() {
    var r1 = fs.readFileSync(__dirname+'/response-wiktionary-0.json').toString();
    var result = plugin.process(r1);
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("short"), "Etymology");
});
