const HTTP = require('http');

const CONSTANTS = require('./custom_lib/websocket_constants');
const FUNCTIONS = require('./custom_lib/websocket_methods');

// create a HTTP web-server object
const HTTP_SERVER = HTTP.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello, I hope you enjoy the "under-the-hood" WebSocket implementation');
});

// HTTP => start the http server
HTTP_SERVER.listen(CONSTANTS.PORT, () => {
    console.log("The http server is listening on port " + CONSTANTS.PORT);
});

// ERROR HANDLING
CONSTANTS.CUSTOM_ERRORS.forEach( errorEvent => {
    process.on(errorEvent, (err) => {
        console.log(`My code caught an error event: ${errorEvent}. Here's the error object`, err);
        process.exit(1);
    })
})


