/**
 * library plugin for NCBI gene summary search
 */

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ncbi.gene';
    this.title = 'NCBI Gene';
    this.subtitle = 'Gene summary';
    this.tags = ['genes'];

    /** accompanying resources **/
    this.logo = 'large-Blue_ncbi_logo195h.png';
    this.info = 'ncbi.gene-info.html';

    // parts of api urls
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=gene&retmax=5&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    let id2link = function(id) {
        return 'https://www.ncbi.nlm.nih.gov/gene/'+id
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        let words = x.split(' ');
        if (words.length>4) return 0;
        if (words.length==1 && words[0].toUpperCase() == words[0]) return 0.95;
        let score = 1/words.length;
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let words = query.split(' ');
        let url = eutils;
        if (index === 0 || typeof(index)==='undefined') {
            url += 'esearch.fcgi?term=' + words.join('+')
        } else if (index === 1) {
            url += 'esummary.fcgi?id='+words.join(',')
        }
        return url + suffix;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            result = result['esearchresult']['idlist'];
            if (result.length>0) {
                return {status: 0.5, data: result.join(',')};
            } else {
                return {status: 0, data: 'failed search'};
            }
        } else if (index === 1) {
            let uids = result['result']['uids'];
            let summary = uids.map(function(uid) {
                let obj = result['result'][uid];
                return [
                    ['', ''],
                    ['Symbol', '<a href="' + id2link(uid) + '" target="_blank">' + obj['name'] + '</a>'],
                    ['Description', obj['description']],
                    ['Organism', obj['organism']['scientificname']],
                    ['Summary', obj['summary']],
                    ['Location', obj['maplocation']],
                    ['Aliases', obj['otheraliases']]
                ];
            });
            return {status: 1, data: summary}
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index>0) {
            return null;
        }
        return 'https://www.ncbi.nlm.nih.gov/gene/?term='+query;
    };

}();
