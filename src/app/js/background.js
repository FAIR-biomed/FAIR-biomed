/**
 * Handling of FAIR-biomed components in extension background
 * (API transactions, sanitizing API content, etc.)
 *
 * */

'use strict'

const sanitizeHtml = require("sanitize-html")


let err_msg = {
    more_info: "For more information, please see the " +
        "<a href=\"https://fair-biomed.github.io/questionsanswers/\" target=\"_blank\">" +
        "online documentation</a>.",
    plugin_error: "Error processing server response.",
    server_error: 'Error, or server not available.',
    server_timeout: "Server timed out.",
    empty: "The database reported no hits for this query."
}


// a cache of icons fetched from disk
let icons = {}
let logos = {}

// settings
let settings = {
    auto_last: 0,
    last_used: null
}

// set debugging to True to get some console.log messages
let verbose = true
function developer_log(x) {
    if (verbose) {
        console.log(x)
    }
}


// settings for sanitization of data
let sanitize_config = {
    allowedTags: [ 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span',
        'img', 'svg', 'path', 'text', 'tspan', 'defs', 'g', 'symbol', 'use' ],
    allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: ['src'],
        p: ['class'],
        svg: ['view*', 'version', 'xml*'],
        path: ['*'],
        span: ['style'],
        symbol: ['overflow', 'id'],
        text: ['x', 'y', 'style'],
        g: ['*'],
        use: ['*']
    },
    allowedSchemesByTag: {
        img: [ 'data', 'http', 'https' ]
    }
}


/** fetch an icon content, either from a cache or from disk **/
function getIcon(iconpath, sendResponse) {
    let ipath = iconpath.split(" ").join("/")
    let url = chrome.runtime.getURL("resources/" + ipath + ".svg")
    fetch(url)
        .then(response => response.text())
        .then(data => {
            icons[ipath] = data
            sendResponse({data: data})
        })
}


/**
 * Convert an arraybuffer (from a png read) into a base64 string
 *
 * Code copied from this gist:
 * https://gist.github.com/Deliaz/e89e9a014fea1ec47657d1aac3baa83c
 *
 * @param buffer
 * @returns {string}
 */
function bufferToBase64(buffer) {
    let binary = ''
    let bytes = new Uint8Array(buffer)
    let len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}


/** fetch logo data, either from a cache or from disk **/
function getLogo(id, sendResponse) {
    let namespace = library['plugins'][id].namespace
    let filename = library['plugins'][id].logo
    if (filename===null) {
        filename = '_logo_na.png'
    } else {
        filename = namespace + '.' + filename
    }
    let url = chrome.runtime.getURL("library/logo/" + filename)
    let format = filename.endsWith('.svg') ? 'svg' : 'base64'
    if (format !== 'svg') {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(data => {
                let b64 = bufferToBase64(data)
                logos[id] = '<img src="data:image/png;base64,'+b64+'">'
                sendResponse({data: logos[id]})
            })
    } else {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                logos[id] = data
                sendResponse({data: logos[id]})
            })
    }
}


/** fetch state for all plugins **/
function fetchPluginStatus(id) {
    let key = "plugin:" + id
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(key, function (data) {
            let status = (JSON.stringify(data) !== "{}") ? data[key] : [true, 0]
            if (status[STATE_INDEX_COUNT] === undefined) {
                status[STATE_INDEX_COUNT] = DARK_COUNT
            }
            resolve([id, status[STATE_INDEX_ACTIVE], status[STATE_INDEX_RATING], status[STATE_INDEX_COUNT]])
        })
    })
}

/** fetch an extension setting from the chrom storage **/
function fetchExtensionSetting(id) {
    let key = "settings:" + id
    chrome.storage.sync.get(key, function (data) {
        settings[id] = (JSON.stringify(data) !== "{}") ? data[key] : null
    })
}


/** ask all plugins to claim a certain query string **/
function claimQuery(query, sendResponse) {
    // refresh values of settings
    fetchExtensionSetting("last_used")
    fetchExtensionSetting("auto_last")
    // assess which plugins are active, their usage counts, etc.
    let status = library["names"].map(fetchPluginStatus)
    let plugins = library["plugins"]
    Promise.all(status).then(function(values) {
        let result = values.map(function(x) {
            if (!x[1]) {
                return null
            }
            let id = x[0], plug = plugins[id]
            let score = plug.claim(query) * Math.log10(x[3])
            if (score<=0) {
                return null
            }
            return {
                id: id,
                title: plug.title,
                subtitle: plug.subtitle,
                score: score,
                rating: x[2]
            }
        })
        let hits = result.filter((x)=> x!== null)
        let preferred = null
        // check if user has a preferred plugin
        if (settings["auto_last"]) {
            let last_used = settings["last_used"]
            if (hits.filter((x) => x.id == last_used).length) {
                preferred = settings["last_used"]
            }
        }
        sendResponse({preferred: preferred, hits: hits})
    })
}


/**
 * apply sanitization to all components of the response.data
 *
 * @param response
 * @returns {*}
 */
