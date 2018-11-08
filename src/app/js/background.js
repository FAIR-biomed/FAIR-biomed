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
        'svg', 'path', 'text', 'tspan', 'defs', 'g', 'symbol', 'use' ],
    allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src' ],
        p: ['class'],
        svg: ['view*', 'version', 'xml*'],
        path: ['*'],
        symbol: ['overflow', 'id'],
        text: ['x', 'y', 'style'],
        g: ['*'],
        use: ['*']
    }
};


/** fetch an icon content, either from a cache or from disk **/
function getIcon(iconpath, sendResponse) {
    var promise = new Promise(function(resolve, reject) {
        var ipath = iconpath.split(" ").join("/");
        if (icons[ipath] !== undefined) {
            resolve(icons[ipath]);
        }
        var xhr = new XMLHttpRequest();
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
    var namespace = library['plugins'][id].namespace;
    var filename = library['plugins'][id].logo;
    if (filename===null) {
        filename = '_logo_na.png'
    } else {
        filename = namespace+'.'+filename
    }

    var format = filename.endsWith('.svg') ? 'svg' : 'png';
    var promise = new Promise(function(resolve, reject) {
        if (logos[id]!==undefined) {
            resolve(logos[id]);
        }
        var xhr=new XMLHttpRequest();
        if (format==='png') {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onload=function() {
            if (format === 'png') {
                var b64 = bufferToBase64(xhr.response);
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


/** fetch active status for all plugins **/
function isActive(id) {
    var key = "plugin:" + id;
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(key, function (data) {
            var active = (JSON.stringify(data) !== "{}") ? data[key] : [true, 0];
            resolve([id, active[0], active[1]]);
        })
    });
}


/** ask all plugins to claim a certain query string **/
function claimQuery(query, sendResponse) {
    // assess which plugins are active
    var actives = library["names"].map(isActive);
    var plugins = library["plugins"];
    Promise.all(actives).then(function(values) {
        var result = values.map(function(x) {
            if (!x[1]) {
                return null;
            }
            var id = x[0], plug = plugins[id];
            var score = plug.claim(query);
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
        var hits  = result.filter((x)=> x!== null);
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
    developer_log("sanitizing: "+JSON.stringify(response));
    if (is.undefined(response.data)) {
        return {status: 0, data: "invalid response, no data"};
    }
    var sanitizeOne = function (data) {
        if (is.string(data) || is.number(data)) {
            return sanitizeHtml(data, sanitize_config);
        } else if (is.array(data)) {
            return data.map(x => sanitizeOne(x))
        } else {
            return "";
        }
    };

    var clean = {};
    var raw = response.data;
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
    var plugin = library["plugins"][id];
    var query = queries.slice(-1)[0].trim();
    var url = plugin.url(query, index);
    developer_log("url: "+url);

    // augment a response object with plugin-specific metadata
    var buildSendResponse = function(response) {
        response.url = url;
        response.external = null;
        if (response.status===1) {
            response.external = getExternal(plugin, queries);
        }
        return response;
    }

    // handlers for promise
    var handleResponse = function(response) {
        // decide whether to output or to do another round trip to url/process
        developer_log("working with promise result "+JSON.stringify(response))
        if (response.status === 0 || response.status === 1) {
            sendResponse(buildSendResponse(response))
        } else if (response.status>0 && response.status < 1) {
            processQuery(id, queries.concat([response.data]), sendResponse, index+1)
        }
    };
    var handleReject = function(msg) {
        sendResponse({status: 0, data: msg})
    }

    developer_log("processing query");
    // execute the query
    var promise = new Promise(function(resolve, reject) {
        var xhr=new XMLHttpRequest();
        xhr.onload=function() {
            developer_log("response: "+xhr.response);
            try {
                var response = plugin.process(xhr.response, index, query);
                resolve(sanitizeResponse(response));
            } catch(e) {
                resolve({status: 0, data: "error parsing server response"});
            }
        };
        xhr.ontimeout=function() {
            reject("timeout");
        };
        xhr.onerror = function() {
            developer_log("got error: " + xhr.status);
            reject('error  or page not available');
        }
        developer_log("sending GET request to: "+url);
        xhr.open("GET", url);
        xhr.send();
    });
    promise.then(handleResponse, handleReject);
}


/**
 * Fetch info information about a plugin
 */
function processInfo(id, sendResponse) {
    var plugin = library["plugins"][id];
    var infopath = plugin.info;
    var promise = new Promise(function(resolve, reject) {
        if (infopath===undefined || infopath===null) {
            resolve({data: "No info data available"});
        }
        var xhr=new XMLHttpRequest();
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


/** Assign a new rating to a plugin **/
function processRating(id, rating, sendResponse) {
    var key = "plugin:" + id;
    // fetch existing state current rating
    new Promise(function(resolve, reject) {
        chrome.storage.sync.get(key, function (data) {
            var state = (JSON.stringify(data) !== "{}") ? data[key] : [true, 0];
            state[1] = rating;
            var msg = {};
            msg[key] = state;
            chrome.storage.sync.set(msg);
            resolve(msg);
        })
    }).then(sendResponse);
}



/**
 * Handle messages from content scripts
 * **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // this function always returns true to signal asynchronous response

        /** Handle requests for icons and logos **/
        var handlers = {icon: getIcon, logo: getLogo};
        var handler = handlers[request.action];
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
            processRating(request.id, request.rating, sendResponse);
            return true;
        }
});


/**
 * Handle request from context menu (right click menu)
 * **/
chrome.contextMenus.create({
    id: "FAIR-biomed",
    title: "FAIR-biomed search",
    contexts: ["selection", "page"]
});
chrome.contextMenus.onClicked.addListener(function(itemData) {
    if (itemData.menuItemId === "FAIR-biomed") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {action: "contextMenuClick"}, function(response) {})
        });
    }
});
