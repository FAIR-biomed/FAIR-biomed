/**
 * Handling of FAIR-biomed plugin state from options and background code.
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */


// default value for plugin usage count (dark count)
const STATE_INDEX_ACTIVE = 0;
const STATE_INDEX_RATING = 1;
const STATE_INDEX_COUNT = 2;

const DARK_COUNT = 10;


/** generic function to set the state of a pluing
 *
 * @param id string that identifies the plugin
 * @param value new value for the state parameter
 * @param index integer, position in the state vector to adjust
 */
function setPluginState(id, value, index) {
    let key = "plugin:" + id;
    return new Promise(function () {
        chrome.storage.sync.get(key, function (data) {
            // only set new value if needed
            if (data[key][index]!==value) {
                data[key][index] = value;
                chrome.storage.sync.set(data);
            }
        });
    })
}

/** set the activation state for a plugin **/
function setPluginActivation(id, value) {
    return setPluginState(id, value, STATE_INDEX_ACTIVE);
}


/** set the rating state for a plugin **/
function setPluginRating(id, value) {
    return setPluginState(id, value, STATE_INDEX_RATING);
}


/** set the count state for a plugin **/
function incrementPluginCount(id) {
    let key = "plugin:" + id;
    return new Promise(function () {
        chrome.storage.sync.get(key, function (data) {
            let state = (JSON.stringify(data) !== "{}") ? data[key] : [true, 0, DARK_COUNT];
            if (state[2] === undefined) {
                state[2] = DARK_COUNT;
            }
            setPluginState(id, state[STATE_INDEX_COUNT]+1, STATE_INDEX_COUNT);
        });
    });
}
/** set the count state for a plugin back to the original value **/
function resetPluginCount(id) {
    return setPluginState(id, DARK_COUNT, STATE_INDEX_COUNT);
}

