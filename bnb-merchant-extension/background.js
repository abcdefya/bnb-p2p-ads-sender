
// IMPORT MODULE EXCHANGE RATE
import {
  setupHeaderCapture,
  fetchExchangeRate,
  GLOBAL_EXCHANGE_RATE
} from "./exchangeRate.js";

console.log("🔥 Merchant Background Loaded");

// GLOBAL STORAGE FOR BUY/SELL ADS
let GLOBAL_ADS = {
  BUY: { TradeType: "BUY", Ads: {} },
  SELL: { TradeType: "SELL", Ads: {} }
};


// CONNECT TO WEBSOCKET SERVER
let ws = null;
let retryTimeout = 2000;

function connectWebSocket() {
  console.log("🔌 Connecting to WS server...");
  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    console.log("🟢 WS Connected");
    retryTimeout = 2000;
  };

  ws.onclose = () => {
    console.log("🔴 WS Disconnected — reconnecting...");
    setTimeout(connectWebSocket, retryTimeout);
    retryTimeout = Math.min(30000, retryTimeout * 2);
  };

  ws.onerror = (err) => {
    console.error("⚠️ WS Error:", err);
    ws.close();
  };


  // WS RECEIVES NEW BUY/SELL DATA
  ws.onmessage = async (msg) => {
    let payload;
    try {
      payload = JSON.parse(msg.data);
    } catch (err) {
      console.error("❌ WS JSON parse error:", err);
      return;
    }

    const tradeType = payload.tradeType;
    const ads = payload.ads;

    if (!tradeType || !Array.isArray(ads)) {
      console.warn("⚠️ WS payload invalid:", payload);
      return;
    }

    // STRUCTURE: Merchant → Price
    const adsObject = {};
    for (const item of ads) {
      adsObject[item.merchant] = item.price;
    }

    GLOBAL_ADS[tradeType] = {
      TradeType: tradeType,
      Ads: adsObject
    };

    // Log BUY/SELL ADS
    console.log(`🔥 UPDATED GLOBAL ${tradeType}:`);
    Object.entries(GLOBAL_ADS[tradeType].Ads).forEach(([merchant, price]) => {
      console.log(`${merchant} - ${price}`);
    });


    // FETCH NEW EXCHANGE RATE (AUTO)
    await fetchExchangeRate();

    console.log("💰 GLOBAL_EXCHANGE_RATE (VND/USDT):", GLOBAL_EXCHANGE_RATE);
  };
}

connectWebSocket();

// ENABLE HEADER CAPTURE FOR RATE API
setupHeaderCapture();

console.log("✨ Merchant Background Initialized.");
