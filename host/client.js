 const ipc = require('node-ipc');

 function sendMessageToHostApp(message) {
     return new Promise(resolve => {

         ipc.config.id   = 'hello';
         ipc.config.retry= 1500;
         ipc.config.silent = true;

         ipc.serveNet(
             8001,
             'udp4',
             function(){
                 ipc.server.on(
                     'message',
                     function(data){
                         // ipc.log('Got answer!');
                         // ipc.log(data.message);
                         // ipc.log('got a message from '.debug, data.from.variable ,' : '.debug, data.message.variable);
                         const t = data.message;
                         console.log('got message');
                         // console.log(JSON.parse(t).data.map(e => e.url));
                         ipc.server.stop();
                         return resolve(t);
                     }
                 );

                 console.log('sending message!');
                 ipc.server.emit(
                     {
                         address : '127.0.0.1', //any hostname will work
                         port    : 8000,
                     }, 
                     'message', 
                     {
                         from    : ipc.config.id,
                         message,
                     }
                 );
                 console.log('waiting for answer....');
             }
         );

         ipc.server.start();
     });

}

function main() {
    const cmd = process.argv[2];
    const arg = process.argv[3];
    console.log(process.argv[2]);
    switch (cmd) {
        case 'get':
            sendMessageToHostApp('getTabList').then(d => console.log(d));
            break;

        case 'switch':
            sendMessageToHostApp(`switchTo:${arg}`).then(d => console.log(d));
            break;

        default:
            throw new Error(`Unknown command ${cmd}`);
    }

}


main();
