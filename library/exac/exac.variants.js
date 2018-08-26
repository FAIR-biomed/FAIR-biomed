/**
 * plugin for Exac variant lookup
 */


module.exports = new function() {

    /** variables **/
    this.id = 'exac.variants';
    this.title = 'ExAC Variants';
    this.subtitle = 'Variants in humans';
    this.tags = ['human', 'genetics', 'population'];

    /** accompanying resources **/
    this.logo = 'exac-screenshot-logo.png';
    this.info = 'exac-info.html';

    var atcg = 'ATCG';

    /** helper function to determine if a string is ATCG **/
    var isATCG = function(x) {
        var ok = true;
        var ok = x.split('').map((x)=> atcg.includes(x))
        return ok.every((x)=>x>0);
    }

    /** helpers convert a raw query string into exac-format **/
    var q2words = function(query) {
        // remove some known contaminant characters
        query = query.replace(/,|\\.|chr/g, '')
        // split into tokens
        var words = query.split(/:|-|\/|\s/).map((x)=>x.trim());
        return words.filter(x=> (x!=='') );
    }
    var q2string = function(query) {
        return q2words(query).join('-');
    }

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        // require query to have four parts, e.g. '1:1234 A G'
        var words = q2words(query);
        if (words.length!=4) return 0;
        if (isNaN(words[1])) return 0;
        if (!isATCG(words[2]) | !isATCG(words[3])) return 0;
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        var api = 'http://exac.hms.harvard.edu/rest/variant/'
        return api + q2string(query)
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        var response = JSON.parse(data);
        var v = response['variant']
        var conseq = response["consequence"]
        // raw result (assumes no consequence variant, will change below)
        var result = {
            Consequence: 'none reported',
            Frequency: 'NA',
            Coverage: ''+response['any_covered']
        }
        if (conseq!==null) {
            var keys = Object.keys(conseq).map(x => x.replace(/_/g, ' '));
            result['Consequence'] = keys.join(", ");
        }
        if (conseq!==null) {
            var keys = Object.keys(conseq).map(x => x.replace(/_/g, ' '));
            result['Consequence'] = keys.join(", ");
        }
        if (typeof v["allele_freq"] !== 'undefined') {
            var freq = v['allele_freq']
            result['Frequency'] = Number.parseFloat(freq).toPrecision(4);
        }
        return {status: 1, data: result};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return 'http://exac.broadinstitute.org/variant/' + q2string(query)
    };

}();


