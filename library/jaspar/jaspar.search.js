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
    this.logo = 'jaspar_logo.png';
    this.info = 'jaspar-info.html';

    // parts of api urls
    let jaspar = 'http://jaspar.genereg.net/api/v1/matrix/?search=';
    let suffix = '&format=json&page_size=10&version=latest';
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
                ['Name', x['name']],
                ['Matrix ID', '<a href="'+item2link(x)+'" target="_blank">'+x['matrix_id']+'</a> from '+x['collection']+' \
                Collection | <a href="http://jaspar.genereg.net/api/v1/matrix/'+x['matrix_id']+'.tranfac" target="_blank"> View PFM</a>'],
                ['Sequence logo', '<img class="fair-result svg" src="'+x['sequence_logo']+'" style="width: 100%;">']
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
