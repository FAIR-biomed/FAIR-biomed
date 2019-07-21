/**
 * plugin for fetching data from MARRVEL on human genes (phenotypes and expression)
 */


module.exports = new function() {

    /** variables **/
    this.id = 'marrvel.human';
    this.title = 'Human gene function';
    this.subtitle = 'GO and GTEx';
    this.tags = ['human', 'gene', 'expression', 'tissue', 'ontology', 'GO'];

    /** accompanying resources **/
    this.logo = 'marrvel1.2.png';
    this.info = 'marrvel-info.html';

    // urls for API and external pages
    let api_url = 'http://marrvel.org/data/human?geneSymbol=';
    let gene_url = 'http://marrvel.org/search/gene/';
    let gtex_url = 'https://gtexportal.org/home/gene/';
    let hgnc_url = 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/';

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length<2 || query.length>30) return 0;
        if (query.split(' ').length !== 1) return 0;
        if (query.split("-").length > 2) return 0;
        let words = query.split(':');
        if (words.length === 1) return 0.8;
        return 0.5;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return api_url + query.trim()
    };

    /** (helpers) arrange info from raw object into tables **/
    this.makeExpressionData = function(data) {
        // prepare the individual sections
        let hgnc = data["hgncId"];
        let hgnc_link = '<a href="' + hgnc_url + hgnc+ '" target="_blank">HGNC:'+hgnc+'</a>';
        //let gtex_link = '<a href="' + gtex_url+ symbol + '" target="_blank">'+symbol+'</a>';
        let summary = [
            ["",""],
            ["Gene summary", hgnc_link],
            ["Expression", ""]
        ];
        let phens = [["GO", "Phenotype"]];
        phens = phens.concat(data["gos"].map((row) => {
            return [row["goId"], row["goTerm"]]
        }));
        let express = [["Organ", "Expression level"]];
        express = express.concat(data["expression"].map((row)=> {
            return [row["organ"], row["class"]];
        }));
        // assemble the final output
        let result = {};
        result["Phenotypes"] = phens;
        result["Expression"] = express;
        result["Links"] = summary;
        return result;
    };

    /** transform a raw result from an API call into a second query or a display object **/
    this.process = function(data, index) {
        let raw = JSON.parse(data);
        if (raw["hgncId"] === undefined) {
            return { status: 0, data: "No results" };
        }
        let result = this.makeExpressionData(raw);
        return { status: 1, data: result };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return gene_url + query.trim();
    };
}();
