/**
 * Handling of FAIR-biomed components in extension background
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */

'use strict';

// a cache of icons fetched from disk
var icons = {};
var logos = {};

// set debugging to True to get some console.log messages
var verbose = true;
function developer_log(x) {
    if (verbose) {
        console.log(x);
    }
}


// settings for sanitization of data
var sanitize_config = {
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
};


/** fetch an icon content, either from a cache or from disk **/
function getIcon(iconpath, sendResponse) {
    let promise = new Promise(function(resolve, reject) {
        let ipath = iconpath.split(" ").join("/");
        if (icons[ipath] !== undefined) {
            resolve(icons[ipath]);
        }
        let xhr = new XMLHttpRequest();
        xhr.onload=function(){
            icons[ipath] = xhr.response;
            resolve(icons[ipath]);
        };
        xhr.ontimeout=function() {
            reject("timeout");
        };
        xhr.open("GET","resources/"+ipath+".svg");
        xhr.send();
    });
    promise.then((data) => sendResponse({data: data}));
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
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}


/** fetch logo data, either from a cache or from disk **/
function getLogo(id, sendResponse) {
    let namespace = library['plugins'][id].namespace;
    let filename = library['plugins'][id].logo;
    if (filename===null) {
        filename = '_logo_na.png'
    } else {
        filename = namespace+'.'+filename
    }

    let format = filename.endsWith('.svg') ? 'svg' : 'png';
    let promise = new Promise(function(resolve, reject) {
        if (logos[id]!==undefined) {
            resolve(logos[id]);
        }
        let xhr=new XMLHttpRequest();
        if (format==='png') {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onload=function() {
            if (format === 'png') {
                let b64 = bufferToBase64(xhr.response);
                logos[id] = '<img src="data:image/png;base64,'+b64+'">';
            } else {
                logos[id] = xhr.response;
            }
            resolve(logos[id]);
        };
        xhr.ontimeout=function() {
            reject('timeout');
        };
        xhr.open('GET', 'library/logo/'+filename);
        xhr.send();
    });
    promise.then((data)=> sendResponse({ data: data}));
}


/** fetch state for all plugins **/
function fetchPluginStatus(id) {
    let key = "plugin:" + id;
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(key, function (data) {
            let status = (JSON.stringify(data) !== "{}") ? data[key] : [true, 0];
            if (status[STATE_INDEX_COUNT] === undefined) {
                status[STATE_INDEX_COUNT] = DARK_COUNT;
            }
            resolve([id, status[STATE_INDEX_ACTIVE], status[STATE_INDEX_RATING], status[STATE_INDEX_COUNT]]);
        })
    });
}


/** ask all plugins to claim a certain query string **/
function claimQuery(query, sendResponse) {
    // assess which plugins are active, their usage counts, etc.
    let status = library["names"].map(fetchPluginStatus);
    let plugins = library["plugins"];
    Promise.all(status).then(function(values) {
        let result = values.map(function(x) {
            if (!x[1]) {
                return null;
            }
            let id = x[0], plug = plugins[id];
            let score = plug.claim(query) * Math.log10(x[3]);
            if (score<=0) {
                return null;
            }
            return {
                id: id,
                title: plug.title,
                subtitle: plug.subtitle,
                score: score,
                rating: x[2]
            };
        });
        let hits = result.filter((x)=> x!== null);
        sendResponse(hits);
    })
}


/**
 * apply sanitization to all components of the response
 *
 * @param response
 * @returns {*}
 */
function sanitizeResponse(response) {
    //developer_log("sanitizing: "+JSON.stringify(response));
    if (is.undefined(response.data)) {
        return {status: 0, data: "invalid response, no data"};
    }
    let sanitizeOne = function (data) {
        //developer_log("sanitizeOne: "+data);
        if (is.string(data) || is.number(data)) {
            return sanitizeHtml(data, sanitize_config);
        } else if (is.array(data)) {
            return data.map(x => sanitizeOne(x))
        } else {
            return "";
        }
    };

    let clean = {};
    let raw = response.data;
    if (is.string(raw)) {
        clean = sanitizeOne(raw);
    } else if (is.array(raw)) {
        clean = raw.map(sanitizeOne)
    } else {
        _.each(raw, function(value, key) {
            clean[key] = sanitizeOne(value);
        });
    }

    response.data = clean;
    //developer_log("after sanitizing: "+JSON.stringify(response));
    return response;
}


/** get an external url from a plugin.
 *
 * This queries the plugin for multiple query/index.
 * It thus allows the plugin to choose whether to contruct
 * the external url based on the round 1 query, round 2 query, etc.
 *
 * @param plugin object
 * @param queries array of strings
 * @returns string with url
 *
 */
