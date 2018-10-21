/**
 * plugin for Exac variant lookup
 */


module.exports = new function() {

    /** variables **/
    this.id = 'exac.genes.in.region';
    this.title = 'ExAC Genes';
    this.subtitle = 'Genes within genomic range';
    this.tags = ['human', 'genetics', 'genes'];

    /** accompanying resources **/
    this.logo = 'exac-screenshot-logo.png';
    this.info = 'exac-info.html';

    /** helpers convert a raw query string into exac-format **/
    var q2words = function(query) {
        // remove some known contaminant characters
        query = query.replace(/,|\\.|chr/g, '')
        // split into words by various delimiters
        var words = query.split(/:|-|\s/).map((x)=>x.trim());
        return words.filter(x=> (x!==''))
    };
    this.q2string = function(query) {
        var words = q2words(query)
        return words[0]+'-'+words[1]+'-'+words[2];
    };

    /** helper to display one gene's information as a table **/
    var makeTable = function(data) {
        var coords = data['chrom']+':'+data['start']+'-'+data['stop']
        var othernames = '';
        try {
            otherames = data['other_names'].join(', ');
        } catch(e) {};
        return [
            [],
            ['Name', data['full_gene_name']],
            ['Id', data['gene_id']],
            ['Other names', othernames],
            ['Coordinates', coords +' ('+data['strand']+')']
        ];
    }

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        // require query to have three parts, e.g. '1:1234-2345'
        var words = q2words(query);
        if (words.length!=3) {
            return 0
        }
        if (isNaN(words[1]) || isNaN(words[2])) {
            return 0
        };
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        var api = 'http://exac.hms.harvard.edu/rest/region/genes_in_region/'
        return api + this.q2string(query);
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data) {
        data = JSON.parse(data);
        result = {};
        data.map(function(x) {
          result[x['gene_name']] = makeTable(x);
        });
        return {status: 1, data: result};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return 'http://exac.broadinstitute.org/region/' + this.q2string(query);
    };

}();


