/**
 * library plugin for gtex search
 */

module.exports = new function () {

    /** declarative attributes **/
    this.id = 'gtex.search';
    this.title = 'GTex';
    this.subtitle = 'Tissue-specific gene expression';
    this.tags = ['genes'];

    /** accompanying resources **/
    this.logo = 'gtex_logo.png';
    this.info = 'gtex-info.html';
    let api_base = 'https://gtexportal.org/rest/v1/'
    this.endpoints = [api_base];

    let gtex = 'https://gtexportal.org/';

    /** signal whether or not plugin can process a query **/
    this.claim = function (query) {
        query = query.trim();
        // avoid short and multi-word queries
        if (query.length < 3) return 0;
        if (query.split(' ').length != 1) return 0;
        return 0.9;
    };

    /** construct a url for an API call **/
    this.url = function (query, index) {

        words = query.trim().split(' ')

        // query is an ensembl gene
        if(index === 1){
          // in this case the query should be a gene name!
          var inp = "https://gtexportal.org/rest/v1/expression/medianGeneExpression?datasetId=gtex_v8&gencodeId=" + words + "&format=json";
        } else if (index === 0 || typeof(index)==='undefined') {
          // in case words is not an ensembl id yet
          var inp = "https://gtexportal.org/rest/v1/reference/gene?geneId=" + words + "&gencodeVersion=v26&genomeBuild=GRCh38%2Fhg38&pageSize=250&format=json"
        }

        return inp;
    };

    /** transform a raw result from an API call into a display table **/
    this.process = function(data, index) {
      var json_obj = JSON.parse(data);

      if (index === 0 || typeof(index)==='undefined') {

          // returns all genes containing gene name
          var allgenes = json_obj.gene.map(item => item.geneSymbol);

          // Queried gene should be the shortest geneSymbol
          var gene = allgenes.reduce(function(a, b) {
                        return a.length <= b.length ? a : b;
                      })
          var geneuse = json_obj.gene.filter(x => x.geneSymbol === gene)

          return {status: 0.5, data: geneuse[0].gencodeId};

      } else if (index === 1) {

        // If the table is populated
        if (json_obj.medianGeneExpression.length > 0) {
          var children = json_obj.medianGeneExpression;

          // reorder by decreasing expression
          children = children.sort((a,b) => {
            return b['median'] - a['median'];
          })

          var details = '<b>Gene name: </b>' + children[1].geneSymbol + '</br><b>gencode ID: </b>' + children[1].gencodeId

          //reorder columns
          var children = JSON.parse(JSON.stringify(children, ['median','tissueSiteDetailId'] , 4));

          var table = document.createElement('table');
          function addHeaders(table, keys) {
            var row = table.insertRow();
            for( var i = 0; i < keys.length; i++ ) {
              var cell = row.insertCell();
              cell.appendChild(document.createTextNode(keys[i]));
            }
          }

          for( var i = 0; i < children.length; i++ ) {
            var child = children[i];
            if(i === 0 ) {
              addHeaders(table, Object.keys(child));
            }
            var row = table.insertRow();
            Object.keys(child).forEach(function(k) {
              console.log(k);
              var cell = row.insertCell();
              cell.appendChild(document.createTextNode(child[k]));
            })
          }
            return {
              status: 1,
              data: details + '</br></br><table>' + table.innerHTML + '</table>'
            }
          } else {
            return {status: 1, data: 'no results' }
          }
      }
    };

    /** construct a URL to an external information page **/
    this.external = function (query, index) {
      if (index>0) {
          return null;
      }
      return 'https://gtexportal.org/home/gene/' + query;
    }

}();
