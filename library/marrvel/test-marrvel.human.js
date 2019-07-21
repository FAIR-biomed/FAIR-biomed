/** Unit tests specific to marrvel human plugin  **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./marrvel.human');

it("does not claim variants", function () {
    let result = plugin.claim("1-100-A-T");
    assert.equal(result, 0)
});

it("does not claim multi word items", function () {
    let result = plugin.claim("abc xyz");
    assert.equal(result, 0)
});

it("claims single word items", function () {
    let result = plugin.claim("FBXL4");
    assert.equal(result, 0.8)
});

it("processes standard response into series of tables", function () {
    let r0 = fs.readFileSync(__dirname+'/response-marrvel-human-0.json').toString();
    let result = plugin.process(r0, 1);
    let result_str = JSON.stringify(result);
    console.log(result_str);
    assert.equal(result.status, 1);
    assert.ok(result_str.includes("adipose"));
    assert.ok(result_str.includes("adipose"));
    assert.ok(result_str.includes("medium"));
});

it("gracefully handling of server-error ", function () {
    let r0 = '{"gos": []}';
    let result = plugin.process(r0, 1);
    assert.equal(result.status, 0);
});
