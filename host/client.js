const ipc = require('node-ipc');
const config = require('./config');
const alfy = require('alfy');
const runApplescript = require('run-applescript');

function sendMessageToHostApp(message) {
    return new Promise((resolve, reject) => {
        ipc.config.id = 'client';
        ipc.config.retry = 1500;
        ipc.config.silent = true;

        ipc.serveNet(config.ipc.clientPort, 'udp4', function() {
            const timer = setTimeout(() => {
                console.error('Request timeout');
                ipc.server.stop();
                return reject(new Error('Request timeout'));
            }, 1000);

            ipc.server.on('message', function(data) {
                clearTimeout(timer);
                const t = data.message;
                ipc.server.stop();
                return resolve(t);
            });

            ipc.server.emit(
                {
                    address: '127.0.0.1', //any hostname will work
                    port: config.ipc.serverPort,
                },
                'message',
                {
                    from: ipc.config.id,
                    message,
                },
            );
        });

        ipc.server.start();
    });
}

async function main() {
    const cmd = process.argv[2];
    const arg = process.argv[3];
    switch (cmd) {
        case 'get':
            const d = await sendMessageToHostApp('getTabList');

            const formattedElements = d.map(element => ({
                title: element.title,
                subtitle: element.url,
                arg: `${Number(element.id)}:${element.windowId}`,
            }));

            const filters = process.argv.slice(3).map(a => a.toLowerCase());
            const titleMatchesAllFilters = e =>
                filters.every(f => e.title.toLowerCase().indexOf(f) >= 0);
            const urlMatchesAllFilters = e =>
                filters.every(f => e.subtitle.toLowerCase().indexOf(f) >= 0);

            const filterItemsIfNeeded = () =>
                filters
                    ? formattedElements.filter(
                          e => titleMatchesAllFilters(e) || urlMatchesAllFilters(e),
                      )
                    : formattedElements;

            alfy.output(filterItemsIfNeeded(formattedElements));

            break;

        case 'switch':
            sendMessageToHostApp(`switchTo:${arg}`); //.then(d => console.log(d));
            await runApplescript(`set devEditionExists to false
try
	do shell script "osascript -e 'exists application \"Firefox Developer Edition\"'"
	set devEditionExists to true
end try

if devEditionExists then
	tell application "Firefox Developer Edition" to activate
else
	tell application "Firefox" to activate
end if`);
            break;

        default:
            throw new Error(`Unknown command ${cmd}`);
    }
}

main();
