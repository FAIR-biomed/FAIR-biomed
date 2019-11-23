/** Unit tests for library build */

let library = require("../src/build/library-loader.js");
let strchecker = require("../src/build/string-checker.js");
let assert = require('assert');
let path = require("path");


describe("String checker", function() {

    it('identifies improper characters', function() {
        assert.deepEqual(strchecker.badChars(null), []);
        assert.deepEqual(strchecker.badChars(''), []);
        assert.deepEqual(strchecker.badChars('bob'), []);
        assert.deepEqual(strchecker.badChars('now* &here'), ['*', ' ', '&']);
    });

    it('identifies unclean html', function() {
        let raw1 = '<p>abc</p>';
        let raw2 = '<p>abc</p><script>var x=2;</script>';
        assert.deepEqual(strchecker.isClean(raw1), true);
        assert.deepEqual(strchecker.isClean(raw2), false);
    });

});


describe('Library Builder', function () {

    it('loading plugins', function () {
        let libdir = process.cwd()+path.sep+"library";
        let hits = library.load(libdir);
        assert.ok(hits.length, 0);
    });

});

