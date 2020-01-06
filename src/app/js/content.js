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
    getFromCache() {
        let cached = iconcache[this.props.path];
        if (!is.undefined(cached)) return cached;
        return(null);
    }

    /**
     * Fetch asynchronous logo or icon content
     */
    componentDidMount() {
        // use a cached version, or fetch anew,
        let cached = this.getFromCache();
        if (cached===null) {
            if (this.state.data !== cached) {
                this.setState({data: cached});
                return;
            }
            let thislist = this;
            let msg = {action: this.props.type, path: this.props.path};
            chrome.runtime.sendMessage(msg, function (response) {
                thislist.setState({data: response.data});
            });
        }
    }

    render() {
        let cached = this.getFromCache();
        if (this.state.data===null && cached===null) {
            return(null)
        }
        let showdata = (cached!==null) ? cached : this.state.data;
        let cursorClass = ' fair-pointer';
        if (this.props.onClick===null || is.undefined(this.props.onClick)) {
            cursorClass = ''
        }
        return(<span className={'fair-'+this.props.type+cursorClass}
                     dangerouslySetInnerHTML={{__html: showdata}}
                     onClick={this.props.onClick}></span>);
    }
}


/** Display a table with header and body */
class FAIROutputTable extends React.Component {
    render() {
        let data = this.props.data.slice(0);
        if (data.length===0) {
            return (<table></table>);
        }
        // construct a header from first element in data
        let header = data.shift();
        if (!is.undefined(header) && header.length !== 0) {
            let headeritems = header.map(function (x, i) {
                let thkey = 'header-'+i;
                return (<th key={thkey}>{x}</th>);
            });
            header = (<tr>{headeritems}</tr>)
        } else if (is.null(header[0])) {
            header = (null);
        }
        // construct a body from remaining elements
        let body = (<tr></tr>);
        if (data.length>0) {
            body = data.map(function(dataline, i) {
                let bodyline = dataline.map(function(x, j) {
                    let tdkey = 'body-'+i+'-'+j;
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
        let content = this.props.data.map(function(x, i) {
            return (<li key={"list-"+i} dangerouslySetInnerHTML={{__html: x}} />)
        });
        return(<ul>{content}</ul>)
    }
}


/** Display a title-body combination **/
class FAIROutputSection extends React.Component {
    render() {
        let title = '';
        if (is.string(this.props.title)) {
            title = (<h1>{this.props.title}</h1>)
        }
        let content = '[unrecognized type of output]';
        let data = this.props.data;
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
        return (<pre onMouseDown={e => e.stopPropagation()}
                     dangerouslySetInnerHTML={{__html: this.props.data}}></pre>)
    }
}


/** Toolbar (bottom) with results, info, api-code, external link **/
class FAIROutputToolbar extends React.Component {
    render() {
        let handlers = this.props.handlers;
        let icons = this.props.icons;
        let state = this.props.state;
        // determine what icon set to display
        let toolbar_icons = ['data', 'info', 'code', 'external'];
        toolbar_icons = toolbar_icons.map(function(value, key) {
                let thishandler = handlers[value];
                let thisicon = icons[value];
                let addClass = '';
                if (value === state) {
                    addClass = 'fair-toolbar-selection'
                }
                return(
                    <div key={key+ thisicon} className={'fair-col-3 fair-result-toolbar-button '+addClass}>
                        <FAIRIconLogo type='icon' path={'fa '+thisicon}
                                      onClick={thishandler}/>
                    </div>
                )
            });
        //
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
        this.state = {type: 'init', info: null, data: null, external: null};
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
        let thislist = this;
        let msg = {action: 'run', id: this.props.id, query: this.props.query};
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
        let thislist = this;
        let msg = {action: 'info', id: this.props.id};
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
        let ext = this.state.external;
        if (!is.null(ext) && !is.undefined(ext)) {
            window.open(ext, '_blank')
        }
    }

    render() {
        let type = this.state.type;
        if (type === 'init') {
            return(<div>Please wait...</div>);
        }
        // either output a single text object, or partition into sections
        let content = [];
        if (type === 'data') {
            let data = this.state.data;
            if (is.string(data)) {
                content = [<FAIROutputSection key='section' data={data}/>]
            } else if (is.array(data)) {
                content = data.map(function(value, key) {
                    return (<FAIROutputSection key={'section'+key} data={value}/>)
                });
            } else {
                content = Object.keys(data).map(function(value, key) {
                    return (<FAIROutputSection key={key} title={value} data={data[value]}/>)
                });
            }
        } else if (type === 'info') {
            content = [<FAIROutputSection key='text-info' data={this.state.info}/>]
        } else if (type === 'code') {
            content = [<FAIROutputCode key='text-code' data={this.state.code}/>]
        }
        let result_height = (this.props.parentSize[1]-164)+'px';
        return (
            <div className='fair-fill-v'>
                <div className='fair-row fair-result' style={{height: result_height}}>
                    <div className='fair-section fair-col-12'>
                        {content}
                    </div>
                </div>
                <FAIROutputToolbar state={type}
                                   handlers={this._handlers}
                                   icons={this._icons} />
            </div>
        );
    }
}


/** Display an area with a candidate header on top and output below **/
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
                            onBack={this.props.onBack}
                            parentSize={this.props.parentSize}/>
            </div>
        );
    }
}


/** Display one candidate plugin to click on */
class FAIRCandidate extends React.Component {
    constructor(props) {
        super(props);
        this.processRequest = this.processRequest.bind(this);
        this.processRating = this.processRating.bind(this);
        let rating = this.props.rating;
        if (is.undefined(rating) || rating===null) {
            rating = 0
        }
        this.state = {rating: rating};
    }

    processRequest() {
        let msg = {action: 'update_count', id: this.props.id};
        chrome.runtime.sendMessage(msg);
        if (this.props.selectPlugin!==null) {
            this.props.selectPlugin(this.props.id);
        }
    }

    processRating() {
        let newrating = (this.state.rating+1)%2;
        let msg = {action: 'rate', id: this.props.id, rating: newrating};
        chrome.runtime.sendMessage(msg, function(response) {
            // no need to process any response
        });
        this.setState({rating: newrating});
    }

    render() {
        let ratingpath = 'fa star';
        if (this.state.rating > 0) {
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
        let thislist = this;
        let candidates = this.props.candidates.map(function (x) {
            let id = x['id'];
            return (
                <FAIRCandidate key={id} id={id}
                               titles={[x['title'], x['subtitle']]}
                               rating={x['rating']}
                               selectPlugin={thislist.props.selectPlugin}/>
            );
        });
        let ul_height = (this.props.parentSize[1]-48)+'px';
        return (<ul className='fair-list fair-candidate-list' style={{height: ul_height}}>{candidates}</ul>);
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
        let thislist = this;
        let msg = {action: 'claim', query: this.props.query};
        chrome.runtime.sendMessage(msg, function(response) {
            let candidates = response.hits.sort(thislist.compareCandidates);
            thislist.setState({candidates: candidates});
            if (response.preferred !== null) {
                thislist.selectPlugin(response.preferred);
            }
        });
    }

    /** on load, ask plugins to claim the query **/
    componentDidMount() {
        this.claimQuery();
    }

    /** force an update to the plugin cancidates when the query changes **/
    componentDidUpdate(prevProps) {
        if (this.props.query !== prevProps.query) {
            this.claimQuery();
        }
    }

    /** Toggle into a plugin-specific view **/
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
        if (this.state.type === 'list') {
            return (<FAIRCandidateList candidates={this.state.candidates}
                                       selectPlugin={this.selectPlugin}
                                       parentSize={this.props.parentSize}/>)
        } else {
            let selection = this.state.selection;
            let candidate = (this.state.candidates).filter((x) => x['id'] === selection)[0];
            // safety check (this is needed for when user changes the query
            // while already looking at a specific plugin candidate)
            if (is.undefined(candidate)) return (null);
            return(
                <FAIRCandidateSelection className='fair-output'
                            id={selection}
                            titles={[candidate['title'], candidate['subtitle']]}
                            rating={candidate['rating']}
                            query={this.props.query}
                            onBack={this.showList}
                            parentSize={this.props.parentSize}
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
            querystr = (querystr.trim()).replace(/\s+/g, ' ');
        }
        /* query: string, current string query for search,
         * display: string either 'search' or  'selection',
         * navclick: function called when navigation icon is clicked
         */
        this.state = {query: querystr, display: 'search', navClick: null}
    }

    /** Set the state of navigation, either search or selection **/
    setNavState(type, navClick) {
        if (type === 'search' || type === 'selection') {
            this.setState({display: type, navClick: navClick})
        }
    }

    /** transfer a value from the input box into the component state **/
    setQuery(event) {
        this.setState({query: event.target.value})
    }

    render() {
        let navicon = [];
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
                           onMouseDown={e => e.stopPropagation()}
                           defaultValue={this.state.query}
                           onInput={this.setQuery}/>
                </div>
                <div className='fair-body'>
                    <FAIRClaimResult query={this.state.query} setNavState={this.setNavState}
                                     parentSize={this.props.parentSize}>
                    </FAIRClaimResult>
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
    let anchor = document.createElement('span');
    anchor.className = 'fair-button';
    let msg = {action: 'icon', path: 'fa syringe'}
    chrome.runtime.sendMessage(msg, function(response) {
        let template = document.createElement('template');
        template.innerHTML = response.data.trim();
        let el = template.content.firstChild;
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
        this.startMouseDown = this.startMouseDown.bind(this);
        this.startMove = this.startMove.bind(this);
        this.endMouseDown = this.endMouseDown.bind(this);
        this.duringMove = this.duringMove.bind(this);
        this.duringResize = this.duringResize.bind(this);
        this.state = {anchor: null, size: [480, 520]};
    }

    /** At beginning, inject an anchor element and position to FAIR container **/
    componentDidMount() {
        let container = this;
        let parent = ReactDOM.findDOMNode(this);
        let anchor = null;
        // collect information about the anchor point and the browser window
        let bounding = {left: 20, top: 20};
        let viewport = {width: window.innerWidth, height: window.innerHeight};
        if (!is.null(this.props.range)) {
            bounding = this.props.range.getBoundingClientRect();
            anchor = initFAIRAnchor(this.props.range);
            anchor.className = 'fair-anchor';
            anchor.addEventListener('click', function() {
                container.toggleVisibility();
            });
        }
        let fontsize = 2*Number(getComputedStyle(document.body, '').fontSize.match(/(\d+)px/)[1]);
        let offset = { 'top': window.pageYOffset, 'left': window.pageXOffset};
        // determine position of the popup
        let parent_pos = [offset.left+bounding.left, offset.top+bounding.top+fontsize];
        if (bounding.top > viewport.height/2 && bounding.top > (this.state.size[1] + fontsize)/2) {
            parent_pos[1] -= (this.state.size[1] + 2*fontsize)/2;
            parent_pos[0] += bounding.width + fontsize;
        }
        if (bounding.left > viewport.width/2 && bounding.left + this.state.size[0] > viewport.width) {
            parent_pos[0] = bounding.left - this.state.size[0] - fontsize
        }
        parent.style.left = parent_pos[0] + 'px';
        parent.style.top = parent_pos[1] + 'px';
        // remember links to the parent and to the anchor
        this.setState({parent: parent, anchor: anchor});
    };

    /** Delete this container entirely. */
    close() {
        let parent = this.state.parent.parentNode;
        parent.parentNode.removeChild(parent);
        if (this.state.anchor != null) {
            let anchor = this.state.anchor;
            anchor.parentNode.removeChild(anchor);
        }
    }

    /** Hide the container temporarily **/
    toggleVisibility() {
        if (this.state.anchor != null) {
            let current = this.state.parent.style.display;
            this.state.parent.style.display = (current==='none') ? 'block': 'none';
        } else {
            this.close();
        }
    }

    /** Handlers for moving the container around **/
    startMouseDown(e) {
        // avoid processing right-clicks
        if (e.nativeEvent.which === 3) return;
        let parent = this.state.parent;
        let parent_style = getComputedStyle(parent);
        let parent_rect = parent.getBoundingClientRect();
        let x = e.nativeEvent.clientX - parent_rect.left;
        let y = e.nativeEvent.clientY - parent_rect.top;
        if (x >= parseInt(parent_style.width) - 24 && y >= parseInt(parent_style.height) - 24) {
            this.startResize(e);
        } else {
            this.startMove(e);
        }
    }
    startMove(e) {
        let parent = this.state.parent;
        parent.style.cursor = "move";
        let parent_pos = [parseInt(parent.style.left), parseInt(parent.style.top)];
        // in startMove and endMove, e is an object provided by React, so use nativeEvent
        let move_start = [e.nativeEvent.x, e.nativeEvent.y];
        // remember position of container and mouse pointer at the begining of the move
        this.setState({move_start: move_start, parent_pos: parent_pos});
        document.addEventListener("mousemove", this.duringMove, false);
    }
    startResize(e) {
        let parent = this.state.parent;
        let parent_style = getComputedStyle(parent);
        let parent_size = [parseInt(parent_style.width), parseInt(parent_style.height)];
        parent.style.cursor = "nwse-resize";
        let mouse_start = [e.nativeEvent.x, e.nativeEvent.y];
        this.setState({move_start: mouse_start, parent_size: parent_size});
        document.addEventListener("mousemove", this.duringResize, false);
    }
    endMouseDown() {
        // clean up state (not required, just clean)
        this.setState({parent_pos: null, mouse_start: null, parent_size: null});
        this.state.parent.style.cursor = "auto";
        document.removeEventListener("mousemove", this.duringMove, false);
        document.removeEventListener("mousemove", this.duringResize, false);
    }
    duringMove(e) {
        let parent = this.state.parent;
        let parent_pos = this.state.parent_pos;
        let move_start = this.state.move_start;
        parent.style.left = (parent_pos[0] + e.x - move_start[0]) + 'px';
        parent.style.top = (parent_pos[1] + e.y - move_start[1]) + 'px';
    }
    duringResize(e) {
        let parent = this.state.parent;
        let parent_size = this.state.parent_size;
        let move_start = this.state.move_start;
        let new_size = [parent_size[0] + e.x - move_start[0],
                        parent_size[1] + e.y - move_start[1]];
        parent.style.width = new_size[0] + 'px';
        parent.style.height = new_size[1] + 'px';
        this.setState({size: new_size});
    }

    render() {
        return (
            <div className="fair-outer" onMouseDown={this.startMouseDown} onMouseUp={this.endMouseDown}>
                <div className='fair-inner fair-container'>
                    <div className='fair-button-panel'>
                        <FAIRIconLogo type='icon' path='fa window-minimize-solid'
                                      onClick={this.toggleVisibility}></FAIRIconLogo>
                        <FAIRIconLogo type='icon' path='fa times-solid'
                                      onClick={this.close}></FAIRIconLogo>
                    </div>
                    <FAIRHeaderBody range={this.props.range} parentSize={this.state.size}/>
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
    let container = document.createElement('div');
    container.className = 'fair-reset';
    ReactDOM.render(
        <FAIRContainer range={range}/>,
        container
    );
    document.body.appendChild(container);
}


/** trigger init of FAIRContainer. Used by key listener and context menu. **/
function triggerFAIRContainer() {
    let selection = window.getSelection();
    if (selection.toString()!=='') {
        initFAIRContainer(selection.getRangeAt(0));
    } else {
        initFAIRContainer(null);
    }
}


/**
 * Register listeners for keypresses
 */
window.addEventListener('keydown', function(e){
    // keycode 90 means 'Z' (with a shift)
    if (e.shiftKey && e.ctrlKey && e.keyCode === 90) {
        triggerFAIRContainer();
    }
}, false);


/**
 * Register listeners catching de-novo messages from background.js
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!sender.tab && request.action === "contextMenuClick") {
        triggerFAIRContainer();
    }
    // this send is required to avoid a runtime error
    sendResponse({});
});
