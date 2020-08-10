/**
 * plugin for search of the ClinGen allele registry
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** variables **/
    this.id = 'clingen.registry';
    this.title = 'Allele Registry';
    this.subtitle = 'Clinical Genome Resource';
    this.tags = ['human', 'genetics', 'clinical'];

    /** accompanying resources **/
    this.logo = 'clingen-logo.png';
    this.info = 'clingen-info.html';

    // urls
    let api_base = 'http://reg.test.genome.network/alleles';
    let registry = api_base + '?name=';
    let genboree = 'http://reg.clinicalgenome.org/redmine/projects/registry/genboree_registry/';
    this.endpoints = [api_base];

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<4) return 0;
        if (qt.numWords(x)!=1) return 0;
        if (qt.isIdentifier(x, "CA")) return 1;
        if (qt.isIdentifier(x, "rs")) return 0.95;
        if (parseFloat(x)>0) return 0.9;
        return 0.8;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return registry+query.trim();
    };

    /** construct html summarizing genomic alleles **/
    var processGenomicAlleles = function(data) {
        let result = data.map(function(x) {
            if (x['referenceGenome'] == undefined) {
                return '';
            }
            let prefix = x['referenceGenome'] + ' ' + x['chromosome'];
            let position = x['coordinates'][0];
            let coord = position['start']
            if (position['end']!=position['start']+1) {
                coord += '-'+position['end'];
            }
            let change = position['referenceAllele'] + '&gt;' + position['allele'];
            return '<div>' + prefix + ':' + coord + ' ' + change + '</div>';
        });
        return '<p>' + result.join("") + '</p>';
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        if (data.trim()=="[]") {
            return { status: 0 }
        }
        let hits = JSON.parse(data);
        let result = hits.map(function(x) {
            let caid = x["@id"].split("/").pop();
            let url = genboree + 'by_caid?caid='+caid;
            return ['<h2><b><a href="'+url+'" target="_blank">'+caid+'</a></b></h2>',
                processGenomicAlleles(x['genomicAlleles'])].join('');
        });
        return { status: 1, data: result };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return genboree + 'alleles?name=' + query.trim();
    };

}();
