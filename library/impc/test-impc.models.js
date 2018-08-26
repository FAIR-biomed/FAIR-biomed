/** Unit tests specific to impc models plugin **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./impc.models');

it("does not claim long queries", function () {
    var result = plugin.claim("long text query");
    assert.equal(result, 0)
});

it("does not claim queries that don't start with MGI", function () {
    var result = plugin.claim("text");
    assert.equal(result, 0)
});

it("does not claim when 2nd part is not a number", function () {
    var result = plugin.claim("MGI:text");
    assert.equal(result, 0)
});

it("claims proper-looking terms", function () {
    var result = plugin.claim("MGI:1234");
    assert.equal(result, 1)
});

it("processes response into allele table", function () {
    var r0 = fs.readFileSync(__dirname+'/response-impc.models-0.json').toString();
    var result = plugin.process(r0, 0);
    // this example is for gene Gpa33
    assert.ok(result.data['Overview'].includes('IMPC'));
    assert.equal(result.data['Models'].length, 3);
    assert.ok(result.data['Models'][1].includes('Gpa33'));
});
