/**
 * Handling of FAIR-biomed components on extension options page.
 *
 * */

const React = require('react');
const ReactDOM = require('react-dom/client');

// cache for storing plugin icons
const icons = {};


/** fetch an icon from a cache or from disk **/
function getIcon(iconpath, resolve) {
    const ipath = iconpath.split(" ").join("/");
    if (typeof(icons[ipath]) !== "undefined") {
        resolve(icons[ipath]);
    }
    fetch("/resources/"+ipath+".svg")
        .then(response => response.text())
        .then(data => {
            icons[ipath] = data;
            resolve(data)
        })
}


/** display a label/badge **/
function PluginTag({tag}) {
    return (<span className="fair-badge">{tag}</span>);
}


/** display a logo image if available, or a placeholder **/
function PluginLogo({namespace, src}) {
    const logo_src = (src !== null) ? namespace + "." + src : "_logo_na.png"
    return (<img className="fair-logo" src={"/library/logo/" + logo_src}></img>)
}


/** Display a div with the info about a plugin **/
function PluginInfo({namespace, info, visible}) {
    const [infoText, setInfoText] = React.useState(info)
    React.useEffect(() => {
        const infofile = namespace + '.' + info;
        fetch("/library/info/" + infofile)
            .then(response => response.text())
            .then(data => setInfoText(data))
    }, [])
    if (!visible) return (null)
    return(<div className="fair-container fair-fullwidth fair-info fair-info-detail"
                dangerouslySetInnerHTML={{__html: infoText }}></div>)
}


/** display an on/off switch **/
function SliderSwitch({id, value, onChange})  {
    return(
        <span className={"switch"}>
            <input type="checkbox" value={value} checked={value} onChange={onChange}/>
            <span className="slider round"></span>
        </span>
    )
}


/** display information about one library plugin **/
function LibraryItem({plugin}) {
    const icon_paths = ["fa star", "fa star-filled"]
    const [active, setActive] = React.useState(true)
    const [rating, setRating] = React.useState(0)
    const [expanded, setExpanded] = React.useState(false)
    const [icon, setIcon] = React.useState("")

    // when the item first loads, look up its settings from local storage
    React.useEffect(() => {
        const fromDataOrDefault = function(data, key, idx, def) {
            if (JSON.stringify(data)==="{}") return def;
            if (idx >= data[key].length) return def;
            return data[key][idx];
        };
        const key = "plugin:" + plugin.id;
        chrome.storage.sync.get(key, function(data) {
            const rating = fromDataOrDefault(data, key, STATE_INDEX_RATING, 0)
            setActive(fromDataOrDefault(data, key, STATE_INDEX_ACTIVE, true))
            setRating(rating)
            getIcon(icon_paths[rating], setIcon)
        })
    }, [])

    const handleExpansion = () => {
        setExpanded(!expanded)
    }
    const handleActivation = () => {
        const newActive = !active
        setActive(newActive)
        setPluginActivation(plugin.id, newActive);
    }
    const handleRating = () => {
        const newRating = (rating+1) % 2
        setRating(newRating)
        setPluginRating(plugin.id, newRating);
        getIcon(icon_paths[newRating], setIcon)
    }
    const tags = plugin.tags.map(function(x) {
        return <PluginTag key={x} tag={x} />;
    });
    return (
        <li className="fair-center-v">
            <div className="fair-row">
                <div className="fair-col-2 fair-center-center">
                    <PluginLogo id={plugin.id} src={plugin.logo} namespace={plugin.namespace}/>
                </div>
                <div className="fair-col-8 fair-info">
                    <div className="fair-center-v fair-click" onClick={handleExpansion}>
                        <div className="fair-container fair-fullwidth">
                            <h3>{plugin.title}</h3>
                            <h4>{plugin.subtitle}</h4>
                            <p>{tags}</p>
                        </div>
                    </div>
                </div>
                <div className="fair-col-2 fair-center-center">
                    <div>
                        <SliderSwitch id={plugin.id}
                                      value={active}
                                      onChange={handleActivation}/>
                        <span className="fair-rating"
                              dangerouslySetInnerHTML={{__html: icon}}
                              onClick={handleRating}></span>
                    </div>
                </div>
            </div>
            <div className="fair-row fair-info">
                <div className="fair-col-2"></div>
                <div className="fair-col-10 fair-info fair-col-right">
                    <PluginInfo namespace={plugin.namespace} info={plugin.info} visible={expanded}/>
                </div>
            </div>
        </li>
    )
}


/** list showing all available plugins, with options to turn on/off **/
function LibraryList({plugins, names}) {
    const items = names.map(function(id) {
        return <LibraryItem key={id} plugin={plugins[id]}/>;
    });
    return (<ul className="fair-list">{items}</ul>);
}


/** display a grid/matrix showing all available plugin logos **/
function LibraryGrid({names, plugins}) {
    let logo_filenames = new Set()
    let logos = names.map(function(id) {
        let plugin = plugins[id];
        if (logo_filenames.has(plugin.logo)) return (null);
        logo_filenames.add(plugin.logo);
        return (
            <div className="fair-library-grid-element fair-center-center"
                 key={"grid-logo-"+plugin.id}>
                <PluginLogo id={plugin.id} src={plugin.logo} namespace={plugin.namespace}/>
            </div>
        );
    });
    return (<div>{logos}</div>);
}


/** update the count values of all the plugins back to DARK_COUNT **/
function resetAllPluginCounts() {
    library["names"].map(function (id) {
        resetPluginCount(id);
    });
}


/** display a switch for recording a setting using local storage **/
function BooleanSetting({setting, value}) {
    const [currentValue, setValue] = React.useState(value)
    const toggleValue = () => {
        let newValue = (currentValue + 1) % 2;
        setCustomization(setting, newValue);
        setValue(newValue)
    }
    React.useEffect(() => {
        let key = "settings:" + setting;
        chrome.storage.sync.get(key, function (data) {
            let newValue = (JSON.stringify(data) !== "{}") ? data[key] : 0;
            setValue(newValue)
        });
    }, [])
    return(<SliderSwitch value={currentValue} onChange={toggleValue}/>)
}


/** create the plugin details when the page loads **/
document.addEventListener("DOMContentLoaded", function () {
    const libraryRoot = ReactDOM.createRoot(document.getElementById('fair-library'))
    libraryRoot.render(<LibraryList names={library['names']} plugins={library['plugins']} className="container"/>)
    const gridRoot = ReactDOM.createRoot(document.getElementById('fair-library-grid'))
    gridRoot.render(<LibraryGrid names={library['names']} plugins={library['plugins']} className="container"/>)
    const settingsRoot = ReactDOM.createRoot(document.getElementById("fair-auto-last"))
    settingsRoot.render(<BooleanSetting setting={"auto_last"} value={false}/>)
    document.getElementById("fair-reset-button").addEventListener("click", resetAllPluginCounts);
});

