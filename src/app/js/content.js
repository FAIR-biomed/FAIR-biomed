/**
 * Handling of FAIR-biomed components on user web pages
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */

'use strict';


// load a few icons into an icon cache
var iconcache = {};
['fa star', 'fa star-filled', 'fa search', 'fa arrow-left-solid'].forEach(function(x) {
    chrome.runtime.sendMessage({action: 'icon', path: x}, function(response) {
        iconcache[x] = response.data
    })
});


/**
 * Display an icon or a logo
 *
 * requires props:
 *  - type: logo or icon
 *  - path: string with path to file
 *
 */
class FAIRIconLogo extends React.Component {
    constructor(props) {
        super(props);
        this.getFromCache = this.getFromCache.bind(this);
        this.state = { data: null};
    }

    /** check if an icon/logo is present in cache **/
    getFromCache(path) {
        var cached = iconcache[this.props.path];
        if (!is.undefined(cached)) return cached;
        return(null);
    }

    /**
     * Fetch asynchronous logo or icon content
     */
    componentDidMount() {
        // check if present in cache
        var cached = this.getFromCache(this.props.path)
        if (cached===null) {
            if (this.state.data !== cached) {
                this.setState({data: cached})
                return;
            }
            // fetch anew
            var thislist = this;
            var msg = {action: this.props.type, path: this.props.path}
            chrome.runtime.sendMessage(msg, function (response) {
                thislist.setState({data: response.data});
            });
        }
    }

    render() {
        var cached = this.getFromCache(this.props.path);
        if (this.state.data===null && cached===null) {
            return(null)
        }
        var showdata = (cached!==null) ? cached : this.state.data;
        var cursorClass = ' fair-pointer'
        if (this.props.onClick===null || is.undefined(this.props.onClick)) {
            cursorClass = ''
        }
        return(<span className={'fair-'+this.props.type+cursorClass}
                     dangerouslySetInnerHTML={{__html: showdata}}
                     onClick={this.props.onClick}></span>);
    }
}


/**
 * Display a table with header and body
 */
class FAIROutputTable extends React.Component {
    render() {
        var data = this.props.data.slice(0);
        if (data.length==0) {
            return (<table></table>);
        }
        // construct a header from first element in data
        var header = data.shift();
        if (!is.undefined(header) && header.length !== 0) {
            var headeritems = header.map(function (x, i) {
                var thkey = 'header-'+i;
                return (<th key={thkey}>{x}</th>);
            })
            header = (<tr>{headeritems}</tr>)
        } else if (is.null(header[0])) {
            header = (null);
        }
        // construct a body from remaining elements
        var body = (<tr></tr>);
        if (data.length>0) {
            body = data.map(function(dataline, i) {
                var bodyline = dataline.map(function(x, j) {
                    var tdkey = 'body-'+i+'-'+j;
                    return (<td key={tdkey} dangerouslySetInnerHTML={{__html: x}}></td>)
                });
                return (<tr mylab={'body-'+i} key={'body-'+i}>{bodyline}</tr>)
            });
        }
        return(<table><thead>{header}</thead><tbody>{body}</tbody></table>)
    }
}


/** Display <ul> with several items **/
class FAIROutputList extends React.Component {
    render() {
        var content = this.props.data.map(function(x, i) {
            return (<li key={"list-"+i} dangerouslySetInnerHTML={{__html: x}} />)
        });
        return(<ul>{content}</ul>)
    }
}


/** Display a title-body combination **/
class FAIROutputSection extends React.Component {
    render() {
        var title = '';
        if (is.string(this.props.title)) {
            title = (<h1>{this.props.title}</h1>)
        }
        var content = '[unrecognized type of output]';
        var data = this.props.data;
        if (is.string(data)) {
            content = (<div dangerouslySetInnerHTML={{__html: this.props.data}}></div>)
        } else if (is.array(data)) {
            if (is.array2(data)) {
                content = (<FAIROutputTable data={this.props.data}/>)
            } else if (is.array1(data)) {
                content = (<FAIROutputList data={this.props.data}/>)
            }
        }
        return (<div className='fair-subsection'>{title}{content}</div>)
    }
}