function getExternal(plugin, queries) {
    var urls = queries.map(function(x, i) {
        return plugin.external(x, i);
    });
    developer_log("considering urls: "+JSON.stringify(urls));
    var urls = urls.filter(x => !is.null(x));
    return urls[0];
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
    // force index into an integer
    if (is.undefined(index)) {
        index = 0;
    }

    developer_log("processing query: "+JSON.stringify(queries));

    // get plugin details
    let plugin = library["plugins"][id];
    let query = queries.slice(-1)[0].trim();
    let url = plugin.url(query, index);
    developer_log("url: "+url);

    // augment a response object with plugin-specific metadata
    let buildSendResponse = function(response) {
        response.url = url;
        response.external = null;
        if (response.status===1) {
            response.external = getExternal(plugin, queries);
        }
        return response;
    };

    // handlers for promise
    let handleResponse = function(response) {
        // decide whether to output or to do another round trip to url/process
        //developer_log("working with promise result "+JSON.stringify(response))
        if (response.status === 0 || response.status === 1) {
            sendResponse(buildSendResponse(response))
        } else if (response.status>0 && response.status < 1) {
            processQuery(id, queries.concat([response.data]), sendResponse, index+1)
        }
    };
    let handleReject = function(msg) {
        sendResponse({status: 0, data: msg})
    };

    // execute the query
    developer_log("processing query");
    let promise = new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        if (url.endsWith(".png")) {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onload = function() {
            //developer_log("response: "+xhr.response);
            try {
                if (url.endsWith(".png")) {
                    let b64 = bufferToBase64(xhr.response);
                    var response = {status: 1, data: '<img src="data:image/png;base64,'+b64+'">'};
                } else {
                    var response = plugin.process(xhr.response, index, query);
                }
                resolve(sanitizeResponse(response));
            } catch(e) {
                resolve({status: 0, data: "error parsing server response"});
            }
        };
        xhr.ontimeout = function() {
            reject("timeout");
        };
        xhr.onerror = function() {
            developer_log("got error: " + xhr.status);
            reject('error  or page not available');
        };
        developer_log("sending GET request to: "+url);
        xhr.open("GET", url);
        if (!url.endsWith(".png")) {
            xhr.setRequestHeader('Accept', 'application/json');
        }
        xhr.send();
    });
    promise.then(handleResponse, handleReject);
}


/**
 * Fetch info information about a plugin
 */
function processInfo(id, sendResponse) {
    let plugin = library["plugins"][id];
    let infopath = plugin.info;
    let promise = new Promise(function(resolve, reject) {
        if (infopath===undefined || infopath===null) {
            resolve({data: "No info data available"});
        }
        let xhr=new XMLHttpRequest();
        xhr.onload=function() {
            var result = {status: 1, data: xhr.response};
            resolve(sanitizeResponse(result));
        };
        xhr.ontimeout=function() {
            reject("timeout");
        };
        xhr.open("GET", "library/info/"+plugin.namespace+"."+infopath);
        xhr.send();
    });
    promise.then((data)=> sendResponse(data));
}


/**
 * Handle messages from content scripts
 * **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // this function always returns true to signal asynchronous response

        /** Handle requests for icons and logos **/
        let handlers = {icon: getIcon, logo: getLogo};
        let handler = handlers[request.action];
        if (!is.undefined(handler)) {
            handler(request.path, sendResponse);
            return true;
        }

        /** Handle requests for plugin claims and processing **/
        if (request.action==="claim") {
            claimQuery(request.query, sendResponse);
            return true;
        } else if (request.action==="run") {
            processQuery(request.id, [request.query], sendResponse);
            return true;
        } else if (request.action==="info") {
            processInfo(request.id, sendResponse);
            return true;
        } else if (request.action==="rate") {
            setPluginRating(request.id, request.rating).then(sendResponse);
            return true;
        } else if (request.action==="update_count") {
            incrementPluginCount(request.id).then(sendResponse);
            return true;
        }
});


/**
 * Handle request from context menu (right click menu)
 * **/
chrome.contextMenus.create({
    id: "FAIR-biomed-context",
    title: "FAIR-biomed search",
    contexts: ["selection", "page"]
});
chrome.contextMenus.onClicked.addListener(function(itemData) {
    let itemId = itemData.menuItemId;
    if (itemId === "FAIR-biomed" || itemId === "FAIR-biomed-context") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {action: "contextMenuClick"}, function(response) {})
        });
    }
});

