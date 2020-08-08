/**
 * library plugin for PubChem search for compounds
 */

let qt = require("../../_querytools.js");
let msg = require("../../_messages.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'pubchem.search';
    this.title = 'PubChem';
    this.subtitle = 'Chemical compounds';
    this.tags = ['chemistry', 'compounds', 'drugs'];

    /** accompanying resources **/
    this.logo = 'pubchem_logo.png';
    this.info = 'pubchem-info.html';

    // parts of api urls
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=pccompound&retmax=8&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    this.endpoints = [eutils + 'esearch.fcgi', eutils + 'esummary.fcgi'];

    let id2link = function(id) {
        return 'https://pubchem.ncbi.nlm.nih.gov/compound/' + id;
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        if (qt.numWords(x)>2) return 0;
        if (qt.isIdentifier(x, "CHEMBL")) return 1;
        return Math.min(0.9, qt.scoreQuery(x)/qt.numWords(x));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let words = query.split(' ');
        let url = eutils;
        if (index === 0 || typeof(index)==='undefined') {
            url += 'esearch.fcgi?term=' + words.join('+')
        } else if (index === 1) {
            url += 'esummary.fcgi?id=' + words.join(',')
        }
        return url + suffix;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            result = result['esearchresult']['idlist'];
            if (result.length>0) {
                return { status: 0.5, data: result.join(',') };
            } else {
                return { status: 1, data: msg.empty_server_output };
            }
        } else if (index === 1) {
            let uids = result['result']['uids'];
            let compounds = uids.map(function(x) {
                let xdata = result['result'][x];
                let xid = xdata['uid'];
                let xnames = xdata['synonymlist'];
                let xname = xnames[0];
                if (xnames.length>1)
                    xname += '; '+(xnames.length-1) + ' synonym';
                if (xnames.length>2)
                    xname += 's';
                return [
                    ['', ''],
                    ['Compound', '<a href="'+id2link(xid)+'" target="_blank">' + xname+ '</a>'],
                    ['IUPAC name', xdata['iupacname']],
                    ['Molecular weight', xdata['molecularweight'] + " g/mol"],
                    ['Molecular formula', xdata['molecularformula']]
                ]
            });
            return { status: 1,  data: compounds}
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index>0) return null;
        query = query.trim().split(" ");
        return 'https://pubchem.ncbi.nlm.nih.gov/#query=' + query.join("%20");
    };

}();

