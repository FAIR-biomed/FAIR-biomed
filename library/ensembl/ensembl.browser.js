/**
 * plugin for displaying links to the ensembl genome browser
 */


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

    let query2tokens = function(query) {
        query = query.replace(/,/g, '');
        let words = query.split(/:|-|\s/).map((x) => x.trim());
        return words.filter(x => (x!==''));
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length<1) return 0;
        let words = query2tokens(query);
        if (words.length === 2) {
            if (isNaN(words[1])) return 0;
            return 0.8;
        }
        if (words.length === 3) {
            if (isNaN(words[1]) || isNaN(words[2])) return 0;
            return 0.8;
        }
        if (words.length>1) return 0;
        if (query.startsWith("ENSG")) return 1;
        return 0.8;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.trim();
        let words = query2tokens(query);
        // if the query is composed of three items, that is interpreted as [chr, start, end]
        // the url function returns null, and the query will pass directly to process
        if (words.length===2 || words.length===3) return null;
        let result = (index===0) ? xref_url : lookup_url;
        return result + query.trim() + '?content-type=application/json';
    };

    /** transform a raw result into a second query or a display object **/
    this.process = function(data, index) {
        data = data.trim();
        // check for a special case - genomic position or interval
        let words = query2tokens(data);
        if (!data.startsWith("[") && (words.length === 3 || words.length === 2)) {
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
        // special case - lookup from gene symbol to gene id
        let raw = JSON.parse(data);
        if (index===0 && typeof(raw["id"]) === 'undefined') {
            return { status: 0.5, data: raw[0]["id"] }
        }
        // general case - information from API
        let region = raw["seq_region_name"]+":"+raw["start"]+"-"+raw["end"];
        let summary_url = ensembl_url + '/Homo_sapiens/Gene/Summary?db=core;g=ENSG00000137474';
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
        if (query.startsWith("ENSG")) {
            return ensembl_url + '/Homo_sapiens/Gene/Summary?db=core;g='+query.trim();
        }
        return ensembl_url;
    };
}();
