/** Unit tests for a single plugin */


let assert = require('assert');
let path = require('path');
let fs = require('fs-extra');
let libraryloader = require('../src/build/library-loader.js');
let strchecker = require('../src/build/string-checker.js');



/* ==========================================================================
 * run-time logic to load specified plugin (or all available plugins)
 * ========================================================================== */

plugin_src = process.argv[3];

// check plugin is selected
let library = null;
if (plugin_src===null || typeof(plugin_src)==='undefined') {
    plugin_src = 'library';
    library = libraryloader.load(fs.realpathSync('library'));
} else {
    plugin_src = fs.realpathSync(plugin_src);
    library = libraryloader.load(plugin_src)
}

// remove the plugin status file
plugin_status_file = 'library'+path.sep+'_plugin_status';
fs.removeSync(plugin_status_file);




/* ==========================================================================
 * tests
 * ========================================================================== */


// expected structure for plugin components
let expected = {
    'reserved': ['namespace'],
    'strings': ['id'],
    'titles': ['title', 'subtitle'],
    'functions': ['claim', 'process', 'url', 'external'],
    'arrays': ['tags', 'endpoints'],
    'files': ['info', 'logo']
};


// helper function to carry out tests for one specific plugin object
function testOnePlugin(plugin) {

    /**
     * check plugin structure
     **/

    it ('does not contain reserved fields', function() {
        let present = expected['reserved'].filter(function(x) {
            return typeof(plugin[x]) !== 'undefined';
        });
        assert.deepEqual(present, []);
    });

    it ('defines required functions', function() {
        let missing = expected['functions'].filter(function(x) {
            return typeof(plugin[x]) !== 'function';
        });
        assert.deepEqual(missing, [])
    });

    it ('defines all required fields', function() {
        let strings = expected['strings'].concat(expected['titles']);
        let missing_strings = strings.filter(function(x) {
            return typeof(plugin[x]) !== 'string';
        });
        assert.deepEqual(missing_strings, [], 'missing strings');
        let missing_arrays = expected['arrays'].filter(function(x) {
            return  !(typeof(plugin[x]) === 'object' && plugin[x] instanceof Array)
        });
        assert.deepEqual(missing_arrays, [], 'missing arrays');
    });

    it ('does not use special characters in strings or unclean html', function() {
        let invalid = expected['strings'].filter(function(x) {
            return (strchecker.badChars(plugin[x])).length>0
        });
        assert.deepEqual(invalid, []);
        let unclean = expected['titles'].filter(function(x) {
            return !strchecker.isCleanStrict(plugin[x])
        });
        assert.deepEqual(unclean, [], 'unclean html')
    });

    it('provides static files for logo and info', function() {
        let dirpath = path.dirname(plugin._filepath);
        let missing = expected['files'].filter(function(x) {
            if (plugin[x]===null) return false;
            return !fs.existsSync(dirpath+path.sep+plugin[x])
        });
        assert.deepEqual(missing, [])
    });

    it('has clean html in info page', function() {
        let infopath = plugin.info;
        let dirname = path.dirname(plugin._filepath);
        let info = fs.readFileSync(dirname+path.sep+infopath).toString();
        assert.equal(strchecker.isClean(info), true)
    });

    /**
     * check plugin actions
     **/

    it('produces a number during claim', function () {
        let result = plugin.claim('abc');
        assert.equal(typeof(result), 'number',
            'claim(query) produced ' + JSON.stringify(result));
    });

    it('does not claim empty queries', function () {
        let result = plugin.claim('');
        assert.equal(result, 0,
            'claim("") produced ' + JSON.stringify(result));
    });

    it ('produces reliable urls, or null', function() {
        let result = plugin.url('');
        if (result === null) {
            // a null url is allowed
            assert.equal(result, null);
        } else {
            // non-null urls must link to http
            let url_prefix = plugin.url('').substr(0, 4);
            assert.equal(url_prefix, 'http', 'query url')
        }
    });

    it ('produces reliable external urls', function() {
        let external = plugin.external('').substr(0, 4);
        assert.equal(external, 'http', 'external url')
    });

    it ('declares reliable API endpoints', function() {
        plugin.endpoints.map(function(x) {
            let url_prefix = x.substr(0, 4);
            return assert.equal(url_prefix, "http", "endpoint url")
        })
    });

    /**
     * plugin-specific tests (defined next to plugin source file)
     **/

    let plugindir = path.dirname(plugin._filepath) + path.sep;
    let testfile = plugindir + 'test-'+plugin.id+'.js';
    if (fs.pathExistsSync(testfile)) {
        require(testfile)
    }

    /**
     * determine if all the tests passed,
     * record plugin as safe to use (write to a file in the library directory)
     **/

    after(function () {
        let allpass = this.test.parent.tests.every((t)=> t.state==='passed');
        if (allpass) {
            fs.appendFileSync(plugin_status_file, plugin.id+'\n')
        }
    });
}


/** test all plugins one at a time **/
describe('Plugin library: '+plugin_src, function () {
    library.forEach(function(plugin) {
        describe('Plugin: '+plugin.id, function() {
            testOnePlugin(plugin)
        })
    })
});

