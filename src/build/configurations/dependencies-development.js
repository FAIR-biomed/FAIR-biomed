/**
 * Definition of an array of dependencies (development code)
 *
 * **/


module.exports = [
    {
        "from": [
            "node_modules/react/umd/react.development.js",
            "node_modules/react-dom/umd/react-dom.development.js",
            "node_modules/react-motion/build/react-motion.js"
        ],
        "to": "dist/resources/bundle.js"
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
