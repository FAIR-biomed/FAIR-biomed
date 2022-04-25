/**
 * FAIR-biomed components on user web pages
 *
 * */

'use strict'

const React = require('react')
const ReactDOM = require('react-dom/client')
const Rnd = require('react-rnd').Rnd


// load a few icons into the cache for faster loading
const iconcache = {};
['fa star', 'fa star-filled', 'fa search', 'fa arrow-left-solid']
    .forEach(function(x) {
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
 * */
function FAIRIconLogo({type, path, onClick}) {
    const [data, setData] = React.useState(null)

    // fetch the icon from cache or from the extension
    React.useEffect(() => {
        let cached = iconcache[path]
        if (is.undefined(cached)) {
            let msg = {action: type, path: path}
            chrome.runtime.sendMessage(msg, function (response) {
                setData(response.data)
            })
        } else {
            setData(cached)
        }
    })

    if (data===null) return(null)
    let cursorClass = (onClick === null) ? '' : ' fair-pointer'
    return (
        <span className={'fair-'+type+cursorClass}
                 dangerouslySetInnerHTML={{__html: data}}
                 onClick={onClick}></span>
    )
}


/** display a table with header and body */
function FAIROutputTable({data}) {
    data = data.slice(0)
    if (data.length === 0) {
        return (<table></table>)
    }
    // construct a header from first element in data
    let header = data.shift()
    if (!is.undefined(header) && header.length !== 0) {
        let headeritems = header.map(function (x, i) {
            let thkey = 'header-' + i
            return (<th key={thkey}>{x}</th>)
        })
        header = (<tr>{headeritems}</tr>)
    } else if (is.null(header[0])) {
        header = (null)
    }
    // construct a body from remaining elements
    let body = (<tr></tr>)
    if (data.length>0) {
        body = data.map(function(dataline, i) {
            let bodyline = dataline.map(function(x, j) {
                let tdkey = 'body-' + i + '-' + j
                return (<td key={tdkey} dangerouslySetInnerHTML={{__html: x}}></td>)
            })
            return (<tr mylab={'body-'+i} key={'body-'+i}>{bodyline}</tr>)
        })
    }
    return (<table><thead>{header}</thead><tbody>{body}</tbody></table>)
}


/** Display <ul> with several items **/
function FAIROutputList({data}) {
    let content = data.map(function(x, i) {
        return (<li key={"list-"+i} dangerouslySetInnerHTML={{__html: x}} />)
    })
    return (<ul>{content}</ul>)
}


/** display a title-body combination **/
function FAIROutputSection({title, data}) {
    let header = <></>
    if (is.string(title)) {
        header = (<h1>{title}</h1>)
    }
    let content = '[unrecognized type of output]'
    if (is.string(data)) {
        content = (<div dangerouslySetInnerHTML={{__html: data}}></div>)
    } else if (is.array(data)) {
        if (is.array2(data)) {
            content = (<FAIROutputTable data={data}/>)
        } else if (is.array1(data)) {
            content = (<FAIROutputList data={data}/>)
        }
    }
    return (<div className='fair-subsection'>{header}{content}</div>)
}


/** Display a <pre> element **/
function FAIROutputCode({data}) {
    return (<pre onMouseDown={e => e.stopPropagation()}
                 dangerouslySetInnerHTML={{__html: data}}></pre>)
}


/** display a toolbar (bottom) with buttons for: main results, info, api-code, external link **/
function FAIROutputToolbar({handlers, icons, state}) {
    let toolbar_icons = ['data', 'info', 'code', 'external']
    toolbar_icons = toolbar_icons.map(function(value, key) {
        let thishandler = handlers[value]
        let thisicon = icons[value]
        let addClass = ''
        if (value === state) {
            addClass = 'fair-toolbar-selection'
        }
        return(
            <div key={key + thisicon}
                 className={'fair-col-3 fair-result-toolbar-button '+addClass}>
                <FAIRIconLogo type='icon' path={'fa '+thisicon}
                              onClick={thishandler}/>
            </div>
        )
    })
    return(<div className='fair-row fair-result-toolbar'>{toolbar_icons}</div>)
}


/** display the output of a plugin, and a toolbar to toggle between views **/
function FAIROutput({id, query}) {
    const [type, setType] = React.useState('init')
    const [data, setData] = React.useState(null)
    const [info, setInfo] = React.useState(null)
    const [code, setCode] = React.useState(null)
    const [external, setExternal] = React.useState(null)
    const [usedQuery, setUsedQuery] = React.useState(null)

    /** Upon generation of plugin-specific component, fetch plugin-based data **/
    if (usedQuery != query) {
        let msg = {action: 'run', id: id, query: query}
        chrome.runtime.sendMessage(msg, function(response) {
            // when the query time out, the response might be null or undefined
            if (is.undefined(response)) {
                response = { status: 0, data: "extension error"}
            }
            setType("data")
            setData(response.data)
            setExternal(response.external)
            setCode(response.url)
            setUsedQuery(query)
        })
    }

    /** Fetch and trigger display of plugin info page **/
    const showInfo = () => {
        let msg = {action: 'info', id: id}
        chrome.runtime.sendMessage(msg, function(response) {
            setType("info")
            setInfo(response.data)
        })
    }
    const showResult = () => {
        setType('data')
    }
    const showCode = () => {
        setType('code')
    }
    const showExternal = () => {
        if (!is.null(external) && !is.undefined(external)) {
            window.open(external, '_blank')
        }
    }

    if (usedQuery != query) {
        return (<div>Please wait...</div>)
    }
    // either output a single text object, or partition into sections
    let content = []
    if (type === 'data') {
        if (is.string(data)) {
            content = [<FAIROutputSection key='section' data={data}/>]
        } else if (is.array(data)) {
            content = data.map(function(value, key) {
                return (<FAIROutputSection key={'section'+key} data={value}/>)
            })
        } else {
            content = Object.keys(data).map(function(value, key) {
                return (<FAIROutputSection key={key} title={value} data={data[value]}/>)
            })
        }
    } else if (type === 'info') {
        content = [<FAIROutputSection key='text-info' data={info}/>]
    } else if (type === 'code') {
        content = [<FAIROutputCode key='text-code' data={code}/>]
    }

    const _handlers = {
        'info': showInfo, 'code': showCode,
        'data': showResult, 'external': showExternal
    }
    const _icons = {
        'info': 'info', 'code': 'code',
        'data': 'table-solid', 'external': 'external-link-alt'
    }

    return (
        <div className='fair-fill-v'>
            <div className='fair-row fair-result'>
                <div className='fair-section fair-col-12'>
                    {content}
                </div>
            </div>
            <FAIROutputToolbar state={type}
                               handlers={_handlers}
                               icons={_icons}/>
        </div>
    )
}


/** display an area with a candidate header on top and output below **/
function FAIRCandidateView({id, titles, rating, query}) {
    return (
        <div className='fair-fill-v'>
            <FAIRCandidateListItem id={id}
                           titles={titles}
                           rating={rating}
                           selectPlugin={null}/>
            <FAIROutput className='fair-output'
                        id={id}
                        query={query}/>
        </div>
    )
}


/** Display one candidate plugin as a list item to click on */
function FAIRCandidateListItem({id, titles, rating, selectPlugin}) {
    const icon_paths = ["fa star", "fa star-filled"]
    const [currentRating, setRating] = React.useState(rating)

    const handleSelection = () => {
        let msg = {action: 'update_count', id: id}
        chrome.runtime.sendMessage(msg)
        if (selectPlugin !== null) {
            selectPlugin(id)
        }
    }

    const handleRating = () => {
        let newRating = (currentRating+1) % 2
        let msg = {action: 'rate', id: id, rating: newRating}
        chrome.runtime.sendMessage(msg, function(response) {
            // no need to process any response
        })
        setRating(newRating)
    }

    return (
        <li className='fair-candidate' >
            <div className='fair-row'>
                <div className='fair-col-2 fair-logo-col fair-center-center'
                     onClick={handleSelection}>
                    <FAIRIconLogo type='logo' path={id}/>
                </div>
                <div className='fair-col-9 fair-center-center'
                     onClick={handleSelection}>
                    <div className='fair-container fair-fullwidth'>
                        <h3>{titles[0]}</h3>
                        <h4>{titles[1]}</h4>
                    </div>
                </div>
                <div className='fair-col-1 fair-center-center fair-rating'>
                    <FAIRIconLogo type='icon' key={id + currentRating}
                                  path={icon_paths[currentRating]} onClick={handleRating}/>
                </div>
            </div>
        </li>
    )
}


/** display a list with multiple FAIRCandidate items
 *
 * required props
 *
 *  - candidates, array of candidates
 *  - selectPlugin, function to act on a user selection
 *
 * **/
function FAIRCandidateList({candidates, selectPlugin}) {
    let items = candidates.map(function (x) {
        let id = x['id']
        return (
            <FAIRCandidateListItem key={id} id={id}
                           titles={[x['title'], x['subtitle']]}
                           rating={x['rating']}
                           selectPlugin={selectPlugin}/>
        )
    })
    return (<ul className='fair-list fair-candidate-list' >{items}</ul>)
}



/* comparator for objects that contain a 'score' field **/
const compareCandidates = (a, b) => {
    if (a.score > b.score) return -1
    if (a.score < b.score) return 1
    return 0
}


/** display either a list of plugins that claimed the query, or plugin output **/
function FAIRClaimResult({query, setNavState, display}) {
    const [selection, setSelection] = React.useState(null)
    const [candidates, setCandidates] = React.useState([])
    const [usedQuery, setUsedQuery] = React.useState(null)

    /** Toggle into a plugin-specific view **/
    const selectPlugin = (id) => {
        setSelection(id)
        setNavState("selection")
    }

    /** look up plugins that claim a query string **/
    if (display === "list" && usedQuery != query) {
        let msg = {action: 'claim', query: query}
        chrome.runtime.sendMessage(msg, function(response) {
            setCandidates(response.hits.sort(compareCandidates))
            setUsedQuery(query)
            if (response.preferred !== null) {
                selectPlugin(response.preferred)
            }
        })
    }

    if (display === 'list') {
        return (<FAIRCandidateList candidates={candidates}
                                   selectPlugin={selectPlugin} />)
    } else {
        let candidate = candidates.filter((x) => x['id'] === selection)[0]
        // safety check (this is needed for when user changes the query
        // while already looking at a specific plugin candidate)
        if (is.undefined(candidate)) return (null)
        return (
            <FAIRCandidateView className='fair-output'
                               id={selection}
                               titles={[candidate['title'], candidate['subtitle']]}
                               rating={candidate['rating']}
                               query={query} />
        )
    }
}


/** display the header with query box, list of plugins, and results */
function FAIRHeaderBody({range}) {
    let rangeStr = ""
    if (!is.null(range)) {
        rangeStr = range.toString()
        rangeStr = (rangeStr.trim()).replace(/\s+/g, ' ')
    }
    const [query, setQuery] = React.useState(rangeStr)
    const [display, setDisplay] = React.useState("list")

    const backToList = () => {
        setDisplay("list")
    }
    const setNavState = (type) => {
        setDisplay(type)
    }
    const onInputChange = (e) => {
        setQuery(e.target.value)
    }

    let navicon = []
    if (display === 'list') {
        navicon.push(<FAIRIconLogo key='nav-search'
                                   type='icon' path='fa search' />)
    } else {
        navicon.push(<FAIRIconLogo key='nav-selection'
                                   type='icon' path='fa arrow-left-solid'
                                   onClick={backToList} />)
    }

    return (
        <div className='fair-header-body'>
            <div className='fair-header fair-handle'>
                {navicon}
                <input className='fair-query' type='text'
                       onMouseDown={e => e.stopPropagation()}
                       defaultValue={query}
                       onInput={onInputChange}/>
            </div>
            <div className='fair-body'>
                <FAIRClaimResult query={query}
                                 setNavState={setNavState}
                                 display={display}/>
            </div>
        </div>
    )
}


/** launch a container/popup with control buttons and content. */
function FAIRContainer({range, container})  {
    const [size, setSize] = React.useState([480, 520])
    const [pos, setPos] = React.useState([0, 0])

    const close = () => {
        document.body.removeChild(container)
    }

    // set initial position of the container near the selection
    React.useEffect(() => {
        let bounding = {left: 20, top: 20, width: 0, height: 0}
        if (!is.null(range)) {
            bounding = range.getBoundingClientRect()
        }
        const body_bounding = document.body.getBoundingClientRect()
        let offset = { 'top': window.pageYOffset, 'left': window.pageXOffset}
        const container_pos = [Math.round(offset.left + bounding.left + bounding.width/2),
            Math.round(offset.top + bounding.top - body_bounding.height + bounding.height*1.5)]
        if (container_pos[0] != pos[0] || container_pos[1] != pos[1]) {
            setPos(container_pos)
        }
    })

    return (
        <Rnd size={{ width: size[0], height: size[1] }}
             style={{ left: pos[0]+"px", top: pos[1]+"px"}}
             className="fair-outer"
             cancel="div.fair-body > *"
             onResizeStop={(e, direction, ref, delta, position) => {
                setSize([ref.offsetWidth, ref.offsetHeight])
             }}>
            <div className='fair-inner fair-container'>
                <div className='fair-button-panel'>
                    <FAIRIconLogo type='icon' path='fa times-solid'
                                  onClick={close}></FAIRIconLogo>
                </div>
                <FAIRHeaderBody range={range}/>
            </div>
        </Rnd>
    )
}


/** create DOM div for the popup container */
function initFAIRContainer(range) {
    let container = document.createElement('div')
    container.className = 'fair-reset'
    const containerRoot = ReactDOM.createRoot(container)
    containerRoot.render(<FAIRContainer range={range} container={container}/>)
    document.body.appendChild(container)
}


/** trigger FAIRContainer. Used by key listener and context menu. **/
function triggerFAIRContainer() {
    let selection = window.getSelection()
    if (selection.toString()!=='') {
        initFAIRContainer(selection.getRangeAt(0))
    } else {
        initFAIRContainer(null)
    }
}


/** Register listeners for keypresses */
window.addEventListener('keydown', function(e){
    if (e.shiftKey && e.ctrlKey && e.code === "KeyZ") {
        triggerFAIRContainer()
    }
}, false)


/** Register listeners catching messages from background.js */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!sender.tab && request.action === "contextMenuClick") {
        triggerFAIRContainer()
    }
    // this send is required to avoid a runtime error
    sendResponse({})
})
