/**
 * plugin for EBI's Ontology Lookup Service
 */

module.exports = new function() {

    /** variables **/
    this.id = 'ebi.ols';
    this.title = 'Ontology Lookup Service';
    this.subtitle = 'Ontology terms and descriptions';
    this.tags = ['ontology', 'biomedical'];

    /** accompanying resources **/
    this.logo = 'ols-logo.jpg';
    this.info = 'ebi.ols-info.html';

    let ols = 'https://www.ebi.ac.uk/ols/';
    this.endpoints = [ols + 'api/search'];

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length==0) return 0;
        // try see if this is an identifier
        let parts = query.split(":");
        if (parts.length==2 && !isNaN(parts[1])) return 0.95;
        // for other queries, use a sliding scale
        let words = query.split(" ");
        return Math.max(0, 0.75/words.length);
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return ols + 'api/search?q='+query.trim()+'&rows=6';
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        let raw = JSON.parse(data);
        let docs = raw['response']['docs'];
        if (docs.length === 0) {
            return { status: 0 };
        }
        let result = docs.map(function(x) {
            let desc = x['description'];
            if (desc === undefined) {
                desc = [];
            }
            desc = desc.join(";");
            return [
                ['',''],
                ['Term', '<a href="'+x['iri']+'" target="_blank">'+x['short_form']+'</a>'],
                ['Label', x['label']],
                ['Description', desc],
                ['Ontology', x['ontology_name']]
            ];
        });
        return {status: 1, data: result};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        query = query.trim().split(' ').join('%20');
        return ols + 'search?q='+query
    };

}();
