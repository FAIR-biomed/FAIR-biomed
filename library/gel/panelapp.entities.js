/**
 * plugin for Panel App from Genomics England
 */


module.exports = new function() {

    this.id = 'panelapp.entities';
    this.title = 'PanelApp';
    this.subtitle = 'Knowledgebase for rare diseases and cancer';
    this.tags = ['human', 'gene', 'rare', 'disease', 'cancer'];
    this.logo = 'PanelApp_cropped.jpg';
    this.info = 'panelapp-info.html';

    // urls for API and external pages
    let api_url = 'https://panelapp.genomicsengland.co.uk/api/v1/entities/';
    // external page for panels
    let panels_url = 'https://panelapp.genomicsengland.co.uk/panels/';
    // eg. url for listing of all panels for gene:
    // https://panelapp.genomicsengland.co.uk/panels/entities/ABCA4
    // eg. url for info on gene within one panel
    // https://panelapp.genomicsengland.co.uk/panels/307/gene/ABCA4

    /** signal whether or not plugin can process a query **/
    this.claim = function(query) {
        query = query.trim();
        if (query.length<2) return 0;
        if (query.split(' ').length !== 1) return 0;
        if (query.split(':').length !== 1) return 0;
        let score = 0.8;
        [':', '%', '$', '#', '.', ';'].map(function(z) {
            score -= 0.2*(query.includes(z))
        });
        return Math.max(0, score);
    };

    /** construct a url for an API call **/
    this.url = function(query, index) {
        return api_url + query.trim();
    };

    /** (helper) arrange gene information into a table **/
    this.processGene = function(x) {
        let xname = x['entity_name'];
        let panel = x['panel'];
        let p_url = panels_url + panel['id'] + '/gene/' + xname;
        let confidence = x['confidence_level'];
        if (confidence === '4' || confidence === '3') {
            confidence += ' <span style="color:#3fad46">(green)</span>';
        } else if (confidence === '1') {
            confidence += ' <span style="color:#d9534f">(red)</span>';
        } else if (confidence === '2') {
            confidence += ' <span style="color:#f0ad4e">(amber)</span>';
        }
        return [
            ['',''],
            ['Type', x['entity_type']],
            ['Name', xname],
            ['Panel', '<a href="' + p_url + '" target="_blank">' + panel['name'] + '</a>'],
            ['Group', panel['disease_group']],
            ['Sub-group', panel['disease_sub_group']],
            ['Confidence', confidence],
            ['Evidence', x['evidence'].join(';<br/> ')],
            ['Phenotypes', x['phenotypes'].join(';<br/> ')]
        ];
    };

    /** transform a raw result from an API call into a second query or a display object **/
    this.process = function(data, index) {
        let parsed = JSON.parse(data);
        if (parsed['count'] === 0) {
            return { status: 1, data: 'No results' };
        }
        let docs = parsed['results'];
        let result = docs.map(this.processGene);
        return { status: 1, data: result };
    };

    /** construct a URL to an external information page **/
    this.external = function(query, index) {
        return panels_url + 'entities/' + query.trim();
    };

}();
