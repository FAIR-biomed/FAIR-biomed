/**
 * library plugin for wikipedia search
 */

let qt = require("../_querytools.js");
let msg = require("../_messages.js");

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
        if (qt.numWords(x)>4) return 0;
        return Math.min(0.8, qt.scoreQuery(x)/qt.numWords(x));
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
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            result = result[1];
            if (result.length>0) {
                return { status: 0.5, data: result[0] };
            } else {
                return { status: 0, data: msg.empty_server_output };
            }
        } else if (index === 1) {
            if (result['batchcomplete']!==true) {
                return { status: 0, data: result };
            }
            result = result['query']['pages'][0];
            if (result.extract === "") {
                return { status: 1, data: msg.empty_server_output }
            }
            return { status: 1, data: result.extract };
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index === 0) return null;
        query = query.split(' ').join('_');
        return 'https://en.wikipedia.org/wiki/'+query;
    }

}();


