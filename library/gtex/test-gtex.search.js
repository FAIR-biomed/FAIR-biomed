/** Unit tests specific to uniprot2 search plugin **/

var assert = require('assert');
var plugin = require('./gtex.search')
var fs = require("fs-extra");

it('check successfully substituting gene name to ensembl ID', function () {
    var result_erap2 = plugin.url('ERAP2', 0);
    var result_slk = plugin.url('SLK', 0);
    var result_tnf = plugin.url('SLK', 0);
    let r1 = fs.readFileSync(__dirname+'/tnf_test.json').toString();
    var result_tnf_process = plugin.process(r1, 0);

    assert.equal(result_erap2, 'https://gtexportal.org/rest/v1/reference/gene?geneId=ERAP2&gencodeVersion=v26&genomeBuild=GRCh38%2Fhg38&pageSize=250&format=json')
    assert.equal(result_slk, 'https://gtexportal.org/rest/v1/reference/gene?geneId=SLK&gencodeVersion=v26&genomeBuild=GRCh38%2Fhg38&pageSize=250&format=json')
    assert.equal(JSON.stringify(result_tnf_process), '{"status":0.5,"data":"ENSG00000232810.3"}')
});

it('check output once index is 1, Ensembl ID', function () {
    var result_tnf = plugin.url('ENSG00000232810.3', 1);
    let r1 = fs.readFileSync(__dirname+'/ENSG00000164308.16_test.json').toString();
    var result_ens_process = plugin.process(r1, 1);

    assert.ok(JSON.stringify(result_ens_process).includes("36.6"))
});

it('generates different urls for round 1 and round 2', function () {
    let result1 = plugin.url('Gene', 0);
    let result2 = plugin.url('Gene', 1);
    assert.ok(result2.length !== result1.length)
});
