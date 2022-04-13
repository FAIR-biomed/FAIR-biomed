/**
 * a module defining an array of dependencies to copy
 *
 * **/

module.exports = [
    {
        "from": [
            "dist/library/library-min.js",
            "dist/resources/bundle-background.js",
            "dist/js/common.js",
            "dist/js/state.js",
            "dist/js/background.js"
        ],
        "to": "dist/js/service_worker.js"
    },
]
