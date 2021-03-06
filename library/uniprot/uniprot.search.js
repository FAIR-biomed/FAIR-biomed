/**
 * library plugin for Uniprot search
 */

let qt = require("../_querytools.js");

module.exports = new function() {

    /** declarative attributes **/
    this.id = 'uniprot.search';
    this.title = 'Uniprot';
    this.subtitle = 'Knowledgebase search';
    this.tags = ['proteins'];

    /** accompanying resources **/
    this.logo = 'uniprot-rgb-optimized-2.png';
    this.info = 'uniprot-info.html';

    let uniprot = 'https://www.uniprot.org/uniprot/';
    this.endpoints = [uniprot];

    let cols = ['id', 'entry%20name', 'protein%20names', 'genes', 'organism'];

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        x = x.trim();
        if (x.length<2) return 0;
        if (qt.numWords(x)>2) return 0;
        return Math.min(0.9, qt.scoreQuery(x)/qt.numWords(x));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        let q = query.split(' ').join('+');
        let url = '?query=' + q + '&sort=score&columns='+cols.join(',')+'&format=tab&limit=10';
        return uniprot + url;
    };

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        if (data === "") {
            return { status: 0 }
        }
        // input will be tab-separated table -> parse into lines
        let parsed = data.split('\n').filter((x) => x!=='');
        let header = parsed.shift();
        let result = parsed.map(function(x) {
            let xdata = x.split('\t');
            return [
                ['',''],
                ['Entry', '<a href="'+uniprot+xdata[0]+'" target="_blank">'+xdata[1]+'</a>'],
                ['Proteins', xdata[2]],
                ['Genes', xdata[3]],
                ['Organism', xdata[4]]
            ];
        });
        return { status: 1, data: result }
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        let q = query.split(' ').join('+');
        return uniprot + '?query='+q+'&sort=score';
    }

}();

