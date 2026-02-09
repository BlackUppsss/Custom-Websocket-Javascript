const HTTP = require('http');

//Import Custom Library
const WsConstants = require('./CustomLib/WebsocketConstants');
const WsMethods = require('./CustomLib/WebsocketMethods');

//Membuat HTTP Web Server Object
const HTTPServer = HTTP.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server is running\n');
});

//Memulai HTTP Server

HTTPServer.listen(WsConstants.PORT, () => {
    console.log(`WebSocket Server is running on port ${WsConstants.PORT}`);
});

//Handle Custom Errors
WsConstants.CUSTOM_ERRORS.forEach((errorType) => {
    process.on(errorType, (error) => {
        console.error(`Custom Error: ${errorType}`, error);
        if (errorType === 'SIGINT') {
            process.exit(0);
        }else {
            process.exit(1);
        }
    });
});


// Handle WebSocket connections
HTTPServer.on('upgrade', (request, socket, head) => {

    const ConnectionHeader = request.headers['connection'].toLowerCase() === WsConstants.CONNECTION;
    const UpgradeHeader = request.headers['upgrade'].toLowerCase() === WsConstants.UPGRADE;
    const method = request.method;
    const allowedOrigin = WsMethods.isOriginAllowed(request.headers.origin);

    if (WsMethods.check(socket, ConnectionHeader, UpgradeHeader, method, allowedOrigin)) {
        WsMethods.upgradeConnection(request, socket, head);
    }
    
});
