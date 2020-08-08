/**
 * tools used by plugins to help parse query strings
 *
 * Note that most of the functions provide "guesses" based only on the
 * input provided. So, for example, function isGeneSymbol can make a guess
 * whether or not a string represents a gene symbol, but does not validate
 * that guess with a database lookup.
 *
 * **/


module.exports = new function() {

    /**
     * guess if input could be a gene symbol
     * @param x string
     * @returns {boolean}
     */
    this.isGeneSymbol = function (x) {
        x = x.trim();
        if (x.length<2) return false;
        if (x.split(" ").length>1) return false;
        if (x.split(":").length>1) return false;
        if (!isNaN(parseFloat(x))) return false;
        return true;
    };

    /**
     * guess if input could be a set of gene symbols
     * @param x string
     * @returns {number} number of gene symbols in the string
     */
    this.isGeneSet = function (x) {
        let result = x.split(" ").map(this.isGeneSymbol);
        return result.reduce((total, a) => { return total + a; });
    };

    /**
     * guess if input is an identifier, e.g. prefix:number
     * @param x string
     * @param prefix string, including colon when needed
     * @returns {boolean}
     */
    this.isIdentifier = function (x, prefix="ABC:") {
        x = x.trim();
        let words = x.split(" ");
        if (words.length>1) return false;
        if (!x.startsWith(prefix)) return false;
        words = x.split(prefix);
        if (words.length!==2) return false;
        return !isNaN(parseFloat(words[1]));
    };

    /**
     * parse a string into component for using as a genomic interval
     * @param x
     * @returns {string[]}
     */
    this.parseGenomic = function (x) {
        x = x.replace(/,/g, '');
        let result = x.split(/:|-|\s/).map((x) => x.trim());
        result = result.filter(x => (x!==''));
        if (result.length>1) {
            result[1] = parseInt(result[1]);
        }
        if (result.length>2) {
            result[2] = parseInt(result[2]);
        }
        return result;
    };

    /**
     * guess if input represents a genomic position (chr:position)
     * @param x string
     * @returns {boolean}
     */
    this.isGenomicPosition = function (x) {
        let words = this.parseGenomic(x);
        if (words.length!==2) return false;
        if (isNaN(words[1])) return false;
        return true;
    };

    /**
     * guess if input represents a genomic interval (chr:start-end)
     * @param x string
     * @returns {boolean}
     */
    this.isGenomicInterval = function (x) {
        let words = this.parseGenomic(x);
        if (words.length!==3) return false;
        if (isNaN(words[1]) || isNaN(words[2])) return false;
        return true;
    };

    /**
     * produce a score that penalizes certain characters
     * @param x string
     * @param penalty number, score decreases by this amount for each character
     * type listed in the penalize array
     * @param penalize array of character to penalize
     * @returns {number} score in [0, 1]
     */
    this.scoreQuery = function(x,
                               penalty=0.2,
                               penalize=["#", "$", "%", ":", ";", "&", "?"]) {
        let result = 1;
        penalize.map(function(z) {
            result -= penalty*(x.includes(z))
        });
        return Math.max(0, result);
    };

    /**
     * count the number of words (separated by a space) in a string
     *
     * @param x string
     * @return {number} number of words in the string
     */
    this.numWords = function(x) {
        return x.split(" ").length;
    }
}();

