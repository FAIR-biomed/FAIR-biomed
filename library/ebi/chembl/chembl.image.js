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
    this.endpoints = [
        chembl + "api/data/image/*",
        chembl + "glados-es/chembl_molecule/_search",
    ];

    /** helper checks if a string is a valid id, e.g. CHEMBL25 **/
    this.isChemblId = function(query) {
        return query.startsWith('CHEMBL');
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length < 4) return 0;
        if (this.isChemblId(query)) return 1;
        // long queries can be a drug names, short names possibly gene names
        // so claim long words more strongly
        let parts = query.split(" ");
        if (parts.length==1 && query.length > 6) return 0.7;
        if (parts.length==2 && query.length > 12) return 0.6;
        return 0.6/parts.length;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        if (this.isChemblId(query)) {
            return chembl + 'api/data/image/' + query + '?format=svg&engine=indigo';
        }
        query = query.replace(' ', '%20');
        return chembl + 'glados-es/chembl_molecule/_search?q='+query;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        // check whether response is an image; return image
        let prefix = '<?xml version="1.0" encoding="UTF-8"?>\n';
        if (data.startsWith(prefix)) {
            return {status: 1, data: data.substr(prefix.length)};
        }
        // assume it is a search result
        let result = JSON.parse(data);
        let hits = result['hits']['hits'];
        return {status: 0.5, data: hits[0]['_id']};
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return chembl + "beta/g/#search_results/all/query="+query;
    };

}();
