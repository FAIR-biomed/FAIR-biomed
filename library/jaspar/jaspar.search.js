/**
 * library plugin for JASPAR search
 */

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'jaspar.search';
    this.title = 'JASPAR database';
    this.subtitle = 'Transcription factor binding profiles';
    this.tags = ['transcription factors', 'genes', 'TF motifs'];

    /** accompanying resources **/
    this.logo = 'jaspar_logo_2020.png';
    this.info = 'jaspar-info.html';

    // parts of api urls
    let jaspar = 'http://jaspar.genereg.net/api/v1/matrix/?search=';
    let suffix = '&format=json&page_size=10';
    let item2link = function(x) {
        return 'http://jaspar.genereg.net/matrix/'+x['matrix_id'];
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
        return jaspar + words.join('%20') + suffix;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        let hits = result['results'];
        let matrices = hits.map(function(x) {
            return [
                ['',''],
                ['TF Nam:', x['name']],
                ['Motif ID:', '<a href="'+item2link(x)+'" target="_blank">'+x['matrix_id']+'</a>'],
                ['Collection:', x['collection']],
                ['Sequence logo:', '<img src="http://jaspar.genereg.net/static/logos/'+x['matrix_id']+'.png" style="height: 50px;">']
            ];

        });
        return { status: 1, data: matrices
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        let words = query.trim().split(' ');
        return 'http://jaspar.genereg.net/search?q=' + words.join("%20")
    };

}();
