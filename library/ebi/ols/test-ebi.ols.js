/** Unit tests specific to ols plugin **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./ebi.ols');


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
    let r0 = fs.readFileSync(__dirname+'/response-ebi.ols-0.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 6);
    // this example is for term MP:0001262 which is "decreased body weight"
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes('weight'))
});

it('extracts result from response to free-text query', function() {
    let r0 = fs.readFileSync(__dirname+'/response-ebi.ols-1.json').toString();
    let result = plugin.process(r0, 0);
    assert.equal(result.status, 1);
    assert.equal(result.data.length, 6);
    // this example is for "transcription factor"
    var result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes('Regulation of'), "regulation");
    assert.ok(result_str.includes('Transcription factor'), "factor");
});

it('extracts result when description is empty', function() {
    // some results in example 2 have no description field
    let r0 = fs.readFileSync(__dirname+'/response-ebi.ols-2.json').toString();
    let result = plugin.process(r0, 0);
    // processing should succeed even though some items don't have a description
    assert.equal(result.status, 1);
    let result_str = JSON.stringify(result.data);
    // check that there is some output
    assert.ok(result_str.includes('phenotype'),  'phenotype')
});

