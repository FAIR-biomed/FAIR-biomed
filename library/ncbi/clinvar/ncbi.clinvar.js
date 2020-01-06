/**
 * library plugin for NCBI Clinvar search
 */

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'ncbi.clinvar';
    this.title = 'NCBI Clinvar';
    this.subtitle = 'Interpretation of genetic variation';
    this.tags = ['genes', 'variants', 'clinical', 'significance'];

    /** accompanying resources **/
    this.logo = 'large-Blue_ncbi_logo195h.png';
    this.info = 'ncbi.clinvar-info.html';

    // parts of api urls
    let max_results = 128;
    let clinvar = 'https://www.ncbi.nlm.nih.gov/clinvar/';
    let eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    let suffix = '&db=clinvar&retmax=99999&format=json&sort=relevance&tool=FAIR-biomed&email=fair.ext@gmail.com';
    let id2link = function(id) {
        return clinvar + 'variation/' + id
    };

    /** helper to convert a string like 1:123-456 into parts ["1", "123", "456"] **/
    let query2tokens = function(query) {
        query = query.replace(/,/g, '');
        let words = query.split(/:|-|\s/).map((x) => x.trim());
        return words.filter(x => (x!==''));
    };
    /** helper to identify if a vector represents a genomic position or interval **/
    let is_genomic = function(tokens) {
        if (tokens.length<2 || tokens.length>3) { return false }
        return !isNaN(tokens[1])
    };
    /** helper to construct a search term/string with a chromosome and position **/
    let genomic_term = function(tokens) {
        let coords = tokens[1];
        if (tokens.length > 2) {
            coords += ":"+tokens[2]
        }
        let chr = tokens[0].replace(/chr/, '');
        return chr + "[chr]+AND+(" + coords+"[chrpos37]+OR+"+coords+"[chrpos38])";
    };

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        let words = x.split(' ');
        if (words.length>4) return 0;
        if (words.length==1 & words[0].startsWith('VCV')) return 1.0;
        let tokens = query2tokens(x);
        if (is_genomic(tokens)) return 0.95;
        if (words.length==1 && words[0].toUpperCase() == words[0]) return 0.9;
        if (words.length==1) return 0.8;
        let score = 1/words.length;
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let words = query.split(' ');
        let tokens = query2tokens(query);
        let url = eutils;
        if (index === 0 || typeof(index)==='undefined') {
            url += 'esearch.fcgi?term=';
            if (is_genomic(tokens)) {
                url += genomic_term(tokens);
            } else {
                url += words.join('+')
            }
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
        let varset = data['variation_set'][0];
        let locations = varset['variation_loc'].map(x => {
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
            ['Type', varset['variant_type']],
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
        let tokens = query2tokens(query);
        if (is_genomic(tokens)) {
            return clinvar + '?term=' + genomic_term(tokens);
        }
        return clinvar + '?term=' + query;
    };

}();
