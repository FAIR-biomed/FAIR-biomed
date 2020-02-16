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

    let gwas = 'https://www.ebi.ac.uk/gwas/';
    let snp_api = 'rest/api/singleNucleotidePolymorphisms/';
    let snp_suffix = '/associations?projection=associationBySnp';
    this.permissions = [gwas + snp_api + '*'];

    this.cleanQuery = function(query) {
        return query.trim().replace('-', '');
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = this.cleanQuery(query);
        if (query.length<2) return 0;
        if (query.startsWith('rs')) return 1;
        if (parseFloat(query)>0) return 0;
        return 0;
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return gwas + snp_api + this.cleanQuery(query) + snp_suffix;
    };

    /** extract associations **/
    this.assocInfo = function(data) {
        let result = data.map(function(z) {
            // extract trait names
            let traits = z['efoTraits'];
            let traitNames = traits.map(x => x['trait']).join(', ');
            // extract gene names
            let loci = z['loci'];
            let geneNames = loci.map(function(x) {
                let names = x['authorReportedGenes'].map(y => y['geneName']);
                return names.join(", ");
            }).join(', ');
            let pval = z['pvalue'];
            return '<h3>'+geneNames+'</h3><p>Traits: '+traitNames+'</p><p>P-value: '+pval+'</p>';
        });
        return result;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        data = JSON.parse(data);
        let hits = data['_embedded']['associations'];
        let assocs = this.assocInfo(hits);
        return {status: 1, data: {Associations: assocs}};
    };

    /** construct a URL to an external information page **/
    this.external = function(query) {
        return gwas + 'variants/'+this.cleanQuery(query);
    };

}();