/** Display a <pre> element **/
class FAIROutputCode extends React.Component {
    render() {
        return (<pre dangerouslySetInnerHTML={{__html: this.props.data}}></pre>)
    }
}


/** Toolbar to goggle between results, info, api-code, external link **/
class FAIROutputToolbar extends React.Component {
    render() {
        // determine what icon set to display
        var toolbar_icons = ['data', 'info', 'code', 'external']
        var handlers = this.props.handlers;
        var icons = this.props.icons;
        var state = this.props.state;
        var toolbar_icons = _.map(toolbar_icons, function(value, key) {
            var thishandler = handlers[value];
            var thisicon = icons[value];
            var addClass = '';
            if (value===state) {
                addClass = 'fair-toolbar-selection'
            }
            return(
                <div key={key+ thisicon} className={'fair-col-3 fair-text-center '+addClass}>
                    <FAIRIconLogo type='icon' path={'fa '+thisicon}
                                  onClick={thishandler}/>
                </div>
            )
        });
        return(<div className='fair-row fair-result-toolbar'>{toolbar_icons}</div>)
    }
}


/** Display the output of a plugin, and a toolbar to toggle between views **/
class FAIROutput extends React.Component {
    constructor(props) {
        super(props);
        /**
         * @type {{
         *  type: string code used to toggle between views,
         *  info: string with a synopsis of the plugin,
         *  data: object with output from plugin processing,
         *  external: string (url for external link)
         *  }}
         */
        this.state = {type: 'init', info: null, data: null, external: null}
        this.showInfo = this.showInfo.bind(this);
        this.showCode = this.showCode.bind(this);
        this.showResult = this.showResult.bind(this);
        this.showExternal = this.showExternal.bind(this);
        // some class specific items
        this._handlers = {
            'back': this.props.onBack,
            'info': this.showInfo,
            'code': this.showCode,
            'data': this.showResult,
            'external': this.showExternal
        };
        this._icons = {
            'back': 'undo-alt-solid',
            'info': 'info',
            'code': 'code',
            'data': 'table-solid',
            'external': 'external-link-alt'
        }
    }

    /** Upon generation of plugin-specific component, fetch plugin-based data **/
    componentDidMount() {
        var thislist = this;
        var msg = {action: 'run', id: this.props.id, query: this.props.query}
        chrome.runtime.sendMessage(msg, function(response) {
            // when the query time out, the response might be null or undefined
            if (is.undefined(response)) {
                response = { status: 0, data: "no response"}
            }
            if (response.status===1) {
                thislist.setState({
                    type: 'data',
                    data: response.data,
                    external: response.external,
                    code: response.url
                })
            } else {
                thislist.setState({
                    type: 'data',
                    data: response.data
                })
            }
        });
    }

    /** Fetch and trigger display of plugin info page **/
    showInfo() {
        var thislist = this;
        var msg = {action: 'info', id: this.props.id};
        chrome.runtime.sendMessage(msg, function(response) {
            thislist.setState({type:'info', info: response.data});
        });
    }

    /** Fetch and trigger display of query results page **/
    showResult() {
        this.setState({type: 'data'});
    }

    /** Fetch and trigger display of code display page **/
    showCode() {
        this.setState({type: 'code'})
    }

    /** Trigger display of an external link **/
    showExternal() {
        var ext = this.state.external;
        if (!is.null(ext) && !is.undefined(ext)) {
            window.open(ext, '_blank')
        }
    }

