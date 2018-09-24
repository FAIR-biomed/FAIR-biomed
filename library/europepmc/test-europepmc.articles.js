/** Unit tests specific to Europe PMC article search plugin **/

var assert = require('assert');
var fs = require("fs-extra");
var plugin = require('./europepmc.articles')


it('claims long queries with varying strength', function () {
    var result1 = plugin.claim('BRCA1');
    var result2 = plugin.claim('breast cancer');
    assert.equal(result1, 0.9);
    assert.equal(result2, 0.5);
});

it('claims more weakly when special characters are present', function () {
    var result1 = plugin.claim('test #number');
    assert.ok(result1 < 1/2 && result1 >= 0);
    var result2 = plugin.claim('#many$bad:chars%');
    assert.ok(result2 < 0.4 && result2 >=0)
});

it('extracts articles from round a typical response', function() {
    var r1 = fs.readFileSync(__dirname+'/response-europepmc-a.json').toString();
    var result = plugin.process(r1, 0);
    assert.equal(result.status, 1);
    // this example has two hits
    assert.equal(result.data.length, 2);
    assert.ok(result.data[0].includes('MED'));
    assert.ok(result.data[1].includes('cancer'));
})

it('extracts titles from preprint response', function() {
    var r2 = fs.readFileSync(__dirname+'/response-europepmc-b.json').toString();
    var result = plugin.process(r2);
    assert.equal(result.status, 1);
    // this example has a single hit (a preprint article)
    assert.equal(result.data.length, 1);
    assert.ok(result.data[0].includes('preprint'));
})

it('generates external urls', function () {
    var result1 = plugin.external('Gene');
    assert.ok(result1.includes('Gene'))
});
