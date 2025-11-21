console.log("🔥 Background Binance Producer Loaded");

let ws = null;
let retryTimeout = 2000;

function connectWebSocket() {
  console.log("🔌 Connecting WebSocket...");
  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    console.log("🟢 WS Connected");
    retryTimeout = 2000; // reset backoff
  };

  ws.onclose = () => {
    console.log("🔴 WS Closed — reconnecting...");
    setTimeout(connectWebSocket, retryTimeout);
    retryTimeout = Math.min(30000, retryTimeout * 2); // exponential backoff
  };

  ws.onerror = (err) => {
    console.error("⚠️ WS Error:", err);
    ws.close();
  };

  ws.onmessage = (msg) => {
    console.log("📥 WS Server says:", msg.data);
  };
}

connectWebSocket();


chrome.webRequest.onCompleted.addListener(
  async (details) => {
    try {
      const responseBody = await new Promise((resolve) => {
        chrome.webRequest.getSecurityInfo(details.requestId, { rawDER: true }, () => {
          // Tiếp tục đọc body
          fetch(details.url, { method: details.method })
            .then((r) => r.json())
            .then(resolve)
            .catch(() => resolve(null));
        });
      });

      if (!responseBody) return;

      console.log("📦 Binance Response:", responseBody);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "update", payload: responseBody }));
        console.log("📤 Sent to WS");
      } else {
        console.log("⚠️ WS not ready");
      }
    } catch (err) {
      console.error("❌ Error parsing Binance response:", err);
    }
  },
  {
    urls: ["*://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search*"],
  }
);