    render() {
        if (this.state.type==='init') {
            return(<div>Please wait...</div>);
        }
        // either output a single text object, or partition into sections
        var content = [];
        if (this.state.type=='data') {
            if (is.string(this.state.data)) {
                content = [<FAIROutputSection key='section' data={this.state.data}/>]
            } else if (is.array(this.state.data)) {
                content = this.state.data.map(function(value, key) {
                    return (<FAIROutputSection key={'section'+key} data={value}/>)
                });
            } else {
                // treat the content as an object
                content = _.map(this.state.data, function (value, key) {
                    return (<FAIROutputSection key={key} title={key} data={value}/>)
                })
            }
        } else if (this.state.type==='info') {
            content = [<FAIROutputSection key='text-info' data={this.state.info}/>]
        } else if (this.state.type==='code') {
            content = [<FAIROutputCode key='text-code' data={this.state.code}/>]
        }

        return (
            <div className='fair-fill-v'>
                <div className='fair-row fair-result'>
                    <div className='fair-section fair-col-12'>
                        {content}
                    </div>
                </div>
                <div style={{clear: 'both'}}></div>
                <FAIROutputToolbar state={this.state.type}
                                   handlers={this._handlers}
                                   icons={this._icons} />
            </div>
        );
    }
}


/** Display an area with one candidate ad on top and output below **/
class FAIRCandidateSelection extends React.Component {
    render() {
        return (
            <div className='fair-fill-v'>
                <FAIRCandidate id={this.props.id}
                               titles={this.props.titles}
                               rating={this.props.rating}
                               selectPlugin={null} />
                <FAIROutput className='fair-output'
                            id={this.props.id}
                            titles={this.props.titles}
                            rating={this.props.rating}
                            query={this.props.query}
                            onBack={this.props.onBack} />
            </div>
        );
    }
}


/**
 * Display one candidate plugin to click on.
 */
class FAIRCandidate extends React.Component {
    constructor(props) {
        super(props);
        this.processRequest = this.processRequest.bind(this);
        this.processRating = this.processRating.bind(this);
        var rating = this.props.rating;
        if (is.undefined(rating) || rating===null) {
            rating = 0
        }
        this.state = {rating: rating};
    }

    processRequest() {
        if (this.props.selectPlugin!==null) {
            this.props.selectPlugin(this.props.id);
        }
    }

    processRating() {
        var newrating = (this.state.rating+1)%2
        var msg = {action: 'rate', id: this.props.id, rating: newrating};
        chrome.runtime.sendMessage(msg, function(response) {
            // no need to process any response
        });
        this.setState({rating: newrating});
    }

    render() {
        var ratingpath = 'fa star';
        if (this.state.rating>0) {
            ratingpath = 'fa star-filled'
        }
        return(
            <li className='fair-candidate' >
                <div className='fair-row'>
                    <div className='fair-col-2 fair-logo-col fair-center-center'
                         onClick={this.processRequest}>
                        <FAIRIconLogo type='logo' path={this.props.id}/>
                    </div>
                    <div className='fair-col-9 fair-center-center'
                         onClick={this.processRequest}>
                        <div className='fair-container fair-fullwidth'>
                            <h3>{this.props.titles[0]}</h3>
                            <h4>{this.props.titles[1]}</h4>
                        </div>
                    </div>
                    <div className='fair-col-1 fair-center-center fair-rating'>
                        <FAIRIconLogo type='icon' key={this.props.id+this.state.rating}
                                      path={ratingpath} onClick={this.processRating}/>
                    </div>
                </div>
            </li>
        )
    }
}


/** Display <ul> element with multiple FAIRCandidate elements
 *
 * required props
 *
 *  - candidates, array of candidates
 *  - selectPlugin, function to act on a user selection
 *
 * **/
class FAIRCandidateList extends React.Component {
    render() {
        var thislist = this;
        var candidates = this.props.candidates.map(function (x) {
            var id = x['id'];
            return (
                <FAIRCandidate key={id} id={id}
                               titles={[x['title'], x['subtitle']]}
                               rating={x['rating']}
                               selectPlugin={thislist.props.selectPlugin}/>
            );
        });
        return (<ul className='fair-list fair-candidate-list'>{candidates}</ul>);
    }
}


