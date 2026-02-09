const WsConstants = require('./WebsocketConstants');
const crypto = require('crypto');

// Mendefinisikan Beberapa Variabel Looping Data
const GET_INFO = 1;
const GET_LENGTH = 2;
const GET_MASK_KEY = 3;
const GET_PAYLOAD = 4;
const SEND_ECHO = 5;
const GET_CLOSE_INFO = 6;

//MENDEFINISIKAN ORIGIN YANG DIIZINKAN
function isOriginAllowed(origin) {
    return WsConstants.ALLOWED_ORIGINS.includes(origin);

}

//MENGECEK APAKAH KONEKSI SESUAI DENGAN PROTOKOL RFC6455
function check(socket, upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck) {
    if (upgradeHeaderCheck && connectionHeaderCheck && methodCheck && originCheck) {
        return true;
    } else {
        const message = "400 bad request. The HTTP headers do not comply with the RFC6455 spec."; // PESAN CUSTOM
        const messageLength = message.length;
        const response = `HTTP/1.1 400 Bad Request\r\n` + // TIAP HEADER HARUS DIAKHIRI '\r\n' UNTUK MENYESUAIKAN PROTOKOL HTTP
            `Content-Type: text/plain\r\n` +
            `Content-Length: ${messageLength}\r\n` +
            `\r\n` +
            message;
        socket.write(response);
        socket.end();
    };
};

//JIKA PENGECEKAN BERHASIL, MAKA KONEKSI DIUPGRADE KE WEBSOCKET
//DAN KONEKSI WEBSOCKET AKAN DIMULAI
function upgradeConnection(req, socket, head) {

    // AMBIL KUNCI WEBSOCKET DARI HEADER
    const clientKey = req.headers['sec-websocket-key'];

    // BUAT HEADER UPGRADE SESUAI RFC6455
    // DAN KIRIMKAN KE KLIEN UNTUK MENGONFIRMASI
    const headers = createUpgradeHeaders(clientKey);
    socket.write(headers);

    // JIKA KONEKSI BERHASIL DIUPGRADE, MAKA KLIEN DAN SERVER DAPAT MENGIRIMKAN PESAN
    startWebSocketConnection(socket);
};

