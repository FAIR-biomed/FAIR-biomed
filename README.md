# FAIR-biomed


<a href="https://chrome.google.com/webstore/detail/fair-biomed/kaacnnmpcdbebmkbcddpckgpgphhcdhn"><img align="right" src="docs/img/ChromeWebStore_Badge_v2_206x58.png"></a>

FAIR-biomed is a browser extension for accessing open data resources in the biomedical domain. 




## Introduction

Vasts amounts of biomedical data are stored in open databases and knowledge-bases. Data in these resources are intended to be findable, accessible, interoperable, and reusable ([FAIR](https://www.nature.com/articles/sdata201618)). However, the data is distributed across many resources and integrating relevant parts within a specific project can be a challenge.

FAIR-biomed brings open data resources directly to specific research situations. Consider, for example, reading a report in the browser. With FAIR-biomed, you can access additional information on any part of the report without leaving the page.

To make use of the extension, first highlight some text, for example, a gene name. Press `Ctr+Shift+Z` on the keyboard (alternatively `right-click > FAIR-biomed search` with the mouse). A new box should appear prompting you to choose a data source to query. 

<p align="center">
<img src="docs/img/bmp4_list.png" width="310">
</p>

Clicking on one of the options triggers a query to the corresponding data service and displays a summary of results.

<p align="center">
<img src="docs/img/bmp4_europepmc.png" width="310">
<img src="docs/img/spacer.png" width="16px">
<img src="docs/img/bmp4_uniprot.png" width="310">
</p>

Search results provide summaries of the data resource, details of how the data query was executed, and a link to further data.




## Data sources

The FAIR-biomed app is composed of core components and a library of plugins. Each of the plugins provides access to a data resource and a specific query type.

The current plugin library provides access to a varied set of data sources.

| Data source      | Plugins      |
| :----- | :----- |
| [ClinGen](https://www.clinicalgenome.org/) | Allele registry |
| [EBI](https://www.ebi.ac.uk/) | Identifiers, ontology, GWAS, and chemical data |
| [Europe PMC](https://www.europepmc.org) | Literature | 
| [ExAC](http://exac.broadinstitute.org/) | Genomic variant annotation |
| [Genomics England](https://www.genomicsengland.co.uk/) | PanelApp |
| [HGNC](https://www.genenames.org/) | Gene nomenclature |
| [IMPC](https://www.mousephenotype.org) | Mouse model phenotypes |
| [JASPAR](http://jaspar.genereg.net/) | Transcription factor binding profiles |
| [LNCipedia](https://lncipedia.org/) | non-coding RNAs | 
| [MARRVEL](http://marrvel.org/) | Disease associations, gene expression |
| [NCBI](https://www.ncbi.nlm.nih.gov/) | Literature, gene summaries, significance of genetic variation |
| [Reactome](https://www.reactome.org/) | Pathways |
| [STRING](https://string-db.org//) | Protein interaction networks |
| [UCSC](https://genome.ucsc.edu/) | Genomic regions |
| [Uniprot](https://www.uniprot.org/) | Knowledgebase |
| [Wikimedia](https://www.wikimedia.org/) | Encyclopaedia and dictionary |




## Practical Issues

### Installation

The extension is available from the chrome [web store](https://chrome.google.com/webstore/detail/fair-biomed/kaacnnmpcdbebmkbcddpckgpgphhcdhn). Select the extension in the web store, click `Add to chrome`, and read the information boxes. Once installed, highlight text on a web page and press `Ctrl+Shift+Z` to perform searches.

To install the FAIR-biomed extension manually using code from this repository, see the [developer documentation](docs/install.md)

### Local URLs

The extension is automatically active on all pages that you accesss via urls starting with 'http' or 'https'. You can also use the extension with reports stored on your own computer, but this functionality is disabled by default by the chrome browser. To use this feature, you must enable it manually.
 
 - Select `Tools > Extensions` from the chrome menus; a new tab should appear listing all your installed extensions
 - Find `FAIR-biomed` and click `Details`; the view should change and display more details on the extension
 - Scroll down to the setting `Allow access to file URLs` and turn on the switch.

### Options

The extension has a dedicated page where you can tune which data sources you would like to use. 

 - Find the FAIR-biomed icon on the browser toolbar (it's usually on the top-right).
 - Click on the icon. A popup should appear. Click on the 'cogs' icon to open the Options page.

 
### Privacy

Once installed, the extension records a small amount of information to personalize its behavior to each user. See the [privacy policy](docs/privacy.md). 




## In the news

FAIR-biomed was featured in the news!

 - [Using Europe PMC RESTful APIs](http://blog.europepmc.org/2019/08/using-europe-pmc-restful-apis.html), August 20 2019.




## Notes and References

The idea of augmenting web pages with additional information has a long history. 

 - [Reflect](https://scholar.google.co.uk/scholar?hl=en&as_sdt=0%2C5&q=Reflect%3A+augmented+browsing+for+the+life+scientist&btnG=) was an early implementation of a browser extension aimed at biomedical research. This extension sent a whole web-page to a server for annotation.
 
 - [Dynamic linking](https://ieeexplore.ieee.org/document/4510879) outlined an idea to infer links to specialist sources by scanning the context of web pages.

 - [GIX](https://www.nature.com/articles/s41592-019-0477-9) described an extension for retrieving information on gene products.




## Get involved

Feedback and contributions are welcome. Please raise an issue in the github repository.

To incorporate a new data resource or plugin, see the [documentation](docs/).



