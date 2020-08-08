/** Unit tests specific to uniprot search plugin **/

let assert = require('assert');
let plugin = require('./uniprot.search');
let fs = require("fs-extra");

it('claims short queries', function () {
    assert.equal(plugin.claim('insulin'), 0.9)
});

it('claims other queries weakly', function () {
    let result1 = plugin.claim('interleukin 6');
    let result2 = plugin.claim('alpha beta%');
    let result3 = plugin.claim('very very long name');
    assert.equal(result1, 0.5);
    assert.ok(result2<0.5);
    assert.ok(result3<0.4)
});

it ('parses response table', function() {
    let r1 = "Entry	Entry name	Status	Protein names	Gene names	Organism	Length";
    let r2 = "P08069	IGF1R_HUMAN	reviewed	Insulin-like growth factor 1 receptor   IGF1R	Homo sapiens (Human)	1367";
    let response = r1+'\n'+r2;
    let result = plugin.process(response);
    assert.equal(typeof(result.data), 'object');
    assert.equal(result.status, 1)
});

it('signals when response is empty', function () {
    let result = plugin.process("", 1);
    assert.ok(JSON.stringify(result).includes("no hits"))
});
