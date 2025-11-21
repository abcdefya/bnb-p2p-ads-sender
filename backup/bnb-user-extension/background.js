console.log("🔥 Extension loaded.");

// Gắn debugger khi tab load xong
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete") return;
  if (!tab.url.includes("p2p.binance.com")) return;

  console.log("📌 Attaching debugger to:", tabId);

  chrome.debugger.attach({ tabId }, "1.3", () => {
    console.log("✅ Debugger attached.");

    chrome.debugger.sendCommand({ tabId }, "Network.enable");
  });
});

// Bắt sự kiện network
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (method !== "Network.responseReceived") return;

  const url = params.response.url;
  if (!url.includes("/bapi/c2c/v2/friendly/c2c/adv/search")) return;

  console.log("🎯 API detected:", url);

  const requestId = params.requestId;

  // Lấy body
  chrome.debugger.sendCommand(
    source,
    "Network.getResponseBody",
    { requestId },
    (response) => {
      console.log("📦 API RESPONSE BODY:", response);
    }
  );
});
