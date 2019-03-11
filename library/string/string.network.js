/**
 * library plugin for STRING DB protein-protein interactors
 * This plugin only search human genes and proteins.
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'string.network';
    this.title = 'STRING DB';
    this.subtitle = 'Protein interaction network';
    this.tags = ['genes', 'proteins', 'ppi', 'network', 'human'];

    /** accompanying resources **/
    this.logo = 'string-logo.png';
    this.info = 'string-info.html';

    // base path to string db and other endpoints
    var string_db = 'https://string-db.org';
    var string_network = string_db + '/api/image/network';
    var string_external = string_db + '/cgi/input.pl';

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        var words = x.split(' ');
        if (words.length>3) return 0;
        var score = 1/words.length;
        // penalize some special characters
        ['%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.3*(x.includes(z))
        });
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        var words = query.split(' ');
        words = words.map(function(x) {
            return x.trim();
        });
        // make URL, this appends an output.png. It is ignored by the
        // server but signals in the url that output will be a png
        var result = string_network + '?identifiers=' + words.join("%0d");
        result += '&add_white_nodes=10&network_flavor=actions&output.png';
        return result;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        // this does not process anything
        // the data is left to be formatted into an img elsewhere
        return {status:1, data: data};
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        // the string db does not allow constructing a URL directly to a network page
        return string_external;
    };

}();
