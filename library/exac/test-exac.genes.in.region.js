/** Unit tests specific to exac.genes.in.region **/

var assert = require('assert');
var path = require("path");
var fs = require("fs-extra");
var plugin = require('./exac.genes.in.region')

it("does not claim non-variant queries", function () {
    var bad = ["bob", "four but non variant", "X:Y-Z"]
    bad.map(function(x) {
        assert.equal(plugin.claim(x), 0);
    })
});

it("claims region queries (allows malformations)", function () {
    var examples = ["1:1234-23400", "X 1234 900", "chr1:22,333-22,444"]
    examples.map(function(x) {
        assert.equal(plugin.claim(x), 1, x);
    })
});

it("converts queries into -separated strings", function() {
    assert.equal(plugin.q2string("1:123-456"), "1-123-456");
})

it("parses response into several tables", function() {
    // read in api response from a file
    var rfile = __dirname+"/response-exac.genes.in.region-0.json";
    var rdata = fs.readFileSync(rfile).toString();
    var result = plugin.process(rdata);
    assert.equal(result.status, 1);
    var data = result.data["PPARA"]
    assert.equal(typeof(data), "object")
    // data should be an array of arrays
    // first element is the header, here empty
    assert.deepEqual(data[0], [])
    assert.ok(data.length>3, "outbut table should have a few rows")
    assert.deepEqual(data[1][0], "Name");
    assert.deepEqual(data[2][0], "Id");
})
