import fs from 'fs';
import os from 'os';

(function () {
    const base = {
        "name": "alfredtabswitch",
        "description": "A Native Messaging host that enables quickly switching between tabs using Alfred",
        "path": "nope",
        "type": "stdio",
        "allowed_extensions": [ "alfredtabswitch@25.wf" ]
    }
    const manifestPath = `${os.homedir()}/Library/Application\ Support/Mozilla/NativeMessagingHosts/alfredtabswitchlol.json`;
    base.path = `${process.argv[2]}/alfred-firefoxtabswitch/host/app.js`;

    fs.writeFileSync(manifestPath, JSON.stringify(base, null, 2), 'utf8');
})();
