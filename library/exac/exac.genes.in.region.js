/**
 * plugin for Exac variant lookup
 */


module.exports = new function() {

    /** This plugin is deprecated because APIs are not responsive any more **/
    this.deprecated = true

    /** variables **/
    this.id = 'exac.genes.in.region';
    this.title = 'ExAC Genes';
    this.subtitle = 'Genes within genomic range';
    this.tags = ['human', 'genetics', 'genes'];

    let api_base = 'http://exac.hms.harvard.edu/rest/region/genes_in_region/';
    this.endpoints = [api_base + '*'];

    /** accompanying resources **/
    this.logo = 'exac-screenshot-logo.png';
    this.info = 'exac-info.html';

    /** helpers convert a raw query string into exac-format **/
    let q2words = function(query) {
        // remove some known contaminant characters
        query = query.replace(/,|\\.|chr/g, '')
        // split into words by various delimiters
        let words = query.split(/:|-|\s/).map((x)=>x.trim());
        return words.filter(x=> (x!==''))
    };
    this.q2string = function(query) {
        let words = q2words(query);
        return words[0]+'-'+words[1]+'-'+words[2];
    };

    /** helper to display one gene's information as a table **/
    let makeTable = function(data) {
        let coords = data['chrom']+':'+data['start']+'-'+data['stop']
        let othernames = '';
        try {
            othernames = data['other_names'].join(', ');
        } catch(e) {};
        return [
            [],
            ['Name', data['full_gene_name']],
            ['Id', data['gene_id']],
            ['Other names', othernames],
            ['Coordinates', coords +' ('+data['strand']+')']
        ];
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        // require query to have three parts, e.g. '1:1234-2345'
        let words = q2words(query);
        if (words.length!=3) {
            return 0
        }
        if (isNaN(words[1]) || isNaN(words[2])) {
            return 0
        }
        return 1;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return api_base + this.q2string(query);
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

