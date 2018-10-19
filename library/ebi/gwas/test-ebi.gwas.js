/** Unit tests specific to EBI GWAS catalog **/

var assert = require('assert');
var fs = require('fs-extra');
var plugin = require('./ebi.gwas');

it("does not claim plain text queries", function () {
    assert.equal(plugin.claim("long text query"), 0);
    assert.equal(plugin.claim("ABCDE"), 0);
});

it("does not claim pure numeric queries", function () {
    assert.equal(plugin.claim("1234"), 0);
});

it("claims dbSNP ids", function() {
    assert.equal(plugin.claim("rs1234"), 1);
    assert.equal(plugin.claim("rs-1234"), 1)
});

it("processes a valid response", function () {
    var raw = fs.readFileSync(__dirname + '/response-gwas-snp-0.json').toString();
    var result = plugin.process(raw, 0);
    console.log(JSON.stringify(result));
    assert.equal(result.status, 1);
    var associations = result.data["Associations"];
    assert.equal(associations.length, 2);
    // both hits are for PTPN2
    assert.ok(associations[0].includes('PTPN2'));
    assert.ok(associations[1].includes('PTPN2'));
    // one of the associations is for cancer
    assert.ok(associations[0].includes('carcinoma'));
});
