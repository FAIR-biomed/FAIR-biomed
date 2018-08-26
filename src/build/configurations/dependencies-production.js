/**
 * Definition of an array of dependencies (production code)
 *
 * **/


module.exports = [
    {
        "from": [
            "node_modules/underscore/underscore-min.js",
            "node_modules/react/umd/react.production.min.js",
            "node_modules/react-dom/umd/react-dom.production.min.js",
            "node_modules/react-motion/build/react-motion.js"
        ],
        "to": "dist/resources/bundle.js"
    },
    {
        "from": ["node_modules/underscore/LICENSE"],
        "to": "dist/resources/LICENSE-underscore"
    },
    {
        "from": ["node_modules/react/LICENSE"],
        "to": "dist/resources/LICENSE-react"
    },
    {
        "from": ["node_modules/react-dom/LICENSE"],
        "to": "dist/resources/LICENSE-react-dom"
    },
    {
        "from": ["node_modules/react-motion/LICENSE"],
        "to": "dist/resources/LICENSE-react-motion"
    }
]
