/**
 * library plugin for identifiers.org
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'identifiers.collections';
    this.title = 'Identifiers';
    this.subtitle = 'Data providers';
    this.tags = ['identifiers'];

    /** accompanying resources **/
    this.logo = 'identifiers-logo.png';
    this.info = 'identifiers-info.html';

    // api urls
    var resolver = 'http://resolver.api.identifiers.org/';
    var idurl = "https://identifiers.org/";

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length==0 || query.split(" ")>1) return 0;
        var words = query.trim().split(':');
        if (words.length==2) return 0.95;
        if (words.length>2) return 0;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        query = query.trim();
        return resolver + query;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index, query) {
        query = query.trim();
        var result = JSON.parse(data);
        var resources = result['payload']['resolvedResources'];
        if (resources.length==0) {
            return { status: 1, data: result['errorMessage'] };
        }
        var booleanYesNo = function(x) {
            if (x) return "yes";
            return "no";
        }
        var output = resources.map(function(x) {
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
