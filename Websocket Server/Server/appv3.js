const HTTPS = require('https');
const fs = require('fs');

//Import Custom Library
const WsConstants = require('./CustomLib/WebsocketConstants');
const WsMethods = require('./CustomLib/WebsocketMethods');

//Ambil Sertifikat SSL
const ServerCert = fs.readFileSync('cert.crt');
const ServerKey = fs.readFileSync('cert.key');

// # LANGKAH 1 
//Membuat HTTP Web Server Object
const HTTPSServer = HTTPS.createServer({key: ServerKey, cert : ServerCert}, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server is running\n');
});

// # LANGKAH 2
//Memulai HTTP Server
HTTPSServer.listen(WsConstants.PORT, () => {
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

// # LANGKAH 3
// Ketika Ada Permintaan Dengan Headers Upgrade, Server Akan Beralih Ke WebSocket
HTTPSServer.on('upgrade', (request, socket, head) => {

    const ConnectionHeader = request.headers['connection'].toLowerCase() === WsConstants.CONNECTION;
    const UpgradeHeader = request.headers['upgrade'].toLowerCase() === WsConstants.UPGRADE;
    const method = request.method;
    const allowedOrigin = WsMethods.isOriginAllowed(request.headers.origin);

    if (WsMethods.check(socket, ConnectionHeader, UpgradeHeader, method, allowedOrigin)) {
        console.log('Upgrading to WebSocket connection...');
        WsMethods.upgradeConnection(request, socket, head);
    }
    
});

// # LANGKAH 4 DAN SETERUSNYA ADA DI WSMETHODS (Server/CustomLib/WebsocketMethods.js) PADA FUNGSI "UpgradeConnection"
// ATAU PENCET CTRL + KLIK KIRI PADA WSMETHODS 
