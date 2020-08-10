/**
 * plugin for displaying links to the ensembl genome browser
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** variables **/
    this.id = 'ensembl.browser';
    this.title = 'Ensembl genome browser';
    this.subtitle = 'Gene summary and genome browser';
    this.tags = ['human', 'gene', 'genome', 'hg38'];

    /** accompanying resources **/
    this.logo = 'e-ensembl.png';
    this.info = 'ensembl-info.html';

    // urls for API and external pages
    let ensembl_url = 'https://www.ensembl.org/';
    let api_base = 'https://rest.ensembl.org/';
    let xref_url = api_base + '/xrefs/symbol/homo_sapiens/';
    let lookup_url = api_base + '/lookup/id/';
    this.endpoints = [xref_url, lookup_url];

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        if (qt.isIdentifier(query, "ENSG")) return 1;
        if (qt.isIdentifier(query, "HGNC:")) return 0.8;
        if (qt.isGenomicPosition(query)) return 0.8;
        if (qt.isGenomicInterval(query)) return 0.8;
        if (qt.isGeneSymbol(query)) return 0.8;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let suffix = '?content-type=application/json';
        if (index===0 && qt.isIdentifier(query, "HGNC:")) {
            return xref_url + query.trim() + suffix;
        }
        // if the query is for a genomic interval, url returns null
        // this signals the query will pass directly to process
        if (qt.isGenomicPosition(query) || qt.isGenomicInterval(query)) return null;
        let result = (index===0) ? xref_url : lookup_url;
        return result + query.trim() + suffix;
    };

    /** transform a raw result into a second query or a display object **/
    this.process = function(data, index) {
        data = data.trim();
        // check for a special case - genomic position or interval
        if (!data.startsWith("[") && (qt.isGenomicPosition(data) || qt.isGenomicInterval(data))) {
            let words = qt.parseGenomic(data)
            let start = parseInt(words[1]);
            let region = words[0] + ":" + (start-100) + "-" + (start+100);
            if (words.length===3) {
                region = words[0] + ":" + words[1] + "-" + words[2];
            }
            let region_url = ensembl_url + '/Homo_sapiens/Location/View?db=core;r=' + region;
            let result = [ ["", ""],
                ["Coordinates", '<a href="' + region_url + '" target="_blank">' + region+ '</a>']
            ];
            return { status: 1, data: [result] };
        }
        // special case - empty results
        if (data==="[]") {
            return { status: 0 };
        }
        // special case - lookup from gene symbol to gene id
        let raw = JSON.parse(data);
        if (index===0 && typeof(raw["id"]) === 'undefined') {
            return { status: 0.5, data: raw[0]["id"] }
        }
        // general case - information from API
        let region = raw["seq_region_name"]+":"+raw["start"]+"-"+raw["end"];
        let gene_id = raw["id"];
        let summary_url = ensembl_url + '/Homo_sapiens/Gene/Summary?db=core;g='+gene_id;
        let location_url = ensembl_url + '/Homo_sapiens/Location/View?db=core;r=' + region;
        let description = raw["description"].split(" [Source");
        let result = [ ["", ""],
            ["Symbol", '<a href="' + summary_url+'" target="_blank">'+ raw["display_name"]+'</a>'],
            ["Id", raw["id"]],
            ["Description", description[0]],
            ["Biotype", raw["biotype"].replace("_", " ")],
            ["Coordinates", '<a href="' + location_url + '" target="_blank">' + region+ '</a>']
        ];
        return { status: 1, data: [result] };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (query.length<1) return ensembl_url;
        if (qt.isIdentifier(query, "ENSG")) {
            return ensembl_url + '/Homo_sapiens/Gene/Summary?db=core;g='+query.trim();
        } else if (qt.isGenomicInterval(query)) {
            let words = qt.parseGenomic(query);
            let region = words[0]+":"+words[1];
            if (words.length>2) {
                region += "-"+words[2]
            }
            return ensembl_url + '/Homo_sapiens/Location/View?db=core;r=' + region;
        }
        return ensembl_url
    };
}();
