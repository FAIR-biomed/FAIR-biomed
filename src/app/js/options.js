/**
 * Handling of FAIR-biomed components on extension options page.
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */


var icons = {};


/** fetch an icon content, either from a cache or from disk **/
function getIcon(iconpath) {
    let ipath = iconpath.split(" ").join("/");
    // look up icon in cache first
    if (typeof(icons[ipath])!=="undefined") {
        return icons[ipath];
    }
    // if not in cache, load into cache
    let promise = new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            icons[ipath] = xhr.response;
            resolve(icons[ipath]);
        };
        xhr.ontimeout = function() {
            reject("timeout");
        };
        xhr.open("GET","/resources/"+ipath+".svg");
        xhr.send();
    });
    promise.then();
    return icons[ipath]
}
['fa star', 'fa star-filled'].forEach(function(x) {
    getIcon(x);
});


/**
 * Display a label/badge
 */
class PluginTag extends React.Component {
    render() {
        return (<span className="fair-badge">{this.props.tag}</span>);
    }
}


/** Dislay a logo img if available, or a placeholder **/
class PluginLogo extends React.Component {
    constructor(props) {
        super(props);
        let src = "_logo_na.png";
        if (this.props.src!==null) {
            src = this.props.namespace+"."+this.props.src
        }
        this.state = {src: src};
    }
    render() {
        return (<img className="fair-logo" src={"/library/logo/"+this.state.src}></img>)
    }
}


/** Display a div with the info about a plugin **/
class PluginInfo extends React.Component {
    componentDidMount() {
        let infofile = this.props.namespace+'.'+ this.props.info;
        let thislist = this;
        let promise = new Promise(function(resolve, reject) {
            let xhr=new XMLHttpRequest();
            xhr.onload=function(){
                thislist.setState({info: xhr.response});
                resolve(xhr.response);
            };
            xhr.ontimeout=function() {
                reject("timeout");
            };
            xhr.open("GET","/library/info/"+infofile);
            xhr.send();
        });
        promise.then();
    };

    render() {
        if (!this.props.visible) {
            return (null)
        }
        return(<div className="fair-container fair-fullwidth fair-info fair-info-detail"
                    dangerouslySetInnerHTML={{__html: this.state.info }}></div>)
    }
}


/** Display a toggle switch and star-status **/
class PluginState extends React.Component {
    constructor(props) {
        super(props);
        this.handleActivation = this.handleActivation.bind(this);
        this.handleRating = this.handleRating.bind(this);
        this.state = {active: this.props.active, rating: this.props.rating};
    }

    handleActivation(event) {
        // set the react state
        this.setState(prevState => ({ active: !prevState.active}));
        // set the extension state on disk
        let newstate = {};
        newstate["plugin:"+this.props.id] = [!this.state.active, this.state.rating];
        chrome.storage.sync.set(newstate);
    }

    handleRating(event) {
        // set the react state
        this.setState(prevState => ({ rating: (prevState.rating+1)%2}));
        // set the extension state on disk
        let rating = {};
        rating["plugin:"+this.props.id] = [this.state.active, (this.state.rating+1)%2];
        chrome.storage.sync.set(rating);
    }

    render() {
        if (this.state.rating>0) {
            var starsvg = getIcon("fa star-filled")
        } else {
            var starsvg = getIcon("fa star")
        }
        return(
            <div>
                <span className={"switch"}>
                    <input type="checkbox" value={this.state.active} checked={this.state.active}
                           onChange={this.handleActivation}/>
                    <span className="slider round"></span>
                </span>
                <span className="fair-rating"
                      dangerouslySetInnerHTML={{__html: starsvg}}
                      onClick={this.handleRating}></span>
            </div>
        )
    }
}

/**
 * A horizontal strip displaying information on one library plugin
 */
class LibraryItem extends React.Component {
    constructor(props) {
        super(props);
        this.handleInfo = this.handleInfo.bind(this);
        this.state = { info: false};
    }

    /** Toggles a info visibility tag **/
    handleInfo() {
        this.setState({info: !this.state.info })
    }

    render() {
        let plugin = this.props.plugin;
        let tags = plugin.tags.map(function(x) {
            return <PluginTag key={x} tag={x} />;
        });
        return (
            <li className="fair-center-v">
                <div className="fair-row">
                    <div className="fair-col-2 fair-center-center">
                        <PluginLogo id={plugin.id} src={plugin.logo} namespace={plugin.namespace}/>
                    </div>
                    <div className="fair-col-8 fair-info">
                        <div className="fair-center-v fair-click" onClick={this.handleInfo}>
                            <div className="fair-container fair-fullwidth">
                                <h3>{plugin.title}</h3>
                                <h4>{plugin.subtitle}</h4>
                                <p>{tags}</p>
                            </div>
                        </div>
                    </div>
                    <div className="fair-col-2 fair-center-center">
                        <PluginState id={plugin.id} active={this.props.active} rating={this.props.rating}/>
                    </div>
                </div>
                <div className="fair-row fair-info">
                    <div className="fair-col-2"></div>
                    <div className="fair-col-8 fair-info">
                        <PluginInfo namespace={plugin.namespace} info={plugin.info} visible={this.state.info}/>
                    </div>
                </div>
            </li>
        )
    }
}


/**
 * A list showing all available plugins, with options to turn on/off
 */
class LibraryList extends React.Component {
    constructor(props) {
        super(props);
        getIcon("fa star-filled");
        getIcon("fa star");
        // store a set of ids for which the active state is known
        this.state = {ids: []};
    }

    /**
     * upon first mounting the list, look up whether each plugin has been activated
     */
    componentDidMount() {
        let thislist = this;

        // helper to force x into a proper value
        let fromDataOrDefault = function(data, key, idx, def) {
            if (JSON.stringify(data)==="{}") return def;
            if (idx >= data[key].length) return def;
            return data[key][idx];
        };

        this.props.names.map(function(x) {
            let key = "plugin:"+x;
            chrome.storage.sync.get(key, function(data) {
                let active = fromDataOrDefault(data, key, 0, true);
                let rating = fromDataOrDefault(data, key, 1, 0);
                let count = fromDataOrDefault(data, key, 2, 10);
                thislist.setState(prevState =>
                    ({ ids: [...thislist.state.ids, [x, active, rating, count]]}))
            })
        });
    };

    /** re-render when all activation states have been collected **/
    shouldComponentUpdate(nextProps, nextState) {
        return (nextState.ids.length == this.props.names.length);
    }

    render() {
        var plugins = this.props.plugins;
        //console.log("state ids: "+JSON.stringify(this.state.ids));
        var items = this.state.ids.map(function(x) {
            var id= x[0];
            return <LibraryItem key={id} plugin={plugins[id]} active={x[1]} rating={x[2]}/>;
        });
        return (<ul className="fair-list">{ items }</ul>);
    }
}

// create the plugin details when the page loads
document.addEventListener("DOMContentLoaded", function () {
    // the setTimeout is annoying, but without it one of the icons doesn't load in time for display?
    setTimeout(() => {
        ReactDOM.render(
                <LibraryList names={library['names']} plugins={library['plugins']} className="container"/>,
                document.getElementById('fair-library')
            );
    }, 0);
});
