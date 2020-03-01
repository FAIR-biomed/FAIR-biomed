/**
 * library plugin for Pubmed Article search
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'pubmed.search';
    this.title = 'PubMed';
    this.subtitle = 'Literature search';
    this.tags = ['articles', 'literature'];

    /** accompanying resources **/
    this.logo = '200px-US-NLM-PubMed-Logo-2.svg.png';
    this.info = 'pubmed-info.html';

    // parts of api urls
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=pubmed&retmax=8&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    this.endpoints = [eutils + 'esearch.fcgi', eutils + 'esummary.fcgi'];

    let id2link = function(id) {
        return 'https://www.ncbi.nlm.nih.gov/pubmed/'+id;
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim()
        if (x.length<2) return 0;
        let words = x.split(' ');
        if (words.length>4) return 0;
        let score = 1/words.length;
        // penalize some special characters
        [':', '%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.3*(x.includes(z))
        });
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
        let result = JSON.parse(data)
        if (index === 0) {
            result = result['esearchresult']['idlist'];
            if (result.length>0) {
                return {status: 0.5, data: result.join(',')};
            } else {
                return {status: 0, data: 'failed search'};
            }
        } else if (index === 1) {
            let uids = result['result']['uids'];
            let articles = uids.map(function(x) {
                let xdata = result['result'][x];
                return [
                    '<h2>'+xdata['title']+'</h2>',
                    '<div>'+xdata['sortfirstauthor']+' et al</div>',
                    '<div>'+xdata['source']+' ('+xdata['pubdate']+')</div>',
                    '<div><a href="'+id2link(xdata['uid'])+'" target="_blank">',
                    'PMID: '+xdata['uid']+'</a></div>'].join('')
            });
            return {
                status: 1,
                data: articles
            }
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index>0) {
            return null;
        }
        return 'https://www.ncbi.nlm.nih.gov/pubmed/?term='+query;
    };

}();


