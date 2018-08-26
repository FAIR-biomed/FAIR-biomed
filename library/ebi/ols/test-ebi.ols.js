/** Unit tests specific to ols plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./ebi.ols');


it("does not claim long queries", function () {
    var result = plugin.claim("long text query")
    assert.equal(result, 0)
});

it("does not claim single words that don't look like ontology terms", function () {
    var result = plugin.claim("sometext")
    assert.equal(result, 0)
});

it("does not claim when 2nd part is not a number", function () {
    var result = plugin.claim("MP:badkey")
    assert.equal(result, 0)
});

it("claims proper-looking terms", function () {
    var result = plugin.claim("MP:1234")
    assert.equal(result, 1)
});

it('extracts field from response', function() {
    var r0 = fs.readFileSync(__dirname+'/response-ebi.ols-0.json').toString();
    var result = plugin.process(r0, 0);
    // this example is for term MP:0001262 which is "decreased body weight"
    assert.ok(result.data['Label'].includes('weight'))
    assert.ok(result.data['Description'].includes('weight'));
})
