/**
 * plugin for IMPC mouse model lookup
 */


module.exports = new function() {

    /** variables **/
    this.id = 'impc.models';
    this.title = 'Mouse Models';
    this.subtitle = 'Phenotypes from IMPC and MGI';
    this.tags = ['mouse', 'mice', 'phenotype', 'gene', 'allele'];

    /** accompanying resources **/
    this.logo = 'impc-logo.png';
    this.info = 'impc-info.html';

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        // require query to be two-part string like 'MGI:1234'
        var words = query.split(':');
        if (words.length!=2 || words[0]!=='MGI') {
            return 0;
        }
        if (isNaN(words[1])) {
            return 0;
        }
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        var api = 'https://www.mousephenotype.org/data/phenodigm2/mousemodels'
        var url = api + '?geneId='+query;
        return url;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        // raw response will be an array
        var raw = JSON.parse(data);
        // helper function to produce list items
        format1 = function(x) {
            var phenotypes = x['phenotypes'].map(p => p['term']).join(', ');
            var desc = x['description'].replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<h3>'+desc+'</h3><p>'+phenotypes+'</p>';
        }
        var result = {};
        result['IMPC models'] = raw.filter(x => x['source']!=='MGI').map(format1)
        result['Other models (MGI)'] = raw.filter(x => x['source']==='MGI').map(format1)
        return {status: 1, data: result};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return 'https://www.mousephenotype.org/data/genes/'+query
    };

}();