//MEMBUAT UPGRADE HEADERS SESUAI RFC6455
function createUpgradeHeaders(clientKey) {

    let serverKey = generateServerKey(clientKey);
    let headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${serverKey}`
    ];
    const upgradeHeaders = headers.join('\r\n') + '\r\n\r\n'; // MENGGUNAKAN JOIN KARENA PROTOKOL HTTP MENGHARUSKAN PENGGUNAAN '\r\n' PADA AKHIR HEADER AGAR MUDAH DIBACA
    return upgradeHeaders;
};

// MENGHASILKAN SERVER KEY DARI CLIENT KEY
// PROSES INI MENGGUNAKAN HASH SHA1 DAN DIKODEKAN
// KE DALAM BASE64 SESUAI DENGAN PROTOKOL RFC6455
function generateServerKey(clientKey) {

    // LANGKAH PERTAMA ADALAH MENGGABUNGKAN (CONCATENATE) CLIENT KEY DENGAN GUID
    let data = clientKey + WsConstants.GUID;

    // LANGKAH KEDUA ADALAH MENGHASILKAN HASH SHA1 DARI DATA
    const hash = crypto.createHash('sha1');
    hash.update(data);

    // LANGKAH TERAKHIR ADALAH MENGKODEKAN HASIL HASH KE DALAM BASE64
    let serverKey = hash.digest('base64');
    return serverKey;
};

function startWebSocketConnection(socket) {
    console.log(`Koneksi websocket dimulai oleh klien dengan port: ${socket.remotePort}`);

    const receiver = new WebSocketReceiver(socket);

    socket.on('data', (DataChunk) => {

        receiver.processBuffer(DataChunk, socket);
        //
    });

    socket.on('end', () => {
        console.log('tidak ada lagi data yang diterima dari klien, koneksi ditutup.');
    });

};

class WebSocketReceiver {

    // Mendefinisikan konstruktor untuk menerima socket
    constructor(socket) {
        this.socket = socket;
    }

    // Mendefinisikan variabel untuk menyimpan potongan data yang diterima
    BufferArray = []; // Array untuk menyimpan potongan data yang diterima
    BufferBytesLength = 0; // Total panjang data chunk yang diterima
    TaskLoop = false; // Menandakan apakah task loop sedang berjalan
    Task = GET_INFO; // Menyimpan informasi tentang task yang sedang berjalan
    FIN = false; // Menandakan apakah frame sudah selesai
    Opcode = null; // Menyimpan opcode dari frame yang diterima
    Masked = false; // Menandakan apakah frame sudah dimask
    InitialPayloadSizeIndicator = false; // Menandakan apakah ukuran payload awal sudah ditentukan
    FramePayloadLength = 0; // Menyimpan panjang payload dari frame yang diterima
    MaxPayload = 1024 * 1024; // Batas maksimum payload yang diizinkan (1 MB)
    TotalPayloadLength = 0; // Menyimpan total panjang payload yang diterima
    Mask = Buffer.alloc(WsConstants.MAX_LENGTH); // Buffer untuk menyimpan kunci mask
    FramesReceived = 0; // Menyimpan jumlah frame yang diterima
    Fragment = []; // Array untuk menyimpan fragmen data yang diterima

    processBuffer(DataChunk) {
        this.BufferArray.push(DataChunk); // Ngepush potongan data yang diterima ke array
        this.BufferBytesLength += DataChunk.length; // Menambahkan panjang data chunk sesuai dengan panjang data chunk yang diterima
        console.log("Chunk received of size: " + DataChunk.length);
        this.StartTaskLoop(); // Memulai task loop untuk memproses data yang diterima
    };

    StartTaskLoop() {
        this.TaskLoop = true; // Menandakan bahwa task loop sedang berjalan
        while (this.TaskLoop) {
            switch (this.Task) {
                case GET_INFO:
                    this.GetInfo();
                    break;
                case GET_LENGTH:
                    this.GetLength();
                    break;
                case GET_MASK_KEY:
                    this.GetMaskKey();
                    break;
                case GET_PAYLOAD:
                    this.GetPayload();
                    break;
                case SEND_ECHO:
                    this.SendEcho();
                    break;
                case GET_CLOSE_INFO:
                    this.GetCLoseInfo();
                    break;
            }
        }
    }

    GetInfo() {

        if (this.BufferBytesLength < WsConstants.MIN_FRAME_SIZE) {
            this.TaskLoop = false;
            return;
        };

        const InfoBuffer = this.ConsumeHeader(WsConstants.MIN_FRAME_SIZE); // Mengambil header dari buffer
        const FirstByte = InfoBuffer[0]; // Mengambil byte pertama dari header
        const SecondByte = InfoBuffer[1]; // Mengambil byte kedua dari header

        // Ekstrak Payload Websocket Frame
        this.FIN = (FirstByte & WsConstants.FRAME.FIN) === WsConstants.FRAME.FIN; // Mengecek apakah frame sudah selesai
        this.Opcode = FirstByte & WsConstants.FRAME.OPCODE; // Mengambil opcode dari frame
        this.Masked = (SecondByte & WsConstants.FRAME.MASK) === WsConstants.FRAME.MASK; // Mengecek apakah frame sudah dimask
        this.InitialPayloadSizeIndicator = SecondByte & WsConstants.FRAME.PAYLOAD_LENGTH; // Mengambil indikator ukuran payload awal

        if (!this.Masked) {
            this.SendClose(1002, 'WebSocket frame tidak dimask.'); // Mengirim close frame jika frame tidak dimask
        }

        if ([WsConstants.OPCODE.PING, WsConstants.OPCODE.PONG].includes(this.Opcode)) {
            this.SendClose(1003, 'Ping/Pong frame tidak diizinkan dalam koneksi ini.'); // Mengirim close frame jika opcode adalah PING atau PONG
            return;
        }

        this.Task = GET_LENGTH; // Mengubah task menjadi GET_LENGTH untuk mengambil panjang payload

    }

    ConsumeHeader(n) {
        this.BufferBytesLength -= n; // Mengurangi panjang data chunk sesuai dengan panjang header yang diambil

        if (n === this.BufferArray[0].length) {
            return this.BufferArray.shift(); // Mengambil potongan data pertama dari array jika panjang header sama dengan panjang data chunk
        }

        if (n < this.BufferArray[0].length) {
            const InfoBuffer = this.BufferArray[0]
            this.BufferArray[0] = this.BufferArray[0].slice(n);
            return InfoBuffer.slice(0, n);
        } else {
            throw new Error('Data Tidak Bisa Diekstrak Dari Websocket Frame Melebihi Ukuran Frame Yang Seharusnya');
        }
    }

    GetLength() {
        switch (this.InitialPayloadSizeIndicator) {
            case WsConstants.MEDIUM_DATA_FLAG:
                let MediumPayloadLengthBuffer = this.ConsumeHeader(WsConstants.MEDIUM_SIZE_CONSUMPSION); // Mengambil panjang payload medium
                this.FramePayloadLength = MediumPayloadLengthBuffer.readUInt16BE(); // Membaca panjang payload medium dari buffer
                this.ProcessLength(); // Memproses panjang payload medium
                break;
            case WsConstants.LARGE_DATA_FLAG:
                let LargePayloadLengthBuffer = this.ConsumeHeader(WsConstants.LARGE_SIZE_CONSUMPSION); // Mengambil panjang payload besar
                let bufBigInt = LargePayloadLengthBuffer.readBigUInt64BE(); // Membaca panjang payload besar dari buffer
                this.FramePayloadLength = Number(bufBigInt); // Mengubah panjang payload besar menjadi BigInt
                this.ProcessLength(); // Memproses panjang payload besar                
                break;
            default:
                this.FramePayloadLength = this.InitialPayloadSizeIndicator; // Mengambil panjang payload dari indikator ukuran payload awal
                this.ProcessLength(); // Memproses panjang payload
                break; // Jika indikator ukuran payload tidak sesuai, keluar dari switch
        }
    }

    ProcessLength() {
        this.TotalPayloadLength += this.FramePayloadLength; // Menambahkan panjang payload ke total panjang payload

        if (this.TotalPayloadLength > this.MaxPayload) {
            this.SendClose(1009, 'Payload terlalu besar.'); // Mengirim close frame jika total panjang payload melebihi batas maksimum
            return;
        }

        this.Task = GET_MASK_KEY; // Mengubah task menjadi GET_MASK_KEY untuk mengambil kunci mask
    }

    GetMaskKey() {
        this.Mask = this.ConsumeHeader(WsConstants.MAX_LENGTH); // Mengambil kunci mask dari buffer
        this.Task = GET_PAYLOAD; // Mengubah task menjadi GET_PAYLOAD untuk mengambil payload
    }

    GetPayload() {

        if (this.BufferBytesLength < this.FramePayloadLength) {
            this.TaskLoop = false; // Menghentikan task loop jika panjang data chunk kurang dari panjang payload
            return; // Keluar dari fungsi jika panjang data chunk kurang dari panjang payload
        }

        this.FramesReceived++; // Menambahkan jumlah frame yang diterima
        let FullMaskedPayloadBuffer = this.ConsumePayload(this.FramePayloadLength); // Mengambil payload lengkap dari buffer

        let FullUnmaskedPayloadBuffer = UnmaskedPayload(FullMaskedPayloadBuffer, this.Mask); // Menghapus mask dari payload

        if (FullUnmaskedPayloadBuffer.length) {
            this.Fragment.push(FullUnmaskedPayloadBuffer); // Menyimpan payload yang telah dihapus mask-nya ke dalam array fragmen
        }

        if (this.Opcode === WsConstants.OPCODE.CLOSE) {
            this.Task = GET_CLOSE_INFO;
            return;
        }

        if (!this.FIN) {
            this.Task = GET_INFO; // Jika frame belum selesai, kembali ke task GET_INFO untuk mengambil informasi frame berikutnya

        } else {
            console.log(`Frame diterima: ${this.FramesReceived}, Payload: ${FullUnmaskedPayloadBuffer.toString()}`); // Menampilkan informasi frame yang diterima
            console.log(`Total Payload Length: ${this.TotalPayloadLength}`); // Menampilkan total panjang payload yang diterima
            this.Task = SEND_ECHO; // Mengubah task menjadi SEND_ECHO untuk mengirimkan echo ke klien

        }
    }

    ConsumePayload(n) {
        this.BufferBytesLength -= n; // Mengurangi panjang data chunk sesuai dengan panjang payload yang diambil

        const PayloadBuffer = Buffer.alloc(n); // Membuat buffer untuk menyimpan payload
        let TotalBytesRead = 0; // Menyimpan total byte yang dibaca

        while (TotalBytesRead < n) {
            const Buf = this.BufferArray[0]; // Mengambil potongan data pertama dari array
            const BytesToRead = Math.min(n - TotalBytesRead, Buf.length); // Menghitung jumlah byte yang akan dibaca 

            Buf.copy(PayloadBuffer, TotalBytesRead, 0, BytesToRead); // Menyalin potongan data ke buffer payload
            TotalBytesRead += BytesToRead; // Menambahkan jumlah byte yang dibaca

            if (BytesToRead < Buf.length) {
                this.BufferArray[0] = Buf.slice[BytesToRead] // Menghapus potongan data pertama dari array jika panjangnya sama dengan jumlah byte yang dibaca
            } else {
                this.BufferArray.shift(); // Menghapus potongan data pertama dari array jika panjangnya lebih besar dari jumlah byte yang dibaca
            }
        }

        return PayloadBuffer; // Mengembalikan buffer payload yang telah diambil
    }

    SendEcho() {

        const FullMessage = Buffer.concat(this.Fragment); // Menggabungkan semua fragmen payload menjadi satu buffer

        let PayloadLength = FullMessage.length; // Mengambil panjang payload

        let AdditionalPayloadSizeIndicator = null;

        switch (true) {
            case PayloadLength < WsConstants.MEDIUM_DATA_FLAG:
                AdditionalPayloadSizeIndicator = 0; // Jika panjang payload kurang dari ukuran medium, gunakan panjang payload sebagai indikator ukuran tambahan
                break;
            case PayloadLength <= WsConstants.MEDIUM_DATA_SIZE:
                AdditionalPayloadSizeIndicator = WsConstants.MEDIUM_SIZE_CONSUMPSION; // Jika panjang payload kurang dari atau sama dengan 65535, gunakan ukuran medium sebagai indikator ukuran tambahan
                break;
            default:
                AdditionalPayloadSizeIndicator = WsConstants.LARGE_SIZE_CONSUMPSION; // Jika panjang payload lebih besar dari 65535, gunakan ukuran besar sebagai indikator ukuran tambahan
                break;
        }

        const Frame = Buffer.alloc(WsConstants.MIN_FRAME_SIZE + AdditionalPayloadSizeIndicator + PayloadLength); // Membuat buffer untuk frame yang akan dikirim
        let FIN = 0x01;
        let RSV1 = 0x00;
        let RSV2 = 0x00;
        let RSV3 = 0x00;
        let Opcode = WsConstants.OPCODE.BINARY; // Menggunakan opcode TEXT untuk mengirim pesan teks
        let Mask = 0x01; // Menggunakan mask untuk mengamankan pesan

        let FirstByte = FIN << 7 | RSV1 << 6 | RSV2 << 5 | RSV3 << 4 | Opcode; // Menggabungkan bit FIN, RSV1, RSV2, RSV3, dan Opcode menjadi satu byte
        Frame[0] = FirstByte; // Menyimpan byte pertama ke dalam frame
        let MaskingBit = 0x00;

        if (PayloadLength < WsConstants.MEDIUM_DATA_FLAG) {
            Frame[1] = MaskingBit | PayloadLength; // Menyimpan panjang payload ke dalam byte kedua jika panjang payload kurang dari ukuran medium
        } else if (PayloadLength <= WsConstants.MEDIUM_DATA_SIZE) {
            Frame[1] = MaskingBit | WsConstants.MEDIUM_DATA_FLAG; // Menyimpan ukuran medium ke dalam byte kedua jika panjang payload kurang dari atau sama dengan 65535
            Frame.writeUInt16BE(PayloadLength, WsConstants.MIN_FRAME_SIZE); // Menyimpan panjang payload ke dalam frame pada posisi yang sesuai
        } else {
            Frame[1] = MaskingBit | WsConstants.LARGE_DATA_FLAG; // Menyimpan ukuran besar ke dalam byte kedua jika panjang payload lebih besar dari 65535  
            Frame.writeBigUInt64BE(BigInt(PayloadLength), WsConstants.MIN_FRAME_SIZE); // Menyimpan panjang payload ke dalam frame pada posisi yang sesuai
        }

        const MessageStartOffset = WsConstants.MIN_FRAME_SIZE + AdditionalPayloadSizeIndicator; // Menghitung offset awal pesan dalam frame
        FullMessage.copy(Frame, MessageStartOffset, 0, PayloadLength); // Menyalin payload ke dalam frame pada posisi yang sesuai

        this.socket.write(Frame); // Mengirim frame ke klien
        this.reset();

    }

    reset() {
        this.BufferArray = [];
        this.BufferBytesLength = 0;
        this.TaskLoop = false;
        this.Task = GET_INFO;
        this.FIN = false;
        this.Opcode = null;
        this.Masked = false;
        this.InitialPayloadSizeIndicator = false;
        this.FramePayloadLength = 0;
        this.MaxPayload = 1024 * 1024;
        this.TotalPayloadLength = 0;
        this.Mask = Buffer.alloc(WsConstants.MAX_LENGTH);
        this.FramesReceived = 0;
        this.Fragment = [];
    }

    GetCLoseInfo() {
        let CloseFramePayload = this.Fragment[0]; // Mengambil payload dari fragmen pertama

        if (!CloseFramePayload) {
            this.SendClose(1008, 'Next Time, Please Set The Status Code'); // Jika tidak ada payload, kirim close frame dengan kode 1005
            return;
        }

        let CloseCode = CloseFramePayload.readUInt16BE(0); // Membaca kode close dari payload
        let CloseReason = CloseFramePayload.slice(2).toString('utf8'); //
        console.log(`Close frame diterima dengan kode: ${CloseCode}, Alasan: ${CloseReason}`); // Menampilkan informasi close frame yang diterima

        let ServerResponse = "Maaf, Buka Kembali Koneksi Websocket Anda Untuk Melanjutkan";

        this.SendClose(CloseCode, ServerResponse); // Mengirim close frame ke klien dengan kode dan alasan yang sesuai
    }

    SendClose(CloseCode, CloseReason) {
        let CLosureCode = (typeof CloseCode === 'number') ? CloseCode : 1000; // Menggunakan kode close yang diberikan atau default ke 1000
        let CLosureReason = (typeof CloseReason === 'string') ? CloseReason : 'Normal Closure'; // Menggunakan alasan close yang diberikan atau default ke 'Normal Closure'

        const ClosureReasonBuffer = Buffer.from(CLosureReason, 'utf8'); // Mengubah alasan close menjadi buffer
        const ClosureRasonFrame = ClosureReasonBuffer.length; // Menghitung panjang frame close

        const CloseFramePayload = Buffer.alloc(2 + ClosureRasonFrame); // Membuat buffer untuk frame close

        CloseFramePayload.writeUInt16BE(CLosureCode, 0); // Menyimpan kode close ke dalam frame

        ClosureReasonBuffer.copy(CloseFramePayload, 2); // Menyalin alasan close ke dalam frame

        const FirstByte = 0b10000000 | 0b00000000 | 0b00001000
        const SecondByte = CloseFramePayload.length;
        const MandatoryCLoseHeaders = Buffer.from([FirstByte, SecondByte]); // Membuat header close frame
        const CLoseFrame = Buffer.concat([MandatoryCLoseHeaders, CloseFramePayload]); // Menggabungkan header dan payload close frame

        this.socket.write(CLoseFrame); // Mengirim close frame ke klien
        this.socket.end(); // Menutup koneksi socket
        this.reset(); // Mereset semua variabel untuk memulai koneksi baru


    }

}

function UnmaskedPayload(PayloadBuffer, MaskKey) {
    for (let i = 0; i < PayloadBuffer.length; i++) {
        PayloadBuffer[i] = PayloadBuffer[i] ^ MaskKey[i % WsConstants.MAX_LENGTH]; // Menggunakan XOR untuk menghapus mask dari payload
    }
    return PayloadBuffer; // Mengembalikan payload yang telah dihapus mask-nya
}

module.exports = {
    isOriginAllowed,
    check,
    upgradeConnection,
    createUpgradeHeaders,
    startWebSocketConnection,
}