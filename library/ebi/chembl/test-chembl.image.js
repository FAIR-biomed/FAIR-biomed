/** Unit tests specific to chembl image plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./chembl.image');


it("claims long terms (for search)", function () {
    var long = ["Savolitinib", "Binimetinib"];
    long.map(function(x) {
        assert.deepEqual(plugin.claim(x), 0.7, x);
    });
});

it("claims short terms weakly ", function () {
    var short = ["BRAF", "CHEM5"];
    short.map(function(x) {
        assert.deepEqual(plugin.claim(x), 0.3, x);
    });
    var veryshort = ["abc", "xy"];
    veryshort.map(function(x) {
        assert.deepEqual(plugin.claim(x), 0, x);
    });
});

it("claims CHEMBL ids", function () {
    var good = ["CHEMBL25", "CHEMBL20001"];
    good.map(function(x) {
        assert.deepEqual(plugin.claim(x), 1, x);
    })
});

it("processes response by stripping <?xml ... ?>", function () {
    var response = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg version="1.1"><path d="M 463.394,230.199 463.394,131.623" /></svg>';
    var result = plugin.process(response);
    assert.deepEqual(result.status, 1);
    assert.deepEqual(result.data.substr(0, 4), "<svg");
});

it('extracts CHEMBL id from search', function() {
    var r1 = fs.readFileSync(__dirname+'/response-chembl.compound.search-0.json').toString();
    var result = plugin.process(r1, 0);
    assert.equal(result.status, 0.5);
    // this example has Aspirin
    assert.equal(result.data, "CHEMBL25");
});
