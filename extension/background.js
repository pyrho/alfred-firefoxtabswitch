/*
const shell = {}
shell.port = chrome.runtime.connectNative('shell')
chrome.runtime.onConnectExternal.addListener((port) => {
  // Send request to the application
  port.onMessage.addListener((request) => {
    shell.port.postMessage(request)
  })
  // Receive response
  shell.port.onMessage.addListener((response) => {
    port.postMessage(response)
  })
});


setInterval(() => {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(t => {
            console.log(t.title + ', ' + t.url);
        });
    });
}, 2000);
*/

/*
On startup, connect to the "ping_pong" app.
*/
var port = browser.runtime.connectNative("ping_pong");

function sendTabList({ requestId, port }) {
    chrome.tabs.query({}, tabs => {

        const relevantData = tabs.map(e => {
            return {
                id: e.id,
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

/*
Listen for messages from the app.
*/
port.onMessage.addListener(response => {
    console.log(`Got message from NM: ${JSON.stringify(response)}`);
    dispatcher({ ...response, port });
});

port.onDisconnect.addListener(e =>{ 
    console.log('port disconnected (probably an error): ' + e);
});


/*
 On a click on the browser action, send the app a message.
 browser.browserAction.onClicked.addListener(() => {
     console.log("Sending:  ping");
     port.postMessage("ping");
 });
 */
