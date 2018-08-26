/** Objects loaded by both content and background scripts **/


/**
 * Functions for checking type
 * (Some overlap with npm package 'is', but these are fairly generic
 */
var is = new function() {

    // simple typeof checks
    this.array = (x) => (typeof(x) === 'object') && ((x) instanceof Array);
    this.boolean = (x) => typeof(x) === 'boolean';
    this.function = (x) => typeof(x) === 'function';
    this.null = (x) => typeof(x) === 'object' && x===null;
    this.number = (x) => typeof(x) === 'number';
    this.object = (x) => typeof(x) === 'object';
    this.string = (x) => typeof(x) === 'string';
    this.undefined = (x) => typeof(x) === 'undefined';

    // variants that do multiple checks
    // array1 checks if x contains only basic types
    this.array1 = function(x) {
        if (!this.array(x)) {
            return false;
        }
        return !this.array2(x);
    };
    // array2 check if x contains arrays as elements
    this.array2 = function(x) {
        if (!this.array(x)) {
            return false;
        }
        if (x.length===0) {
            return false;
        }
        return this.array(x[0])
    }

}();


// this export is in an "if" block so that the file can work:
//  - as-is in the browser
//  - as a module for testing
if (typeof module !== 'undefined') {
    module.exports.is = module.exports = is;
}

