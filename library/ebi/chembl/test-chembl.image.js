/** Unit tests specific to chembl image plugin **/

let assert = require('assert');
let fs = require("fs-extra");
let plugin = require('./chembl.image');


it("claims CHEMBL ids", function () {
    assert.equal(plugin.claim("CHEMBL25"), 1);
    assert.equal(plugin.claim("CHEMBL20001"), 1);
});

it("processes response by stripping <?xml ... ?>", function () {
    let response = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg version="1.1"><path d="M 463.394,230.199 463.394,131.623" /></svg>';
    let result = plugin.process(response);
    assert.equal(result.status, 1);
    assert.equal(result.data.substr(0, 4), "<svg");
});

