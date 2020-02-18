const port = browser.runtime.connectNative("alfred-firefoxtabswitch");

function sendTabList({ requestId, port }) {
    chrome.tabs.query({}, tabs => {

        const relevantData = tabs.map(e => {
            return {
                id: e.index,
                windowId: e.windowId,
                url: e.url,
                title: e.title,
            };
        });
        port.postMessage({ requestId, data: relevantData });
    });
}

function switchToTab({ port, requestId, windowId, tabId }) {
    chrome.tabs.highlight({
        windowId,
        tabs: [ tabId ]
    });
    port.postMessage({ requestId, data: null });
}

function dispatcher({ cmd, requestId, port }) {
    switch (cmd) {

        case 'getTabList':
            sendTabList({ requestId, port });
            break;


        default:
            if (cmd.indexOf('switchTo') === 0) {
                const args = cmd.split(':');
                const tabId = Number(args[1]);
                const windowId = Number(args[2]);
                switchToTab({ port, requestId, windowId, tabId });
            } else {

                throw new Error(`Unknown command: ${msg.cmd}`);
            }
    }

    return;
}

port.onMessage.addListener(response => {
    // console.log(`Got message from NM: ${JSON.stringify(response)}`);
    dispatcher({ ...response, port });
});
