/**
 * Module for evaluating whether a string is composed of allowed characters
 *
 * **/


var sanitizer = require("sanitize-html")

// minimal set of tags allowed (e.g. for titles)
var sanitize_config_strict = {
    allowedTags: [ 'b', 'i', 'em', 'strike'],
    allowedAttributes: {}
}
// small but more expressive set of tags (e.g. for longer descriptions)
var sanitize_config = {
    allowedTags: [ 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code',
        'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 'hr', 'br', 'pre'],
    allowedAttributes: {
        a: ['href', 'name', 'target'],
        p: ['class'],
    }
}


module.exports = new function() {

    /** set of characters allowed in a plugin id **/
    var okchars = ["abcdefghijklmnopqrstuvwxyz",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "012346789", "._-"].join("");

    /** identify characters in string x that are not ok
     *
     * by default, this uses okchars
     * **/
    this.badChars = function (x) {
        if (typeof(x) === "undefined" || x === null) {
            return [];
        }
        // check each characer of x for overlap with string_chars
        var badchars = x.split("").filter(function (y) {
            return !okchars.includes(y)
        })
        return badchars;
    }

    /** determine if a string snippet is already sanitized/clean **/
    this.isClean = function(x) {
        return x === sanitizer(x, sanitize_config);
    }

    /** determine if a string snippet is already sanitized/clean **/
    this.isCleanStrict = function(x) {
        return x === sanitizer(x, sanitize_config_strict);
    }

}();

