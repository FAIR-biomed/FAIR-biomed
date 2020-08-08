/**
 * library plugin for LNCipedia search
 */

let qt = require("../_querytools.js");
let msg = require("../_messages.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'lncipedia.search';
    this.title = 'LNCipedia';
    this.subtitle = 'Human long non-coding RNAs';
    this.tags = ['long non-coding RNAs', 'transcript', 'lncRNA'];

    /** accompanying resources **/
    this.logo = 'lncipedia_logo.png';
    this.info = 'lncipedia-info.html';

    // parts of api urls
    let api_base = 'https://lncipedia.org/api/search';
    let lncipedia = api_base + '?id=';
    this.endpoints = [api_base];

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        if (qt.numWords(x)>4) return 0;
        return Math.max(0, Math.min(0.8, qt.scoreQuery(x)/qt.numWords(x)));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let words = query.trim().split(' ');
        return lncipedia + words.join('%20');
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        let hits = result['transcripts'];
        if (result['count']==0) {
            return {status: 1, data: msg.empty_server_output };
        }
        let lnrnas = hits.map(function(x) {
            return [
                ['',''],
                ['Entry', 'Gene: <a href="https://lncipedia.org/db/gene/'+x['lncipediaGeneID']+'" target="_blank">'+x['lncipediaGeneID']+'</a> \
                 Transcript ID: <a href="https://lncipedia.org/db/transcript/'+x['lncipediaTranscriptID']+'" target="_blank">'+x['lncipediaTranscriptID']+'</a>'],
                ['Location(hg38)', '<a href="https://genome.ucsc.edu/cgi-bin/hgTracks?org=human&db=hg38&position='+x['chromosome']+':'+x['start']+'-'+x['end']+'&hubUrl=https://www.lncipedia.org/trackhub/hub.txt" target="_blank">'+x['chromosome']+':'+x['start']+'-'+x['end']+'</a>'],
                ['Transcript size', x['transcriptSize']],
                ['Strand', x['strand']],
                ['Class', x['class']],
                ['Exons', x['nrExons']],
                ['Gene Aliases', x['geneAliases']]
            ];

        });
        return { status: 1, data: lnrnas }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        let words = query.trim().split(' ');
        return 'https://lncipedia.org/db/search?search_id=' + words.join("%20")
    };

}();
