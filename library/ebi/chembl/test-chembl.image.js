/** Unit tests specific to chembl image plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./chembl.image');


it("claims long single words", function () {
    var long = ["Savolitinib", "Binimetinib"];
    long.map(function(x) {
        assert.equal(plugin.claim(x), 0.7, x);
    });
});

it("claims short terms weakly ", function () {
    var short = ["BRAF", "CHEM5"];
    short.map(function(x) {
        let result = plugin.claim(x);
        assert.ok(result>0 && result<0.7, x);
    });
    var veryshort = ["abc", "xy"];
    veryshort.map(function(x) {
        assert.equal(plugin.claim(x), 0, x);
    });
});

it("claims multi-word query weakly", function () {
    var long = ["a b", "gene five", "transcription factor binding"];
    long.map(function(x) {
        assert.ok(plugin.claim(x) < 0.4);
    });
});

it("claims CHEMBL ids", function () {
    var good = ["CHEMBL25", "CHEMBL20001"];
    good.map(function(x) {
        assert.equal(plugin.claim(x), 1, x);
    })
});

it("processes response by stripping <?xml ... ?>", function () {
    var response = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg version="1.1"><path d="M 463.394,230.199 463.394,131.623" /></svg>';
    var result = plugin.process(response);
    assert.equal(result.status, 1);
    assert.equal(result.data.substr(0, 4), "<svg");
});

it('extracts CHEMBL id from search', function() {
    var r1 = fs.readFileSync(__dirname+'/response-chembl.compound.search-0.json').toString();
    var result = plugin.process(r1, 0);
    assert.equal(result.status, 0.5);
    // this example has Aspirin
    assert.equal(result.data, "CHEMBL25");
});
