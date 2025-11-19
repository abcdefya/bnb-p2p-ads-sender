const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });
let sharedData = { ads: [] }; // Lưu data bảng quảng cáo từ Binance API

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify(sharedData)); // Gửi data hiện tại cho client mới (merchant)

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        sharedData = data.payload; // Update từ user-extension
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(sharedData)); // Broadcast cho merchant
          }
        });
      }
    } catch (err) {
      console.error('JSON parse error:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:3000');
