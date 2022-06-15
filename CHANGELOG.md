# 0.2.2

New plugins: none

Other updates:

- fixed incorrect positioning of box on long pages


# 0.2.1

New plugins: none

Deprecated plugins:

- ExAC (non-responsive API)

Other updates:

- fixed bug (introduced in v0.2.0) that triggered an infinite render loop when the extension popup launched without a text selection
- removed dependence on bootstrap to avoid linking to external code


# 0.2.0

New plugins: none

Other updates:

 - migrated chrome manifest to V3 (required by chrome app store)
 - upgraded dependencies, including react to V18
 - refactored UI code from class-based to function-based style
 - removed the "minimize" button from the main popup box


# 0.1.3

New plugins: none

Other updates:

 - clearer messages when APIs return empty results, including links to Q&A on 
 website
 - updates to some API URLS (chembl, marrvel) and misc plugin tuning
 - reproducible code boxes list all URLs used in multi-round searches
 

# 0.1.2

New plugins:

 - NCBI dbSNP
 - NCBI PubChem

Other updates:

 - Update of moving & dragging through react-rnd (thanks @rhenkin)
 - Use of browserify to bundle dependencies (thanks @rhenkin)
 - misc tuning to claim rules in various plugins

