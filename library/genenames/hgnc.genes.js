/**
 * plugin for HGNC gene
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** variables **/
    this.id = 'hgnc.genes';
    this.title = 'Human genes';
    this.subtitle = 'Approved human gene nomenclature';
    this.tags = ['human', 'gene', 'hgnc'];

    /** accompanying resources **/
    this.logo = 'hgnc-light-bkgrd-no-txt.svg';
    this.info = 'hgnc-info.html';

    // urls for API and external pages
    let search_url = 'http://rest.genenames.org/search/';
    let fetch_url = 'http://rest.genenames.org/fetch/hgnc_id/';
    this.endpoints = [search_url + '*', fetch_url + '*'];

    let www_url = 'https://www.genenames.org/';
    let report_url = www_url + 'data/gene-symbol-report/#!/hgnc_id/';
    // links to additional resources (used within the results data)
    let group_url = 'https://www.genenames.org/data/genegroup/#!/group/';
    let orpha_url = 'https://www.orpha.net/consor/cgi-bin/OC_Exp.php?Expert=';
    let omim_url = 'https://www.omim.org/entry/';
    let cosmic_url = 'https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=';

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        if (qt.numWords(x)>1) return 0;
        if (qt.isIdentifier(x, "HGNC:")) return 1;
        return Math.min(0.8, qt.scoreQuery(x));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.trim();
        if (!query.startsWith("HGNC:")) {
            return search_url + query;
        }
        let words = query.split(":");
        return fetch_url + words[1];
    };

    /** (helper) extract gene info and arrange it into a table **/
    this.processGene = function(doc) {
        // helper function to construct <a> links to external resources
        id_url = function(url, id) {
            if (id === undefined) return '';
            return '<a href="' + url + id + '" target="_blank">' + id + '</a>';
        };
        // construct a set of links pointing to disease resources and gene groups
        let omim = '', orpha = '', cosmic = '';
        if (doc["omim"] !== undefined) {
            omim = id_url(omim_url, doc['omim'][0]);
        }
        if (doc['orphanet'] !== undefined) {
            orpha = id_url(orpha_url, doc['orphanet'])
        }
        if (doc['cosmic']!== undefined) {
            cosmic = id_url(cosmic_url, doc['cosmic']);
        }
        let group_text = [''];
        if (doc['gene_group_id'] !== undefined) {
            group_text = doc['gene_group_id'].map((group_id, index) => {
                return '<a href="'+group_url+group_id+'" target="_blank">' + doc['gene_group'][index] + '</a>';
            });
        }
        let result = [
                ['', ''],
                ['Id', doc['hgnc_id']],
                ['Approved symbol', doc['symbol']],
                ['Approved name', doc['name']],
                ['Locus type', doc['locus_type']],
                ['Genome location', doc['location']],
                ['Gene groups', group_text.join('<br/>')],
                ['ORPHANET', orpha],
                ['OMIM', omim],
                ['COSMIC', cosmic]
            ];
        return {status: 1, data: [result]};
    };

    /** transform a raw result from an API call into a second query or a display object **/
    this.process = function(data, index) {
        let result = (JSON.parse(data))['response'];
        if (result['numFound']==0) {
            return { status: 0 };
        }
        let doc = result['docs'][0];
        if (doc["name"] == undefined) {
            return { status: 0.5, data: doc['hgnc_id'] };
        } else {
            return this.processGene(doc);
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (query.length<1) return www_url;
        if (query.startsWith("HGNC:")) {
            return report_url + query;
        }
        return www_url + "tools/search/#!/all?query=" + query.split(" ").join("%20");
    };

}();
