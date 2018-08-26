# FAIR-biomed

Browser extension for accessing open data resources in the biomedical domain. 




## Introduction

Vasts amounts of biomedical data are stored in open databases and knowledge-bases. Data in these resources are intended to the findable, accessible, interoperable, and reusable ([FAIR](https://www.nature.com/articles/sdata201618)). However, the data is distributed across many resources and integrating relevant parts within a specific project can be a challenge.

FAIR-biomed is a browser extension (chrome) that brings open data resources directly to specific research situations. Consider, for example, reading a data report in your browser. With the browser extension, you can access additional information on any part of the report without leaving your report page.

On any page in the browser, highlight some text and press `Ctr+Shift+Z`. A new box should appear prompting you to choose a data source to query with your highlighted query.

TO DO - screenshots




## Data sources

The FAIR-biomed app is composed of some core components and a library of plugins. Each of the plugins provides access to a data resource and a specific query type.

The current plugin library provides access to a small but varied set of data sources.

| Data source      | Plugins      |
| :----- | :----- |
| [EBI](https://www.ebi.ac.uk/) | Ontology and chemical data |
| [ExAC](http://exac.broadinstitute.org/) | Genomic variant annotation |
| [IMPC](https://www.mousephenotype.org) | Mouse model phenotypes |
| [NCBI](https://www.ncbi.nlm.nih.gov/) | PubMed literature search |
| [Uniprot](https://www.uniprot.org/) | Knowledgebase |
| [Wikimedia](https://www.wikimedia.org/) | Wikipedian and Wiktionary |




## Installation

TO DO - chrome installation

To install the FAIR-biomed extension from a local source, see the [develper's documentation](docs/install.md)




## Get involved

Feedback and contributions are welcome. Please raise an issue in the github repository. 

To incorporate a new data resource or plugin, see the [documentation](docs/).




## Notes and References

 - [Reflect](https://scholar.google.co.uk/scholar?hl=en&as_sdt=0%2C5&q=Reflect%3A+augmented+browsing+for+the+life+scientist&btnG=) - An early example of a browser extension aimed at facilitating biomedical research.

 - [Fontawesome](https://fontawesome.com/icons) - Icons used in the app come from the free set of the Fontawesome collection. 

 - Third-party libraries. This browser uses several third-party libraries. These are listed in file `package.json`. 