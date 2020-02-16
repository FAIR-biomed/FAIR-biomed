/**
 * library plugin for LNCipedia search
 */

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
    this.permissions = [api_base];

    let item2link = function(x) {
        return 'https://lncipedia.org/db/gene/'+x['lncipediaGeneID'];
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim()
        if (x.length<2) return 0;
        let words = x.split(' ');
        if (words.length>4) return 0;
        let score = 1/words.length;
        // penalize some special characters
        ['%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.3*(x.includes(z))
        });
        return Math.max(0, Math.min(0.9, score));
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
                return {status: 0, data: "No long non-coding RNA transcripts found!"};
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