/** Display a list of plugins that claimed the query, or plugin output **/
class FAIRClaimResult extends React.Component {
    constructor(props) {
        super(props);
        this.showList = this.showList.bind(this);
        this.selectPlugin = this.selectPlugin.bind(this);
        this.claimQuery = this.claimQuery.bind(this);
        /* state.candidates will hold an array of plugins that claim the query
         * state.type will be either 'list' or 'plugin' to toggle views
         * state.selection will hold the selected plugin id
         */
        this.state = {candidates: [], type: 'list', selection: null};
    }

    /* comparator for candiates, uses claim score **/
    compareCandidates(a, b) {
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
    }

    /** look up plugins that claim a query string **/
    claimQuery() {
        var thislist = this;
        var msg = {action: 'claim', query: this.props.query};
        chrome.runtime.sendMessage(msg, function(response) {
            var candidates = response.sort(thislist.compareCandidates);
            thislist.setState({candidates: candidates});
        });
    }

    /** on load, ask plugins to claim the query **/
    componentDidMount() {
        this.claimQuery();
    }

    /** force an update to the plugin cancidates when the query changes **/
    componentDidUpdate(prevProps) {
        if (this.props.query!=prevProps.query) {
            this.claimQuery();
        }
    }

    /** Toggle into a plugin-speific view **/
    selectPlugin(id) {
        this.setState({type: 'plugin', selection: id});
        this.props.setNavState('selection', this.showList)
    }

    /** Toggle into a view showing query claim results **/
    showList() {
        this.setState({type: 'list', selection: null});
        this.props.setNavState('search');
    }

    render() {
        if (this.state.type==='list') {
            return (<FAIRCandidateList candidates={this.state.candidates}
                                       selectPlugin={this.selectPlugin} />)
        } else {
            var selection = this.state.selection;
            var candidate = _.find(this.state.candidates, function(x) {
                return x['id'] === selection;
            });
            // safety check (this is needed for when user changes the query
            // while already looking at a specific plugin candidate)
            if (is.undefined(candidate)) return (null)
            // render a component focusing onjust one plugin
            return(
                <FAIRCandidateSelection className='fair-output'
                            id={selection}
                            titles={[candidate['title'], candidate['subtitle']]}
                            rating={candidate['rating']}
                            query={this.props.query}
                            onBack={this.showList}
                />
            )
        }
    }
}


/**
 * Holds the header with query box, list of plugins, and results
 */
class FAIRHeaderBody extends React.Component {
    constructor(props) {
        super(props);
        this.setNavState = this.setNavState.bind(this);
        this.setQuery = this.setQuery.bind(this);
        let querystr = "";
        if (!is.null(this.props.range)) {
            querystr = this.props.range.toString();
        }
        /**
         *
         * @type {{
         * query: string, current string query for search,
         * display: string either 'search' or  'selection',
         * navclick: function called when navigation icon is clicked}}
         */
        this.state = {query: querystr, display: 'search', navClick: null}
    }

    /** Set the state of navigation, either search or selection **/
    setNavState(type, navClick) {
        if (type==='search' || type==='selection') {
            this.setState({display: type, navClick: navClick})
        }
    }

    /** transfer a value from the input box into the component state **/
    setQuery(event) {
        this.setState({query: event.target.value})
    }

    render() {
        var navicon = [];
        if (this.state.display === 'search') {
            navicon.push(<FAIRIconLogo key='nav-search'
                                       type='icon' path='fa search' />)
        } else {
            navicon.push(<FAIRIconLogo key='nav-selection'
                                       type='icon' path='fa arrow-left-solid'
                                       onClick={this.state.navClick} />)
        }
        return(
            <div className='fair-header-body'>
                <div className='fair-header'>
                    {navicon}
                    <input className='fair-query' type='text'
                           defaultValue={this.state.query}
                           onInput={this.setQuery}/>
                </div>
                <div className='fair-body'>
                    <FAIRClaimResult query={this.state.query} setNavState={this.setNavState}></FAIRClaimResult>
                </div>
            </div>
        );
    }
}

/**
 * Create a DOM element next to a range with a button.
 * This will act as an anchor in the document for a FAIR container.
 *
 * @param range
 */
