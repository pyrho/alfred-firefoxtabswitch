// import fs from 'fs';

/**
 * Debugging native messaging on FF is a nightmare (not feasable?).
 * To enable debug logging uncomment the body of the function
 */
export function logToFile(m) {
    // fs.appendFileSync('/tmp/nmlog', `${m}\n`);
}



export const getRequestId = (() => {
    let id = 1;
    return () => ++id;

})();
