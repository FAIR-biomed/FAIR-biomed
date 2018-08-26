/** Unit tests specific to uniprot search plugin **/

var assert = require('assert');
var plugin = require('./uniprot.search')


it('claims short queries', function () {
    assert.equal(plugin.claim('insulin'), 0.9)
});

it('claims other queries weakly', function () {
    var result1 = plugin.claim('interleukin 6')
    var result2 = plugin.claim('alpha beta%');
    var result3 = plugin.claim('very very long name');
    assert.equal(result1, 0.5)
    assert.equal(result2, 0.3);
    assert.equal(result3, 0)
});

it ('parses response table', function() {
    var r1 = "Entry	Entry name	Status	Protein names	Gene names	Organism	Length"
    var r2 = "P08069	IGF1R_HUMAN	reviewed	Insulin-like growth factor 1 receptor   IGF1R	Homo sapiens (Human)	1367"
    var response = r1+'\n'+r2;
    var result = plugin.process(response)
    assert.equal(typeof(result.data), 'object')
    assert.equal(result.status, 1)
})