function initFAIRAnchor(range) {
    // create a span element with an icon
    var anchor = document.createElement('span');
    anchor.className = 'fair-button';
    var msg = {action: 'icon', path: 'fa syringe'}
    chrome.runtime.sendMessage(msg, function(response) {
        var template = document.createElement('template');
        template.innerHTML = response.data.trim();
        var el = template.content.firstChild;
        el.setAttribute('width', '12');
        el.setAttribute('style', 'width: 12px; display: inline');
        anchor.appendChild(el);
    });
    range.collapse(false);
    range.insertNode(anchor);
    return anchor;
}


/**
 * Holds a div with control buttons and the content.
 */
class FAIRContainer extends React.Component {
    constructor(props) {
        super(props);
        this.close = this.close.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
        this.state = {anchor: null};
    }

    /** At beginning, inject an achor element and position to FAIR container **/
    componentDidMount() {
        var container = this;
        var parent = ReactDOM.findDOMNode(this);
        var anchor = null;
        var bounding = {left: 20, top: 20};
        if (!is.null(this.props.range)) {
            var bounding = this.props.range.getBoundingClientRect();
            anchor = initFAIRAnchor(this.props.range);
            anchor.className = 'fair-anchor';
            anchor.addEventListener('click', function() {
                container.toggleVisibility();
            });
        }
        var fontsize = 2*Number(getComputedStyle(document.body, '').fontSize.match(/(\d+)px/)[1]);
        var offset = { 'top': window.pageYOffset, 'left': window.pageXOffset};
        parent.style.left = (offset.left+bounding.left)+'px';
        parent.style.top = (offset.top+bounding.top+fontsize)+'px';
        // adjust the content of the inner container
        // create an anchor span in the main document
        // remember links to the parent and to the anchor
        this.setState({parent: parent, anchor: anchor});
    };

    /**
     * Delete this container entirely.
     */
    close() {
        var parent = this.state.parent.parentNode;
        parent.parentNode.removeChild(parent);
        if (this.state.anchor != null) {
            var anchor = this.state.anchor;
            anchor.parentNode.removeChild(anchor);
        }
    }

    /** Hide the container temporarily **/
    toggleVisibility() {
        if (this.state.anchor != null) {
            var current = this.state.parent.style.display;
            this.state.parent.style.display = (current==='none') ? 'block': 'none';
        } else {
            this.close();
        }
    }

    render() {
        return (
            <div className="fair-outer">
                <div className='fair-inner fair-container'>
                    <div className='fair-button-panel'>
                        <FAIRIconLogo type='icon' path='fa window-minimize-solid'
                                      onClick={this.toggleVisibility}></FAIRIconLogo>
                        <FAIRIconLogo type='icon' path='fa times-solid'
                                      onClick={this.close}></FAIRIconLogo>
                    </div>
                    <FAIRHeaderBody range={this.props.range} />
                </div>
            </div>
        )
    }
}


/**
 * Create DOM div for the popup container
 *
 * @param range
 */
function initFAIRContainer(range) {
    var container = document.createElement('div');
    container.className = 'fair-reset';
    ReactDOM.render(
        <FAIRContainer range={range}/>,
        container
    );
    document.body.appendChild(container);
}

/** trigger init of FAIRContainer. Used by key listener and context menu. **/
function triggerFAIRContainer() {
    var selection = window.getSelection();
    if (selection.toString()!=='') {
        initFAIRContainer(selection.getRangeAt(0));
    } else {
        initFAIRContainer(null);
    }
}


/**
 * Register listeners for keypresses
 */
window.addEventListener('keypress', function(e){
    // keycode 26 -> Z
    if (e.shiftKey && e.ctrlKey && e.keyCode === 26) {
        triggerFAIRContainer();
    }
}, false);

/**
 * Register listeners catching de-novo messages from background.js
 */
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (!sender.tab && request.action === "contextMenuClick") {
            triggerFAIRContainer();
        }
        // this send is required to avoid a runtime error
        sendResponse({});
    });
