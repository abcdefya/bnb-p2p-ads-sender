const WebSocket = require('ws');

// Tạo WebSocket server trên port 3000 (bạn có thể thay đổi)
const wss = new WebSocket.Server({ port: 3000 });

// Lưu trữ data chia sẻ (ví dụ: JSON bảng quảng cáo)
let sharedData = { ads: [] }; // Ban đầu rỗng, sẽ update từ client user

// Khi có client kết nối
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Gửi data hiện tại cho client mới kết nối (merchant có thể nhận ngay)
  ws.send(JSON.stringify(sharedData));

  // Xử lý message từ client
  ws.on('message', (message) => {
    console.log('Received:', message.toString());

    // Giả sử message là JSON từ browser user (quyền write)
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        sharedData = data.payload; // Update data chia sẻ
        // Broadcast đến tất cả clients (merchant nhận realtime)
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(sharedData));
          }
        });
      }
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  });

  // Khi client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:3000');