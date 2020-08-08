/**
 * library plugin for wiktionary search
 */

let qt = require("../_querytools.js");
let msg = require("../_messages.js");

module.exports = new function() {

    /** variables **/
    this.id = 'wiktionary';
    this.title = 'Wiktionary';
    this.subtitle = 'The free dictionary';
    this.tags = ['dictionary'];

    let api_base = 'https://en.wiktionary.org/w/api.php';
    this.endpoints = [api_base];

    /** accompanying resources **/
    this.logo = '99px-WiktionaryEn.svg.png';
    this.info = 'wiktionary-info.html';

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        if (x.trim().length < 1) return 0;
        if (qt.numWords(x)>1) return 0;
        return Math.min(0.8, qt.scoreQuery(x, 1));
    };

    /** construct a url for an API call **/
    this.url = function(query) {
        query = query.split(' ').join('%20');
        let url = api_base + '?action=query'
            +'&titles='+query+'&prop=extracts&format=json&formatversion=2';
        return url;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        let result = JSON.parse(data);
        if (result['batchcomplete']!==true) {
            return {status: 0, data: result};
        }
        result = result['query']['pages'][0];
        if (result.extract === undefined) {
            return { status: 1, data: msg.empty_server_output }
        }
        return {status: 1, data: result.extract };
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        query = query.split(' ').join('_');
        return 'https://en.wiktionary.org/wiki/'+query;
    }

}();

