/**
 * Handling of FAIR-biomed components on extension options page.
 * Copyright 2018 Tomasz Konopka. All rights reserved.
 *
 * */


var icons = {};


/** fetch an icon content, either from a cache or from disk **/
function getIcon(iconpath) {
    var ipath = iconpath.split(" ").join("/");
    // look up icon in cache first
    if (typeof(icons[ipath])!=="undefined") {
        return icons[ipath];
    }
    // if not in cache, load into cache
    var promise = new Promise(function(resolve, reject) {
        var xhr=new XMLHttpRequest();
        xhr.onload=function(){
            icons[ipath] = xhr.response;
            resolve(icons[ipath]);
        };
        xhr.ontimeout=function() {
            reject("timeout");
        }
        xhr.open("GET","/resources/"+ipath+".svg");
        xhr.send();
    });
    promise.then();
    return icons[ipath]
}


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
        super(props)
        if (this.props.src===null) {
            var src = "_logo_na.png"
        } else {
            var src = this.props.namespace+"."+this.props.src
        }
        this.state = {src: src};
    }
    render() {
        return (<img className="fair-logo" src={"/library/logo/"+this.state.src}></img>)
    }
}


/** Display a div with the info about a plugin **/
class PluginInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        //console.log("mounting plugin info "+this.props.id);
        var infofile = this.props.namespace+'.'+ this.props.info;
        var thislist = this;
        var promise = new Promise(function(resolve, reject) {
            var xhr=new XMLHttpRequest();
            xhr.onload=function(){
                //console.log(xhr.response)
                thislist.setState({info: xhr.response})
                resolve(xhr.response);
            };
            xhr.ontimeout=function() {
                reject("timeout");
            }
            xhr.open("GET","/library/info/"+infofile);
            xhr.send();
        });
        promise.then();
    };

    render() {
        //console.log("this visible: "+this.props.visible);
        if (!this.props.visible) {
            return (null)
        }
        return(<div className="fair-container fair-fullwidth fair-info"
                    dangerouslySetInnerHTML={{__html: this.state.info }}></div>)
    }
}


/** Display a toggle switch and star-status **/
class PluginState extends React.Component {
    constructor(props) {
        super(props)
        //console.log("making plugin state");
        this.handleActivation = this.handleActivation.bind(this);
        this.handleRating = this.handleRating.bind(this);
        this.state = {active: this.props.active, rating: this.props.rating};
    }

    handleActivation(event) {
        // set the react state
        this.setState(prevState => ({ active: !prevState.active}));
        // set the extension state on disk
        var newstate = {};
        newstate["plugin:"+this.props.id] = [!this.state.active, this.state.rating];
        chrome.storage.sync.set(newstate);
    }

    handleRating(event) {
        //console.log("setting new rating")
        // set the react state
        this.setState(prevState => ({ rating: (prevState.rating+1)%2}))
        // set the extension state on disk
        var rating = {}
        rating["plugin:"+this.props.id] = [this.state.active, (this.state.rating+1)%2]
        chrome.storage.sync.set(rating);
        //console.log(JSON.stringify(rating))
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
        //console.log("rendering item "+this.props.plugin.id+" active:"+this.props.active+ " rating:"+this.props.rating)
        //console.log("plugin namespace: "+this.props.plugin.namespace);
        var plugin = this.props.plugin;
        var tags = plugin.tags.map(function(x) {
            return <PluginTag key={x} tag={x} />;
        });
        return (
            <li className="fair-center-v">
                <div className="fair-row">
                    <div className="fair-col-2 fair-center-center">
                        <PluginLogo id={plugin.id} src={plugin.logo} namespace={plugin.namespace}/>
                    </div>
                    <div className="fair-col-8 fair-info">
                        <div className="fair-center-center fair-click" onClick={this.handleInfo}>
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
        // store a set of ids for which the active state is known
        this.state = {ids: []};
    }

    /**
     * upon first mounting the list, look up whether each plugin has been activated
     */
    componentDidMount() {
        var thislist = this;

        // helper to force x into a proper value
        var revertToDefault = function(x, def) {
            if (x===null || typeof(x)==="undefined") {
                return (def);
            }
            return (x);
        }

        this.props.names.map(function(x) {
            var key = "plugin:"+x;
            chrome.storage.sync.get(key, function(data) {
                var active = null;
                var rating = null;
                if (JSON.stringify(data)!=="{}") {
                    active = data[key][0]
                    rating = data[key][1]
                }
                active = revertToDefault(active, true)
                rating = revertToDefault(rating, 0)
                thislist.setState(prevState =>
                    ({ ids: [...thislist.state.ids, [x, active, rating]]}))
            })
        })
    };

    /** re-render when all activation states have been collected **/
    shouldComponentUpdate(nextProps, nextState) {
        return (nextState.ids.length == this.props.names.length);
    }

    render() {
        //console.log("rendering library list");
        var plugins = this.props.plugins;
        var items = this.state.ids.map(function(x) {
            var id= x[0];
            return <LibraryItem key={id} plugin={plugins[id]} active={x[1]} rating={x[2]}/>;
        })
        return (<ul className="fair-list">{ items }</ul>);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    getIcon("fa star")
    getIcon("fa star-filled")
    // add the plugin details into the page
    ReactDOM.render(
        <LibraryList names={library['names']} plugins={library['plugins']} className="container"/>,
        document.getElementById('fair-library')
    );
});


