import fs from 'fs';

export function logToFile(m) {
    // console.error()
    fs.appendFileSync('/tmp/nmlog', `${m}\n`);
}



export const getRequestId = (() => {
    let id = 1;
    return () => ++id;

})();
