/**
 * plugin for EBI's Chembl Compound Image
 */

module.exports = new function() {

    /** variables **/
    this.id = "chembl.image";
    this.title = "ChEMBL";
    this.subtitle = "Compound structure (image)";
    this.tags = ["chemistry", "compound", "structure"];

    /** accompanying resources **/
    this.logo = 'ChEMBL_clear.png';
    this.info = "chembl-info.html";

    let chembl = "https://www.ebi.ac.uk/chembl/";
    this.endpoints = [chembl + "api/data/image/*"];

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.startsWith('CHEMBL')) return 1;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return chembl + 'api/data/image/' + query + '?format=svg';
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let prefix = '<?xml';
        if (data.startsWith(prefix)) {
            return {status: 1, data: data.substr(data.search("<svg")) };
        }
        return { status: 0 };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return chembl + "beta/g/#search_results/all/query="+query;
    };

}();
