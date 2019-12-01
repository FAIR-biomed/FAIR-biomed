/** Unit tests for library build */

let assert = require('assert');

let is = require('../src/app/js/common.js');


describe('Common module', function () {

    it('detects strings, numbers, booleans', function () {
        assert.equal(is.string("aa"), true)
        assert.equal(is.string({a: 2}), false)
        assert.equal(is.string(null), false)
        assert.equal(is.number(23), true)
        assert.equal(is.number({}), false)
        let bb = true;
        assert.equal(is.boolean(bb), true)
        assert.equal(is.boolean({}), false)
    });

    it('detects objects, null, undefined', function () {
        let o1 = {a:3};
        let num = 23;
        let nn = null;
        assert.equal(is.object(o1), true);
        assert.equal(is.object(num), false);
        assert.equal(is.null(o1), false);
        assert.equal(is.null(nn), true);
        assert.equal(is.undefined(nn), false);
        assert.equal(is.undefined(o1["a"]), false);
        assert.equal(is.undefined(o1["b"]), true);
    });

    it ('detects arrays and nested arrays', function() {
        let s = "abc";
        assert.equal(is.array(s), false);
        assert.equal(is.array1(s), false);
        assert.equal(is.array2(s), false);
        let a1 = [1,2,3];
        assert.equal(is.array(a1), true);
        assert.equal(is.array1(a1), true);
        assert.equal(is.array2(a1), false);
        let a2 = [['',''],[1,2],[3,4]];
        assert.equal(is.array(a2), true);
        assert.equal(is.array1(a2), false);
        assert.equal(is.array2(a2), true);
        let a3 = [];
        assert.equal(is.array(a3), true);
        assert.equal(is.array1(a3), true);
        assert.equal(is.array2(a3), false)
    });

    it ('detects functions', function() {
        let myfun = function(x) {
            return x+1;
        }
        let oo = {};
        assert.equal(is.function(myfun), true)
        assert.equal(is.function(oo.myfun), false)
    });

    it ('summarized numeric content in a string', function() {
        assert.equal(is.quasiNumeric(""), false);
        assert.equal(is.quasiNumeric("abc"), false);
        assert.equal(is.quasiNumeric('1234'), true);
        // mixed item is not quasi-numeric by default
        assert.equal(is.quasiNumeric('rs12345'), false);
        // but it can be with a low threshold
        assert.equal(is.quasiNumeric('rs12345', 0.5), true);
    });

});

