console.log("🔥 Binance Sniffer Background Loaded");

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete") return;
  if (!tab.url.includes("p2p.binance.com")) return;

  console.log("📌 Attaching debugger:", tabId);

  chrome.debugger.attach({ tabId }, "1.3", () => {
    chrome.debugger.sendCommand({ tabId }, "Network.enable");
  });
});

// Listen all network events
chrome.debugger.onEvent.addListener((debuggee, method, params) => {
  if (method !== "Network.responseReceived") return;

  const url = params.response.url;
  if (!url.includes("/bapi/c2c/v2/friendly/c2c/adv/search")) return;

  const reqId = params.requestId;
  console.log("🎯 ADV SEARCH:", url);

  chrome.debugger.sendCommand(
    debuggee,
    "Network.getResponseBody",
    { requestId: reqId },
    (body) => {
      console.log("📦 BODY:", body);
    }
  );
});

// =========================
// 🔌 WebSocket Client
// =========================
let ws = null;
let retryTimeout = 2000;

function connectWebSocket() {
  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    console.log("🟢 WS Connected");
    retryTimeout = 2000; // reset backoff
  };

  ws.onclose = () => {
    console.log("🔴 WS Disconnected. Reconnecting...");
    setTimeout(connectWebSocket, retryTimeout);
    retryTimeout = Math.min(30000, retryTimeout * 2); // exponential backoff
  };

  ws.onerror = (err) => {
    console.log("⚠️ WS Error:", err);
    ws.close();
  };
}

connectWebSocket();


// ========================================================================
// ⬇️  Hook vào chỗ bạn đã bắt được response Binance trong Network.getResponseBody
// ========================================================================
chrome.debugger.onEvent.addListener((debuggee, method, params) => {
  if (method !== "Network.responseReceived") return;

  const url = params.response.url;
  if (!url.includes("/bapi/c2c/v2/friendly/c2c/adv/search")) return;

  const reqId = params.requestId;
  console.log("🎯 ADV SEARCH:", url);

  chrome.debugger.sendCommand(
    debuggee,
    "Network.getResponseBody",
    { requestId: reqId },
    (body) => {
      console.log("📦 BODY:", body);

      try {
        const json = JSON.parse(body.body);

        // 🔥 Gửi sang WebSocket server
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "update",
            payload: json
          }));
          console.log("📤 Sent to WS:", json);
        } else {
          console.log("⚠️ WS not ready, cannot send");
        }

      } catch (e) {
        console.log("❌ JSON parse error:", e);
      }
    }
  );
});
