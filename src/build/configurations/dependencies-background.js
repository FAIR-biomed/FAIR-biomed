/**
 * a module defining an array of dependencies to copy
 *
 * **/


module.exports = [
    {
        "from": [
            "node_modules/sanitize-html/dist/sanitize-html.min.js"
        ],
        "to": "dist/resources/bundle-background.js"
    },
    {
        "from": ["node_modules/sanitize-html/LICENSE"],
        "to": "dist/resources/LICENSE-sanitize-html"
    }
]
