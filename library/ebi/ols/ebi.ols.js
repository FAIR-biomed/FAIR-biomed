/**
 * plugin for EBI's Ontology Lookup Service
 */


module.exports = new function() {

    /** variables **/
    this.id = 'ebi.ols';
    this.title = 'Ontology Lookup Service';
    this.subtitle = 'Map ontology codes to descriptions';
    this.tags = ['ontology', 'biomedical'];

    /** accompanying resources **/
    this.logo = 'ols-logo.jpg';
    this.info = 'ebi.ols-info.html';

    var ols = 'https://www.ebi.ac.uk/ols/';

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        var words = query.trim().split(':');
        if (words.length!=2) {
            return 0;
        }
        if (isNaN(words[1])) {
            return 0;
        }
        return 0.95;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.trim().split(':').join('_');
        return ols + 'api/search?q='+query+'&rows=1';
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        var raw = JSON.parse(data);
        var docs = raw['response']['docs'][0]
        var result = {}
        result['Label'] = docs['label']
        try {
            result['Description'] = docs['description'].join('; ')
        } catch(e) {
            result['Description'] = docs['description']
        }
        return {status: 1, data: result};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        query = query.trim().split(' ').join('%20');;
        return ols + 'search?q='+query
    };

}();


