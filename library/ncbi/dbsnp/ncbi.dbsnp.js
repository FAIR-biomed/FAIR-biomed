/**
 * library plugin for NCBI dbSNP search
 */

let qt = require("../../_querytools.js");
let msg = require("../../_messages.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ncbi.dbsnp';
    this.title = 'NCBI dbSNP';
    this.subtitle = 'Polymorphisms';
    this.tags = ['variants', 'polymorphism', 'SNP', 'population'];

    /** accompanying resources **/
    this.logo = 'large-Blue_ncbi_logo195h.png';
    this.info = 'ncbi.dbsnp-info.html';

    // parts of api urls
    let dbsnp = 'https://www.ncbi.nlm.nih.gov/snp/';
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=snp&retmax=99999&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    this.endpoints = [eutils + 'esearch.fcgi', eutils + 'esummary.fcgi'];


    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        let num_words = query.trim().split(" ").length;
        if (num_words>1) return 0;
        if (qt.isIdentifier(query, "rs")) return 1;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let result = eutils;
        if (index === 0 || typeof(index)==='undefined') {
            result += 'esearch.fcgi?term=' + query.trim();
        } else {
            result += 'esummary.fcgi?id='+query.trim();
        }
        return result + suffix;
    };

    this.makeSNPsummary = function(data) {
        let result = {};
        let genes = data['genes'].map((x) => x["name"]);
        let fxc = data["fxn_class"].replace(/,/g, ", ").replace(/_/g, " ");
        let snp = [
            ['', ''],
            ['ID', "rs"+data['snp_id']],
            ['Position (GrCh38)', data['chrpos']],
            ['Position (GrCh37)', data['chrpos_prev_assm']],
            ['Genes', genes.join(", ")],
            ['Gene consequence', fxc],
            ['Clinical significance', data['clinical_significance']]
        ];
        let mafs = data["global_mafs"].map(function(x) {
            let freq = x["freq"];
            return [x["study"], freq.substr(0, freq.indexOf('/'))];
        });
        result["Polymorphism"] = snp;
        result["Frequency"] = [['', '']].concat(mafs);
        return result;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            let idlist = result['esearchresult']['idlist'];
            if (idlist.length>0) {
                // only identify the top hit, ignore the rest
                return {status: 0.5, data: idlist[0]};
            } else {
                return { status: 1, data: msg.empty_server_output };
            }
        }
        let id = result["result"]["uids"][0];
        result = this.makeSNPsummary(result["result"][id]);
        return {status: 1, data: result}
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index>0) return null;
        return dbsnp + query.trim();
    };

}();
