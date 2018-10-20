/**
 * plugin for EBI's GWAS catalog
 */


module.exports = new function() {

    /** variables **/
    this.id = 'ebi.gwas';
    this.title = 'GWAS catalog';
    this.subtitle = 'Trait associations';
    this.tags = ['human', 'genetics', 'disease'];

    /** accompanying resources **/
    this.logo = 'gwas-logo.jpeg';
    this.info = 'ebi.gwas-info.html';

    var gwas = 'https://www.ebi.ac.uk/gwas/';
    var snp_api = 'rest/api/singleNucleotidePolymorphisms/';
    var snp_suffix = '/associations?projection=associationBySnp';

    cleanQuery = function(query) {
        return query.trim().replace('-', '');
    }

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = cleanQuery(query);
        if (query.length<2) return 0;
        if (query.startsWith('rs')) return 1;
        if (parseFloat(query)>0) return 0;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return gwas + snp_api + cleanQuery(query) + snp_suffix;
    };

    /** extract associations **/
    assocInfo = function(data) {
        var result = data.map(function(z) {
            // extract trait names
            var traits = z['efoTraits'];
            var traitNames = traits.map(x => x['trait']).join(', ');
            // extract gene names
            var loci = z['loci'];
            var geneNames = loci.map(function(x) {
                var names = x['authorReportedGenes'].map(y => y['geneName']);
                return names.join(", ");
            }).join(', ');
            var pval = z['pvalue'];
            return '<h3>'+geneNames+'</h3><p>Traits: '+traitNames+'</p><p>P-value: '+pval+'</p>';
        })
        return result;
    }

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        data = JSON.parse(data);
        var hits = data['_embedded']['associations'];
        var assocs = assocInfo(hits);
        return {status: 1, data: {Associations: assocs}};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return gwas + 'variants/'+cleanQuery(query);
    };

}();