function sanitizeResponse(response) {
    if (is.undefined(response.data)) {
        return response
    }
    let sanitizeOne = function (data) {
        if (is.string(data) || is.number(data)) {
            return sanitizeHtml(data, sanitize_config)
        } else if (is.array(data)) {
            return data.map(x => sanitizeOne(x))
        } else {
            return ""
        }
    }

    let clean = {}
    let raw = response.data
    if (is.string(raw)) {
        clean = sanitizeOne(raw)
    } else if (is.array(raw)) {
        clean = raw.map(sanitizeOne)
    } else {
        Object.keys(raw).map(function(key) {
          clean[key] = sanitizeOne(raw[key])
        })
    }

    response.data = clean
    return response
}


/** get an external url from a plugin.
 *
 * This queries the plugin for multiple query/index.
 * It thus allows the plugin to choose whether to construct
 * the external url based on the round 1 query, round 2 query, etc.
 *
 * @param plugin object
 * @param queries array of strings
 * @returns string with url
 *
 */
function getExternal(plugin, queries) {
    let urls = queries.map(function(x, i) {
        return plugin.external(x, i)
    })
    return urls.filter(x => !is.null(x))[0]
}


/** use one plugin to fetch data for a query
 *
 * @param id string, plugin identifier
 * @param queries array, query strings.
 * (This is an array to keep track of multiple rounds of processing)
 * @param sendResponse function, used to send answer
 * @param index integer, keeps track of processing round
 * **/
function processQuery(id, queries, sendResponse, index) {
    if (is.undefined(index)) {
        index = 0
    }

    // get plugin details
    let plugin = library["plugins"][id]
    let query = queries.slice(-1)[0].trim()
    let url = plugin.url(query, index)

    // augment a response object with plugin-specific metadata
    let buildSendResponse = function(response) {
        response.url = queries.map(function(x, i) { return plugin.url(x, i) })
        response.url = response.url.join("\n\n")
        response.external = null
        response.external = getExternal(plugin, queries)
        if (response.data===undefined) {
            response.data = [err_msg.empty, err_msg.more_info]
        }
        return response
    }

    let handleResponse = function(response) {
        // decide whether to output or to do another round trip to url/process
        if (response.status === 0 || response.status === 1) {
            sendResponse(buildSendResponse(response))
        } else if (response.status > 0 && response.status < 1) {
            processQuery(id, queries.concat([response.data]), sendResponse, index+1)
        }
    }

    // execute the query
    if (url === null) {
        handleResponse(sanitizeResponse(plugin.process(query)))
        return
    }
    const fetchHeaders = url.endsWith(".png") ? {} : {'Accept': 'application/json'}
    fetch(url, {headers: fetchHeaders})
        .then(response => {
            if (!response.ok) {
                handleResponse({status: 0, data: [err_msg.server_error, err_msg.more_info] })
            }
            return response
        })
        .then(response => {
            if (url.endsWith(".png")) return response.arrayBuffer()
            return response.text()
        })
        .then(data => {
            developer_log(data)
            try {
                let result = plugin.process(data, index, query)
                handleResponse(sanitizeResponse(result))
            } catch(e) {
                handleResponse({status: 1, data: [err_msg.plugin_error, err_msg.more_info] })
            }
        }).catch(function(error) {
            handleResponse({status: 0, data: [err_msg.server_error, err_msg.more_info] })
        })
}


/** fetch info information about a plugin **/
function processInfo(id, sendResponse) {
    let plugin = library["plugins"][id]
    let infopath = plugin.info
    let url = chrome.runtime.getURL("library/info/"+plugin.namespace+"."+infopath)
    fetch(url)
        .then(response => response.text())
        .then(data => {
            sendResponse({status: 1, data: sanitizeResponse(data)})
        })
}


/**
 * Handle messages from content scripts
 * **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // this function always returns true to signal asynchronous response

        /** Handle requests for icons and logos **/
        let handlers = {icon: getIcon, logo: getLogo}
        let handler = handlers[request.action]
        if (!is.undefined(handler)) {
            handler(request.path, sendResponse)
            return true
        }

        /** Handle requests for plugin claims and processing **/
        if (request.action==="claim") {
            claimQuery(request.query, sendResponse)
        } else if (request.action==="run") {
            processQuery(request.id, [request.query], sendResponse)
            setCustomization("last_used", request.id)
        } else if (request.action==="info") {
            processInfo(request.id, sendResponse)
        } else if (request.action==="rate") {
            setPluginRating(request.id, request.rating).then(sendResponse)
        } else if (request.action==="update_count") {
            incrementPluginCount(request.id).then(sendResponse)
        }
        return true
})


/**
 * Handle request from context menu (right click menu)
 * **/
chrome.runtime.onInstalled.addListener(function(details) {
    chrome.contextMenus.create({
        id: "FAIR-biomed-context",
        title: "FAIR-biomed search",
        contexts: ["selection", "page"]
    })
})

chrome.contextMenus.onClicked.addListener(function(itemData) {
    let itemId = itemData.menuItemId
    if (itemId === "FAIR-biomed" || itemId === "FAIR-biomed-context") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {action: "contextMenuClick"}, function(response) {})
        })
    }
})

