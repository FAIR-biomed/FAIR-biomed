/** Unit tests specific to ols plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./ebi.ols');


it("does not claim long queries", function () {
    assert.ok(plugin.claim("long text query")<0.4);
});

it("does not claim single words that don't look like ontology terms", function () {
    assert.ok(plugin.claim("sometext") < 0.8);
});

it("does not claim when 2nd part is not a number", function () {
    assert.ok(plugin.claim("MP:badkey")< 0.8);
});

it("claims proper-looking terms", function () {
    assert.equal(plugin.claim("MP:1234"), 0.95);
    assert.equal(plugin.claim("HPO:1234"), 0.95);
});

it('extracts result from response to ontology-term query', function() {
    var r0 = fs.readFileSync(__dirname+'/response-ebi.ols-0.json').toString();
    var result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 6);
    // this example is for term MP:0001262 which is "decreased body weight"
    var result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes('weight'))
});

it('extracts result from response to free-text query', function() {
    var r0 = fs.readFileSync(__dirname+'/response-ebi.ols-1.json').toString();
    var result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 6);
    // this example is for "transcription factor"
    var result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes('Regulation of'), "reglation");
    assert.ok(result_str.includes('Transcription factor'), "factor");
});
