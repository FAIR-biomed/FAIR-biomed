/**
- * plugin for IMPC mouse model lookup
 */


module.exports = new function() {

    /** variables **/
    this.id = 'impc.models';
    this.title = 'Mouse Models';
    this.subtitle = 'Phenotypes from IMPC and MGI';
    this.tags = ['mouse', 'phenotype', 'gene', 'allele'];

    /** accompanying resources **/
    this.logo = 'impc-logo.png';
    this.info = 'impc-info.html';

    // address of solr server for search queries
    let solr= 'https://www.ebi.ac.uk/mi/impc/solr/phenodigm/select?q=';
    let suffix = '&wt=json&fq=type:gene';
    // address for phenodigm2 query
    let mousephenotype = 'https://www.mousephenotype.org/';
    let pd2 = mousephenotype + 'data/phenodigm2/mousemodels?geneId=';

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length<2) return 0;
        // avoid multi-word queries
        if (query.split(' ').length!=1) return 0;
        // weakly accept single-word queries
        let words = query.split(':');
        if (words.length==1) return 0.8;
        // for identifier, require strings like 'MGI:1234'
        if (words.length!=2 || words[0]!=='MGI')  return 0;
        if (isNaN(words[1])) return 0;
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.trim();
        if (query.startsWith('MGI')) {
            return pd2+query;
        } else {
            return solr+query+suffix;
        }
    };

    /** (helper) extract model info and phenotypes from a phenodigm2 ajax response **/
    processModels = function(raw) {
        // produce html descriptor for a model and its phenotypes
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

    /** (helper) extract one MGI id from a solr search response **/
    processSearch = function(raw) {
        let docs = raw['response']['docs'];
        // look for mouse genes only, sort by length of gene symbol
        docs = docs.filter(function(x) {
            return x['gene_id'] != undefined;
        }).sort(function(a, b) {
            return a['gene_id'].length - b['gene_id'].length;
        });
        if (docs.length==0) return {status:0, data: "no results" };
        return {status:0.5, data: docs[0]['gene_id'] }
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let raw = JSON.parse(data);
        // identify whether this is a solr response or from the phenodigm2 api
        if (raw["response"] == undefined) {
            return processModels(raw);
        } else {
            return processSearch(raw);
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (query.length<1) {
            return mousephenotype;
        }
        if (query.startsWith("MGI")) {
            return mousephenotype + 'data/genes/'+query;
        }
        return null;
    };

}();
