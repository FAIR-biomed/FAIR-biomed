/**
 * library plugin for JASPAR search
 */

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'hocomoco.search';
    this.title = 'HOCOMOCO database';
    this.subtitle = 'Transcription factor binding profiles';
    this.tags = ['transcription factors', 'genes', 'TF motifs'];

    /** accompanying resources **/
    this.logo = 'hocomoco_logo.png';
    this.info = 'hocomoco-info.html';

    // parts of api urls
    let url_prefix = 'http://hocomoco.autosome.ru/search.json?detailed=true&arity=mono&query=';
    let item2link = function(x) {
        return 'http://hocomoco.autosome.ru/motif/' + x['full_name'];
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        // exact motif name pattern
        if (x.match(/^\w+_(HUMAN|MOUSE)\.H(10|11)(MO|DI)(\.\d)?\.[ABCDS]]$/)) return 1;
        // expected motif name pattern in future hocomoco versions
        if (x.match(/^\w+_\w+\.H(\d+)(MO|DI)\.\d+\..+]/)) return 0.99;
        // hocomoco can search by hgnc/mgi/entrezgene ids
        if (x.match(/^(HGNC|MGI|entrez(\s*gene)?):?\s*\d+/)) return 0.9;
        // the rest is taken from JASPAR
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
        return url_prefix + words.join('%20');
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (result.length == 0) {
            return {status: 0, data: "No TF binding profiles found!"};
        }
        let matrices = result.map(function(x) {
            return [
                ['',''],
                ['Gene', x['gene_names'].join(', ')],
                ['Motif', '<a href="'+item2link(x)+'" target="_blank">'+x['full_name']+'</a>'],
                ['Sequence logo', '<img class="fair-result" src="http://hocomoco.autosome.ru'+x['direct_logo_url']+'" style="width: 100%;">'],
            ];
        });
        return { status: 1, data: matrices}
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        let words = query.trim().split(' ');
        return 'http://hocomoco.autosome.ru/search?arity=mono&query=' + words.join("%20")
    };

}();
