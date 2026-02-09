module.exports = {
  PORT: process.env.PORT || 4430,

  //CUSTOM ERROR
  CUSTOM_ERRORS: [
    'uncaughtException',
    'unhandledRejection',
    'SIGINT',
  ],

  //CEK UPGRADE
  METHOD: "GET",
  VERSION: '13',
  CONNECTION: 'upgrade',
  UPGRADE: 'websocket',
  
  //CEK ORIGIN
  ALLOWED_ORIGINS: [
    'https://localhost:5500',
    'https://127.0.0.1:5500',
    'null',
  ],

  // GLOBALLY UNIQUE IDENTIFIER (GUID) UNTUK MENGHASILKAN SERVER KEY
  GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',

  // ATURAN FRAME WEBSOCKET
  MIN_FRAME_SIZE : 2, // Ukuran minimum frame
  MAX_LENGTH: 4,
  FRAME: {
    FIN: 0x80, // Bit FIN
    RSV1: 0x40, // Bit RSV1
    RSV2: 0x20, // Bit RSV2
    RSV3: 0x10, // Bit RSV3
    OPCODE: 0x0F, // Opcode
    MASK: 0x80, // Bit Mask
    PAYLOAD_LENGTH: 0x7F, // Payload length
  },

  // JENIS UKURAN PAYLOAD
  MEDIUM_DATA_FLAG: 126, // Ukuran payload medium
  LARGE_DATA_FLAG: 127, // Ukuran payload besar
  MEDIUM_SIZE_CONSUMPSION: 2, // Ukuran konsumsi untuk medium data
  LARGE_SIZE_CONSUMPSION: 8, // Ukuran konsumsi untuk large data
  SMALL_DATA_SIZE : 125, // Ukuran data kecil
  MEDIUM_DATA_SIZE : 65535, // Ukuran data medium

  // OPCODE WEBSOCKET
  OPCODE: {
    CONTINUATION: 0x0,
    TEXT: 0x1,
    BINARY: 0x2,
    CLOSE: 0x8,
    PING: 0x9,
    PONG: 0xA,
  },

}