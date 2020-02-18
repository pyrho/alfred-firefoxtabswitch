#!/usr/local/bin/node

const ipc = require('node-ipc');
const {  getRequestId, logToFile  } = require('./utils');
const config = require('./config');
const initNmHost = require('node-native-messaging-host');

function sendRequestAndGetResponse({ nm, cmd, pendingRequests }) {
    return new Promise(resolve => {
        const requestId = getRequestId();
        const msg = JSON.stringify({
            cmd,
            requestId,
        });

        logToFile(`Sending to extension : ${msg}`);

        nm.send(msg);

        pendingRequests[requestId] = resolve;
    });
}

function startServer(cb) {
    ipc.config.id   = 'host';
    ipc.config.retry= 1500;
    ipc.config.silent = true; // no logging
    ipc.serveNet(config.ipc.serverPort, 'udp4', () => ipc.server.on('message', cb));
    ipc.server.start();
    logToFile('IPC server started');
}

function init() {

    process.stderr.write('Init!');
    logToFile('Init done.');
    const pendingRequests = {};
    const nm = initNmHost();

    const fulfillRequest = (requestId, data) => {
        if (Object.keys(pendingRequests).some(k => k === requestId)) {
            logToFile('requestID not found in pendingRequests');
            return;
        }
        logToFile('Fulfilling request ' + requestId);
        logToFile(JSON.stringify(data));
        pendingRequests[requestId](data);
    }

    nm.addOnMessageListener((error, json) => {
        if (error) {
            process.stderr.write('Error on NM onMessage: ' + error);
        }

        if (!json.requestId) {
            logToFile('RequestID missing in extension response');
            return;
        }

        if (!pendingRequests[json.requestId]) {
            logToFile('requestID not found in pendingRequests');
            return;
        }

        fulfillRequest(json.requestId, json.data);

    });


    startServer((data, socket) => {
        logToFile('got message from client');
        const command = data.message;

        // Ask the extension
        sendRequestAndGetResponse({ pendingRequests, nm, cmd: command}).then(r => {
            logToFile('RESOLVED!');
            ipc.server.emit( socket, 'message', {
                from: ipc.config.id,
                message: r,
            });
        });
    });
}

init();
