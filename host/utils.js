// import fs from 'fs';

/**
 * Debugging native messaging on FF is a nightmare (not feasable?).
 * To enable debug logging uncomment the body of the function
 */
module.exports.logToFile = m => {
    // fs.appendFileSync('/tmp/nmlog', `${m}\n`);
}

module.exports.getRequestId = (() => {
    let id = 1;
    return () => ++id;

})();
