/**
 * library plugin for wikipedia search
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'wikipedia';
    this.title = 'Wikipedia';
    this.subtitle = 'The free encyclopaedia';
    this.tags = ['encyclopaedia'];

    let api_base = 'https://en.wikipedia.org/w/api.php';
    this.endpoints = [api_base];

    /** accompanying resources **/
    this.logo = '103px-Wikipedia-logo-v2.svg.png';
    this.info = 'wikipedia-info.html';

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        if (x.trim().length<1) return 0;
        let words = x.trim().split(' ');
        if (words.length>4) return 0
        let score = 1/words.length;
        // penalize some special characters
        [':', '%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.2*(x.includes(z))
        })
        return Math.min(0.8, Math.max(0, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.split(' ').join('%20');
        let url = null;
        let api = api_base + '?action=';
        let suffix = '&format=json&formatversion=2';
        if (index === 0 || typeof(index)==='undefined') {
            url = api + 'opensearch&search=' + query + suffix;
        } else if (index === 1) {
            url = api + 'query&titles=' + query + '&prop=extracts&exintro=true'+suffix;
        }
        return url;
    }

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            result = result[1];
            if (result.length>0) {
                return {status: 0.5, data: result[0]};
            } else {
                return {status: 0, data: 'failed search'};
            }
        } else if (index === 1) {
            if (result['batchcomplete']!==true) {
                return {status: 0, data: result};
            }
            result = result['query']['pages'][0];
            return {
                status: 1,
                data: result.extract
            };
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index === 0) {
            return null;
        }
        query = query.split(' ').join('_');
        return 'https://en.wikipedia.org/wiki/'+query;
    }

}();


