/**
 * library plugin for UCSC genome browser
 * This plugin only provides forwarding links to the UCSC browser.
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ucsc.genomebrowser';
    this.title = 'UCSC Genome Browser';
    this.subtitle = 'Viewer of genomic regions';
    this.tags = ['genome', 'tracks', 'annotations'];
    this.permissions = [];

    /** accompanying resources **/
    this.logo = 'ucsc_genome_browser_logo.png';
    this.info = 'ucsc-info.html';

    // base path to string db and other endpoints
    let gateway_url = 'https://genome.ucsc.edu/cgi-bin/hgGateway';
    let tracks_url = 'https://genome.ucsc.edu/cgi-bin/hgTracks?';
    let genomes = ["hg38", "hg19", "mm10", "mm9",
                   "rn6", "danRer11", "dm6", "ce11", "sacCer3"];

    /** helper to convert a string like 1:123-456 into parts ["1", "123", "456"] **/
    let query2tokens = function(query) {
        query = query.replace(/,/g, '');
        let words = query.split(/:|-|\s/).map((x) => x.trim());
        return words.filter(x => (x!==''));
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        // split the query into tokens
        let words = query2tokens(query);
        if (words.length < 2 || words.length > 4) return 0;
        if (isNaN(words[1])) return 0;
        if (words.length === 3) {
            if (isNaN(words[2])) return 0;
        }
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        // this plugin returns null
        // this signals that the query will be passed directly to function process
        return null;
    };


    /** helpers to process, for single genomic positions, for genomic intervals **/
    let processSite = function(chr, position) {
        let result = [["genome", "site", "1kb region"]];
        position = parseInt(position);
        let single_query = chr + ":" + position;
        let kb_query = chr + ":" + (position-500) + "-" + (position+500);
        genomes.map(x => {
            let x_url = tracks_url + "db=" + x + "&position=" + chr + "%3A";
            let single_url = x_url + position + "-" + position;
            let kb_url = x_url + (position-500) + "-" + (position+500);
            let single_a = '<a href="'+single_url+'" target="_blank">'+single_query+'</a>';
            let kb_a = '<a href="'+kb_url+'" target="_blank">'+kb_query+'</a>'
           result.push([x, single_a, kb_a]);
        });
        return {"Genomic site": result};
    };
    let processInterval = function(chr, start, end) {
        let result = [["genome", "interval"]];
        let interval = chr + ":" + start + "-" + end;
        genomes.map(x => {
            let x_url = tracks_url + "db=" + x + "&position=" + chr + "%3A" + start + "-" + end;
            result.push([x, '<a href="' + x_url + '" target="_blank">' + interval + '</a>']);
        });
        return {"Genomic interval": result};
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let words = query2tokens(data);
        let result = null;
        if (words.length === 2) {
            result = processSite(words[0], words[1]);
        } else {
            result = processInterval(words[0], words[1], words[2]);
        }
        return { status: 1, data:  result}
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return gateway_url;
    };

}();
