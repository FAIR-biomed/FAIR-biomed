/**
 * library plugin for identifiers.org (collections)
 *
 * This one shows all data providers/collections for a given identifier
 * This plugin performs a direct lookup - not a search.
 *
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'identifiers.collections';
    this.title = 'Identifiers';
    this.subtitle = 'Data providers';
    this.tags = ['identifiers', 'collections', 'providers'];

    /** accompanying resources **/
    this.logo = 'identifiers-logo.png';
    this.info = 'identifiers-info.html';

    // api urls
    let resolver = 'http://resolver.api.identifiers.org/';
    let idurl = "https://identifiers.org/";
    this.endpoints = [resolver + '*'];

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length==0 || query.split(" ")>1) return 0;
        let words = query.split(':');
        if (words.length==2) return 0.95;
        if (words.length>2) return 0;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return resolver + query.trim();
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index, query) {
        query = query.trim();
        let result = JSON.parse(data);
        let resources = result['payload']['resolvedResources'];
        if (resources.length==0) {
            return { status: 1, data: result['errorMessage'] };
        }
        let booleanYesNo = function(x) {
            if (x) return "yes";
            return "no";
        };
        let output = resources.map(function(x) {
            return [
                ['',''],
                ['Data', '<a href="'+x['accessUrl']+'">'+query+'</a>'],
                ['Resource', '<a href="'+x['resourceURL']+'">'+ x['info']+'</a>'],
                ['Institution', x['institution']+', '+x['location']],
                ['Official', booleanYesNo(x['official'])]
            ];
        });
        return { status: 1, data: output };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return idurl+query.trim();
    };

}();
