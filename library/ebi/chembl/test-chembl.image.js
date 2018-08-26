/** Unit tests specific to chembl image plugin **/

var assert = require('assert');
var plugin = require('./chembl.image');


it("does not claim long queries", function () {
    var bad = ["not-a-drug", "CHEM5", "-CHEMBL25"]
    bad.map(function(x) {
        assert.deepEqual(plugin.claim(x), 0, x);
    })
});

it("claims compounds", function () {
    var good = ["CHEMBL25", "CHEMBL20001"]
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

