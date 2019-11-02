/**
 * Handling of FAIR-biomed popup
 * (the box in top-right that appears after clicking the extension icon)
 *
 * */


document.addEventListener("DOMContentLoaded", function() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("popup-version").textContent = "v" + manifest.version;
});
