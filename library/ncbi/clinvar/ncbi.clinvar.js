/**
 * library plugin for NCBI Clinvar search
 */

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ncbi.clinvar';
    this.title = 'NCBI Clinvar';
    this.subtitle = 'Variation and health status';
    this.tags = ['genes', 'variants', 'clinical', 'significance'];

    /** accompanying resources **/
    this.logo = 'large-Blue_ncbi_logo195h.png';
    this.info = 'ncbi.clinvar-info.html';

    // parts of api urls
    let max_results = 128;
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=clinvar&retmax=99999&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    let id2link = function(id) {
        return 'https://www.ncbi.nlm.nih.gov/clinvar/variation/'+id
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        let words = x.split(' ');
        if (words.length>4) return 0;
        if (words.length==1 & words[0].startsWith('VCV')) return 1.0;
        if (words.length==1 && words[0].toUpperCase() == words[0]) return 0.9;
        if (words.length==1) return 0.8;
        let score = 1/words.length;
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let words = query.split(' ');
        let url = eutils;
        if (index === 0 || typeof(index)==='undefined') {
            url += 'esearch.fcgi?term=' + words.join('+')
        } else if (index === 1) {
            url += 'esummary.fcgi?id='+words.join(',')
        }
        return url + suffix;
    };

    /** helper to arrange data about one variant into a table. **/
    processUID = function(data) {
        let accid = data["accession"];
        let traits = data["trait_set"].map(x => x["trait_name"]);
        let signif = data["clinical_significance"];
        let locations = data['variation_set'][0]['variation_loc'].map(x => {
            let assembly = x['assembly_name'];
            let pos = x['chr'] + ":" + x['display_start']+"-"+x['display_stop'];
            let refalt = [''];
            if (x['ref'] !== '') {
                refalt = [x['ref'], x['alt']]
            }
            return '(' + assembly + ') '+pos+ ' '+refalt.join('/');
        });
        return [
            ['', ''],
            ['Variant', '<a href="' + id2link(accid) + '" target="_blank">' + data['title']+ '</a>'],
            ['Traits', traits.join('<br/>')],
            ['Significance', signif['description'] + ';<br/>' + signif['review_status']],
            ['Location', locations.join('<br/>')]
        ];
    };
    processHitSummary = function(idlist) {
        return [ ['', ''], ['Search results', idlist.length]];
    };
    processTooMany = function(idlist) {
        return [ ['', ''], ['Search results', idlist.length]];
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        let result = JSON.parse(data);
        if (index === 0) {
            let numhits = result['esearchresult']['count'];
            let idlist = result['esearchresult']['idlist'];
            if (numhits > max_results) {
                return {status: 1, data: [processTooMany(idlist)]}
            }
            if (idlist.length>0) {
                return {status: 0.5, data: idlist.join(',')};
            } else {
                return {status: 0, data: 'No results'};
            }
        } else if (index === 1) {
            let uids = result['result']['uids'];
            let hits = uids.map(function(uid) {
                let obj = result['result'][uid];
                return processUID(obj);
            });
            let summary = [processHitSummary(uids)];
            return {status: 1, data: summary.concat(hits)}
        }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        if (index>0) return null;
        return 'https://www.ncbi.nlm.nih.gov/clinvar/?term='+query;
    };

}();
