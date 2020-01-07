/**
 * Handling of FAIR-biomed components on extension options page.
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */


// cache for storing plugin icons
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


/** An on/off switch **/
class SliderSwitch extends React.Component {
    render() {
        return(<span className={"switch"}>
                    <input type="checkbox" value={this.props.value} checked={this.props.value}
                           onChange={this.props.onChange}/>
                    <span className="slider round"></span>
                </span>)
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

    /** two handlers of user clicks - set react state and chrom state **/
    handleActivation() {
        let new_active = !this.state.active;
        this.setState({active: new_active});
        setPluginActivation(this.props.id, new_active);
    }

    handleRating() {
        let new_rating = (this.state.rating+1)%2
        this.setState({rating: new_rating});
        setPluginRating(this.props.id, new_rating);
    }

    render() {
        if (this.state.rating>0) {
            var starsvg = getIcon("fa star-filled")
        } else {
            var starsvg = getIcon("fa star")
        }
        return(
            <div>
                <SliderSwitch value={this.state.active} onChange={this.handleActivation}/>
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
        this.state = {info: false};
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
                    <div className="fair-col-10 fair-info fair-col-right">
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
                let active = fromDataOrDefault(data, key, STATE_INDEX_ACTIVE, true);
                let rating = fromDataOrDefault(data, key, STATE_INDEX_RATING, 0);
                thislist.setState(prevState =>
                    ({ ids: [...thislist.state.ids, [x, active, rating]]}))
            })
        });
    };

    /** re-render when all activation states have been collected **/
    shouldComponentUpdate(nextProps, nextState) {
        return (nextState.ids.length === this.props.names.length);
    }

    render() {
        var plugins = this.props.plugins;
        var items = this.state.ids.map(function(x) {
            var id= x[0];
            return <LibraryItem key={id} plugin={plugins[id]} active={x[1]} rating={x[2]}/>;
        });
        return (<ul className="fair-list">{ items }</ul>);
    }
}


/** assess each plugin state, update the count values back to DARK_COUNT **/
function resetAllPluginCounts() {
    library["names"].map(function (id) {
        resetPluginCount(id);
    });
}

/** A switch for recording a boolean setting using chrom storage **/
class BooleanSetting extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {value: 0};
    }
    componentDidMount() {
        let thislist = this;
        let key = "settings:" + this.props.setting;
        chrome.storage.sync.get(key, function (data) {
            let value = (JSON.stringify(data) !== "{}") ? data[key] : 0;
            thislist.setState({value: value})
        });
    }
    toggle() {
        let id = this.props.setting;
        this.setState(function(prevState) {
            let newvalue = (prevState.value + 1) % 2;
            setCustomization(id, newvalue);
            return ({value: newvalue})
        })
    }
    render() {
        return(<SliderSwitch value={this.state.value} onChange={this.toggle}/>)
    }
}


/** create the plugin details when the page loads **/
document.addEventListener("DOMContentLoaded", function () {
    // register a click handler on the button that resets plugin stats
    document.getElementById("fair-reset-button").addEventListener("click", resetAllPluginCounts);
    // the setTimeout is annoying, but without it one of the icons doesn't load in time for display?
    setTimeout(() => {
        ReactDOM.render(
                <LibraryList names={library['names']} plugins={library['plugins']} className="container"/>,
                document.getElementById('fair-library')
            );
    }, 0);
    ReactDOM.render(
        <BooleanSetting setting={"auto_last"}/>,
        document.getElementById("fair-auto-last")
    );
});
