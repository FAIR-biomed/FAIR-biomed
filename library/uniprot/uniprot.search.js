/**
 * library plugin for Uniprot search
 */


module.exports = new function() {

    /** declarative attributes **/
    this.id = 'uniprot.search';
    this.title = 'Uniprot';
    this.subtitle = 'Knowledgebase search';
    this.tags = ['proteins'];

    /** accompanying resources **/
    this.logo = 'uniprot-rgb-optimized-2.png';
    this.info = 'uniprot-info.html';

    var uniprot = 'https://www.uniprot.org/uniprot/'
    var cols = ['id', 'entry%20name', 'protein%20names', 'genes', 'organism']

    /** signal whether or not plugin can process a query **/
    this.claim = function(x) {
        if (x.trim().length<2) return 0
        var words = x.trim().split(' ');
        if (words.length>2) {
            return 0;
        }
        var score = 1/words.length;
        // penalize some special characters
        [':', '%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.2*(x.includes(z))
        })
        return Math.max(0, Math.min(0.9, score));
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        var q = query.split(' ').join('+');
        var url = '?query=' + q + '&sort=score&columns='+cols.join(',')+'&format=tab&limit=10';
        return uniprot + url;
    }

    /** transform a raw result from an API call into a display object **/
    this.process = function(data, index) {
        // input will be tab-separated table -> parse into lines
        var parsed = data.split('\n').filter((x) => x!=='')
        var header = parsed.shift();
        var result = parsed.map(function(x) {
            var xdata = x.split('\t');
            return [
                ['',''],
                ['Entry', '<a href="'+uniprot+xdata[0]+'">'+xdata[1]+'</a>'],
                ['Proteins', xdata[2]],
                ['Genes', xdata[3]],
                ['Organism', xdata[4]]
            ];
        })
        return {
            status: 1,
            data: result
        }
    }

    /** construct a URL to an external information page **/
    this.external = function(query1, query2) {
        var q = query1.split(' ').join('+')
        return uniprot + '?query='+q+'&sort=score';
    }

}();
