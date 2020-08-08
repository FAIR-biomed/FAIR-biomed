/**
 * A collection of messages that plugins can use to signal errors
 *
 * **/


module.exports = new function() {

    let more_info = "<p>For information about possible causes for this message, " +
        "please see our "+
        "<a href=\"https://fair-biomed.github.io/questionsanswers/\" target=\"_blank\">"+
        "documentation</a>.</p>";

    this.processing_error = "<p>An error occurred while processing content.</p> " +
        more_info;

    this.empty_server_output = "<p>The server reported no hits for this query.</p> " +
        more_info;

}();

