/** Unit tests specific to ensembl genome browser plugin  **/

let assert = require('assert');
let fs = require('fs-extra');
let plugin = require('./ensembl.browser');

it("does not claim multi word items", function () {
    assert.equal(plugin.claim("abc xyz"), 0)
});

it("claims single gene symbols", function () {
    assert.equal(plugin.claim("KRAS"), 0.8)
});

it("claims HGNC gene ids", function () {
    assert.equal(plugin.claim("HGNC:1234"), 0.8)
});

it("claims ensembl gene ids", function () {
    assert.equal(plugin.claim("ENSG00000133703"), 1)
});

it("claims genomic positions and genomic intervals", function () {
    assert.equal(plugin.claim("chr1:12,456"), 0.8);
    assert.equal(plugin.claim("chr1:12,456-23,456"), 0.8);
});

it("processes translation from gene symbol to gene id", function() {
    // read in api response from a file
    let rfile = __dirname + "/response-ensembl-browser-0.json";
    let rdata = fs.readFileSync(rfile).toString();
    let result = plugin.process(rdata, 0);
    assert.equal(result.status, 0.5);
    assert.equal(result.data.substr(0, 4), "ENSG");
});

it("processes empty translation into an informative message", function() {
    let result = plugin.process("[]", 0);
    assert.equal(result.status, 0);
});

it("processes gene information into a table", function() {
    // read in api response from a file
    let rfile = __dirname + "/response-ensembl-browser-1.json";
    let rdata = fs.readFileSync(rfile).toString();
    let result = plugin.process(rdata, 1);
    assert.equal(result.status, 1);
    // main result is an array / table, with a header and at least one row
    assert.ok(result.data[0].length>2);
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes("protein"));
});

it("processes a genomic region into a table", function() {
    // read in api response from a file
    let result = plugin.process("1:123-456", 0);
    assert.equal(result.status, 1);
    // main result is an array / table, with a header and one row
    assert.equal(result.data[0].length, 2);
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes("123"));
});

it("processes a genomic position into a table", function() {
    // read in api response from a file
    let result = plugin.process("1:99,300", 0);
    assert.equal(result.status, 1);
    // main result is an array / table, with a header and one row
    assert.equal(result.data[0].length, 2);
    let result_str = JSON.stringify(result.data);
    assert.ok(result_str.includes("99200"));
    assert.ok(result_str.includes("99400"));
});

