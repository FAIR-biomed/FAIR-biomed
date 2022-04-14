/** Objects loaded by both content and background scripts **/


/**
 * Functions for checking type
 * (Some overlap with npm package 'is', but these are fairly generic
 */
const is = new function() {

    // simple typeof checks
    this.array = (x) => (typeof(x) === 'object') && ((x) instanceof Array)
    this.boolean = (x) => typeof(x) === 'boolean'
    this.function = (x) => typeof(x) === 'function'
    this.null = (x) => typeof(x) === 'object' && x===null
    this.number = (x) => typeof(x) === 'number'
    this.object = (x) => typeof(x) === 'object'
    this.string = (x) => typeof(x) === 'string'
    this.undefined = (x) => typeof(x) === 'undefined'

    // variants that do multiple checks
    // array1 checks if x contains only basic types
    this.array1 = function(x) {
        if (!this.array(x)) {
            return false
        }
        return !this.array2(x)
    }
    // array2 check if x contains arrays as elements
    this.array2 = function(x) {
        if (!this.array(x)) {
            return false
        }
        if (x.length===0) {
            return false
        }
        return this.array(x[0])
    }

    this.digits = new Set(['0', '1', '2', '3', '4',
        '5', '6', '7', '8', '9'])
    // quasiNumeric determines if a string contains several characters [0-9]
    this.quasiNumeric = function(x, threshold) {
        if (typeof(threshold) === 'undefined') {
            threshold = 1
        }
        if (x.length<1) return false

        let hits = x.split('').filter(x => this.digits.has(x))
        return (hits.length / x.length) >= threshold
    }

}()


/**
 * Summarizes what proportion of a string is made of [0-9]
 * @returns {number}
 */
const numberContent = function() {
    return 0
}


// this export is in an "if" block so that the file can work:
//  - as-is in the browser
//  - as a module for testing
if (typeof module !== 'undefined') {
    module.exports.is = module.exports = is
}

