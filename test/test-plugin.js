/** Unit tests for a single plugin */


var assert = require('assert');
var path = require('path');
var fs = require('fs-extra')
var libraryloader = require('../src/build/library-loader.js');
var strchecker = require('../src/build/string-checker.js');



/* ==========================================================================
 * run-time logic to load specified plugin (or all available plugins)
 * ========================================================================== */

plugin_src = process.argv[3];

// check plugin is selected
var library = null;
if (plugin_src===null || typeof(plugin_src)==='undefined') {
    plugin_src = 'library';
    library = libraryloader.load(fs.realpathSync('library'));
} else {
    plugin_src = fs.realpathSync(plugin_src);
    library = libraryloader.load(plugin_src)
}

// remove the plugin status file
plugin_status_file = 'library'+path.sep+'plugin_status';
fs.removeSync(plugin_status_file);




/* ==========================================================================
 * tests
 * ========================================================================== */


// expected structure for plugin components
var expected = {};
expected['reserved'] = ['namespace'];
expected['strings'] = ['id'];
expected['titles'] = ['title', 'subtitle'];
expected['functions'] = ['claim', 'process', 'url', 'external'];
expected['arrays'] = ['tags'];
expected['files'] = ['info', 'logo'];


// helper function to carry out tests for one specific plugin object
function testOnePlugin(plugin) {

    /**
     * checks on the plugin structure
     **/

    it ('does not contain reserved fields', function() {
        var present = expected['reserved'].filter(function(x) {
            return typeof(plugin[x]) !== 'undefined';
        })
        assert.deepEqual(present, []);
    })

    it ('defines required functions', function() {
        var missing = expected['functions'].filter(function(x) {
            return typeof(plugin[x]) !== 'function';
        });
        assert.deepEqual(missing, [])
    })

    it ('defines all required fields', function() {
        var strings = expected['strings'].concat(expected['titles']);
        var missing_strings = strings.filter(function(x) {
            return typeof(plugin[x]) !== 'string';
        });
        assert.deepEqual(missing_strings, [], 'missing strings');
        var missing_arrays = expected['arrays'].filter(function(x) {
            return  !(typeof(plugin[x]) === 'object' && plugin[x] instanceof Array)
        });
        assert.deepEqual(missing_arrays, [], 'missing arrays');
    });

    it ('does not use special characters in strings or unclean html', function() {
        var invalid = expected['strings'].filter(function(x) {
            return (strchecker.badChars(plugin[x])).length>0
        })
        assert.deepEqual(invalid, []);
        var unclean = expected['titles'].filter(function(x) {
            return !strchecker.isCleanStrict(plugin[x])
        })
        assert.deepEqual(unclean, [], 'unclean html')
    });

    it('provides static files for logo and info', function() {
        var dirpath = path.dirname(plugin._filepath)
        var missing = expected['files'].filter(function(x) {
            if (plugin[x]===null) return false;
            return !fs.existsSync(dirpath+path.sep+plugin[x])
        })
        assert.deepEqual(missing, [])
    });

    // TO DO check contents of info page
    it('has clean html in info page', function() {
        var infopath = plugin.info;
        var dirname = path.dirname(plugin._filepath);
        var info = fs.readFileSync(dirname+path.sep+infopath).toString();
        assert.equal(strchecker.isClean(info), true)
    })

    /**
     * checks on the plugin functions
     **/

    it('produces a number during claim', function () {
        var result = plugin.claim('abc')
        assert.equal(typeof(result), 'number',
            'claim(query) produced ' + JSON.stringify(result));
    });

    it('does not claim empty queries', function () {
        var result = plugin.claim('')
        assert.equal(result, 0,
            'claim("") produced ' + JSON.stringify(result));
    });

    it ('produces reliable urls', function() {
        var url = plugin.url('').substr(0, 4);
        var external = plugin.external('').substr(0, 4);
        assert.equal(url, 'http', 'query url')
        assert.equal(external, 'http', 'external url')
    })


    /**
     * plugin-specific tests (defined next to plugin source file)
     **/

    var plugindir = path.dirname(plugin._filepath) + path.sep;
    var testfile = plugindir + 'test-'+plugin.id+'.js';
    if (fs.pathExistsSync(testfile)) {
        require(testfile)
    }

    /**
     * determine if all the tests passed,
     * record plugin as safe to use (write to a file in the library directory)
     **/

    after(function () {
        var allpass = this.test.parent.tests.every((t)=> t.state==='passed');
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

