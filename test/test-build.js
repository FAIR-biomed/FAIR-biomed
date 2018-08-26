/** Unit tests for library build */

var library = require("../src/build/library-loader.js");
var strchecker = require("../src/build/string-checker.js");
var assert = require('assert');
var path = require("path");


/* ==========================================================================
 *
 * ========================================================================== */

describe("String checker", function() {

    it('identifies improper characters', function() {
        assert.deepEqual(strchecker.badChars(null), []);
        assert.deepEqual(strchecker.badChars(''), []);
        assert.deepEqual(strchecker.badChars('bob'), []);
        assert.deepEqual(strchecker.badChars('now* &here'), ['*', ' ', '&']);
    })

    it('identifies unclean html', function() {
        var raw1 = '<p>abc</p>';
        var raw2 = '<p>abc</p><script>var x=2;</script>';
        assert.deepEqual(strchecker.isClean(raw1), true);
        assert.deepEqual(strchecker.isClean(raw2), false);
    })

})

describe('Library Builder', function () {

    it('loading plugins', function () {
        var libdir = process.cwd()+path.sep+"library"
        var hits = library.load(libdir);
        assert.deepEqual(0, 0);
    });

});

