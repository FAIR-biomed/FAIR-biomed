/** Unit tests specific to wictionary plugin **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./wiktionary');


it('does not claim long queries', function () {
    let result = plugin.claim('long text query');
    assert.equal(result, 0)
});

it('claims single words (character-only)', function () {
    let result = plugin.claim('unbelievable');
    assert.equal(result, 0.8)
});

it('does not claim queries with fancy characters', function () {
    let result = plugin.claim('some:word');
    assert.equal(result, 0)
});

it('processes round 1 data', function() {
    let r1 = fs.readFileSync(__dirname+'/response-wiktionary-0.json').toString();
    let result = plugin.process(r1);
    assert.equal(result.status, 1);
    assert.ok(result.data.includes("short"), "Etymology");
});

it('processes round 1 data, signal empty result', function() {
    let r1 = fs.readFileSync(__dirname+'/response-wiktionary-1.json').toString();
    let result = plugin.process(r1);
    assert.equal(result.status, 0);
});

