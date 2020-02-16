#!/usr/local/bin/node
const fs = require('fs');
const ipc = require('node-ipc');
const stream = require('stream');

const pendingRequests = {};

const getRequestId = (() => {
    let id = 1;
    return () => ++id;

})();

function logToFile(m) {
    fs.appendFileSync('/tmp/nmlog', `${m}\n`);
}

function sendRequestAndGetResponse(cmd) {
    const requestId = getRequestId();

    return new Promise(resolve => {
        const msg = JSON.stringify({
            cmd,
            requestId,
        })

        logToFile(`Sending to extension : ${msg}`);

        sendMessage(msg);

        pendingRequests[requestId] = resolve;
    });
}

function startServer() {
    ipc.config.id   = 'world';
    ipc.config.retry= 1500;
    ipc.config.silent = true; // no logging
    ipc.serveNet(
        8000,
        'udp4',
        function(){
            ipc.server.on(
                'message',
                function(data, socket){
                    logToFile('got message from client');
                    const command = data.message;

                    // Ask the extension
                    sendRequestAndGetResponse(command).then(r => {

                        logToFile('RESOLVED!');
                        try {
                            // Reply to the client
                            logToFile('sending: ' + r);
                            ipc.server.emit( socket, 'message', {
                                from: ipc.config.id,
                                message: r.toString('utf8'),
                            });
                            logToFile('sent');
                        } catch (e) {
                            logToFile(`Failed to reply on socket: ${e}`);
                        }
                    });
                }
            );

        }
    );

    ipc.server.start();

}

function startNativeMessagingHost() {
    let payloadSize = null;
    let chunks = [];

    const sizeHasBeenRead = () => Boolean(payloadSize);
    const flushChunksQueue = () => {
        payloadSize = null;
        chunks.splice(0);
    };
    const fulfillRequest = (requestId, content) => {
        if (Object.keys(pendingRequests).some(k => k === requestId)) {
            logToFile('requestID not found in pendingRequests');
            return;
        }
        logToFile('Fulfilling request ' + requestId);
        pendingRequests[requestId](content);
    }

    const processData = () => {
        logToFile('-------------->');

        const stringData = Buffer.concat(chunks);
        if (!sizeHasBeenRead()) {
            payloadSize = stringData.readUInt32LE(0);
        }

        if (stringData.length >= (payloadSize + 4)) {
            const contentWithoutSize = stringData.slice(4, (payloadSize + 4));
            logToFile(`Ok data ${contentWithoutSize}`);
            flushChunksQueue();

            let json = null;
            try {
                json = JSON.parse(contentWithoutSize);
            } catch (e) {
                logToFile(`Unable to parse JSON: ${e}`);
                logToFile(contentWithoutSize);
                return;
            }

            if (!json.requestId) {
                logToFile('RequestID missing in extension response');
                return;
            }

            if (!pendingRequests[json.requestId]) {
                logToFile('requestID not found in pendingRequests');
                return;
            }

            fulfillRequest(json.requestId, contentWithoutSize);
            return;

        } else {
            logToFile(`Nope ${stringData}`);
        }

        logToFile('--------------<');

    };

    process.stdin.on('readable', () => {
        let chunk;
        // Use a loop to make sure we read all available data.
        while ((chunk = process.stdin.read()) !== null) {
            chunks.push(chunk);
        }

        processData();
    });

    process.on('uncaughtException', (err) => {
        sendMessage({error: err.toString()})
    });
}

function sendMessage(msg) {
    var header = Buffer.alloc(4);
    header.writeUInt32LE(msg.length, 0);

    process.stdout.write(header);
    process.stdout.write(msg);
}

startNativeMessagingHost();
startServer();
