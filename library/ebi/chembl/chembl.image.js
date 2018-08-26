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

    var chembl = "https://www.ebi.ac.uk/chembl/"

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        return 0 + query.trim().startsWith("CHEMBL");
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return chembl + "api/data/image/" + query + "?format=svg&engine=indigo";
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        // expect a certain prefix
        var prefix = '<?xml version="1.0" encoding="UTF-8"?>\n';
        if (!data.startsWith(prefix)) {
            return {status: 0, data: "fail"};
        }
        return {status: 1, data: data.substr(prefix.length)};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return chembl + "beta/g/#search_results/all/query="+query;
    };

}();
