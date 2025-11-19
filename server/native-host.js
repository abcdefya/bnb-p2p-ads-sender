const child_process = require('child_process');

let serverProcess;

function startWebSocketServer() {
  if (serverProcess) return; // Đã chạy thì skip
  serverProcess = child_process.fork('./websocket-server.js');
  console.log('WebSocket server started');
}

// Đọc message từ stdin (từ extension)
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const length = chunk.readUInt32LE(0);
    const message = JSON.parse(chunk.slice(4, 4 + length).toString());
    console.log('Received from extension:', message);
    if (message.action === 'start_server') {
      startWebSocketServer();
      sendResponse({ status: 'server_started' });
    }
  }
});

// Gửi response về stdout (cho extension)
function sendResponse(response) {
  const json = JSON.stringify(response);
  const buffer = Buffer.alloc(4 + json.length);
  buffer.writeUInt32LE(json.length, 0);
  buffer.write(json, 4);
  process.stdout.write(buffer);
}

console.log('Native host running');
