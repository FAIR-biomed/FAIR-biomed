/**
 * library plugin for UCSC genome browser
 * This plugin only provides forwarding links to the UCSC browser.
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ucsc.genomebrowser';
    this.title = 'UCSC Genome Browser';
    this.subtitle = 'Viewer of genomic regions';
    this.tags = ['genome', 'tracks', 'annotations'];
    this.endpoints = [];

    /** accompanying resources **/
    this.logo = 'ucsc_genome_browser_logo.png';
    this.info = 'ucsc-info.html';

    // base path to string db and other endpoints
    let gateway_url = 'https://genome.ucsc.edu/cgi-bin/hgGateway';
    let tracks_url = 'https://genome.ucsc.edu/cgi-bin/hgTracks?';
    let genomes = ["hg38", "hg19", "mm10", "mm9",
                   "rn6", "danRer11", "dm6", "ce11", "sacCer3"];

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        if (qt.isGenomicPosition(query)) return 0.9;
        if (qt.isGenomicInterval(query)) return 1;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        // null signals that the query will be passed directly to function process
        return null;
    };

    /** helpers to process, for single genomic positions, for genomic intervals **/
    let processSite = function(chr, position) {
        let result = [["genome", "site", "1kb region"]];
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
        let result = null;
        let genomic = qt.parseGenomic(data);
        if (qt.isGenomicInterval(data)) {
            result = processInterval(genomic[0], genomic[1], genomic[2]);
        } else if (qt.isGenomicPosition(data)) {
            result = processSite(genomic[0], genomic[1]);
        }
        return { status: 1, data:  result}
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return gateway_url;
    };

}();
