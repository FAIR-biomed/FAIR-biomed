/**
 * library plugin for STRING DB protein-protein interactors
 * This plugin only search human genes and proteins.
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'string.network';
    this.title = 'STRING DB';
    this.subtitle = 'Protein interaction network';
    this.tags = ['genes', 'proteins', 'ppi', 'network', 'human'];
    this.endpoints = [];

    /** accompanying resources **/
    this.logo = 'string-logo.png';
    this.info = 'string-info.html';

    // base path to string db and other endpoints
    let string_db = 'https://string-db.org';
    let string_network = string_db + '/api/image/network';
    let string_external = string_db + '/cgi/input.pl';

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        if (qt.isIdentifier(x, "rs")) return 0;
        let words = x.split(' ');
        if (words.length>3) return 0;
        let score = 1/words.length;
        // penalize some special characters
        ['%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.3*(x.includes(z))
        });
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        // this plugin returns null
        // this signals that the query will be passed directly to function process
        return null;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let words = data.split(' ');
        words = words.map(function(x) {
            return x.trim();
        });
        // output is a single image with a URL constructed from the original query
        let url = string_network + '?identifiers=' + words.join("%0d");
        url += '&add_white_nodes=10&network_flavor=actions';
        let result = '<img class="fair-result img" src="'+url+'">';
        return { status: 1, data:  result}
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        // the string db does not allow constructing a URL directly to a network page
        return string_external;
    };

}();
