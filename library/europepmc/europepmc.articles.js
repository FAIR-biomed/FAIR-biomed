/**
 * library plugin for EuropePMC article search
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'europepmc.articles';
    this.title = 'Europe PMC';
    this.subtitle = 'Literature search';
    this.tags = ['articles', 'literature'];

    /** accompanying resources **/
    this.logo = 'europepmc-logo.png';
    this.info = 'europepmc-info.html';

    // parts of api urls
    let api_base = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
    let pmc = api_base + '?query=';
    this.endpoints = [api_base];
    let suffix = '&format=json&pageSize=8&resultType=lite';
    let item2link = function(x) {
        return 'https://europepmc.org/abstract/'+x['source']+'/'+x['id'];
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        let words = x.split(' ');
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
        return pmc + words.join('%20') + suffix;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        let hits = result['resultList']['result'];
        let articles = hits.map(function(x) {
            if (x['journalTitle'] == null) {
                x['journalTitle'] = '['+x['pubType']+']';
            }
            return [
                '<h2>'+x['title']+'</h2>',
                '<div>'+x['authorString']+'</div>',
                '<div>'+x['journalTitle']+' ('+x['pubYear']+')</div>',
                '<div><a href="'+item2link(x)+'" target="_blank">',
                x['source']+'/'+x['id']+'</a></div>'].join('')
        });
        return {
            status: 1,
            data: articles
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        let words = query.trim().split(' ');
        return 'https://europepmc.org/search?query=' + words.join("%20")
    };

}();
