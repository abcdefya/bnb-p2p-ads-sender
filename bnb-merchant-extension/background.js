// background.js

// IMPORT MODULE EXCHANGE RATE
import {
  setupHeaderCapture,
  fetchExchangeRate,
  fetchBalance,
  GLOBAL_EXCHANGE_RATE,
  GLOBAL_BALANCE
} from "./exchangeRate.js";

import { BinanceConfig, BinanceClient } from "./binanceClient.js";
import { BINANCE_API_KEY, BINANCE_SECRET_KEY } from "./config.js";

console.log("🔥 Merchant Background Loaded");

// GLOBAL STORAGE FOR BUY/SELL ADS (tuỳ bạn dùng sau này)
let GLOBAL_ADS = {
  BUY: { tradeType: "BUY", ads: {} },
  SELL: { tradeType: "SELL", ads: {} }
};

// Khởi tạo Binance client từ config.js
const binanceConfig = new BinanceConfig(
  BINANCE_API_KEY,
  BINANCE_SECRET_KEY,
  "https://api.binance.com"
);

const binanceClient = new BinanceClient(binanceConfig);

// Default giống UPDATE_AD_PARAMS tối thiểu
const UPDATE_AD_DEFAULTS = {
  updateMode: "selective",
  priceType: 2,        // Always = 2
  rateFloatingRatio: 0 // Fixed = 0 (server yêu cầu, nhưng ta dùng priceFloatingRatio để set giá)
};

// Hàm gọi API update quảng cáo
async function updateAd({ advNo, priceFloatingRatio }) {
  const endpoint = "/sapi/v1/c2c/ads/update";

  const body = {
    ...UPDATE_AD_DEFAULTS,
    advNo,
    priceFloatingRatio
  };

  console.log("[bg] Calling updateAd with body:", body);

  const res = await binanceClient.request("POST", endpoint, body, {});
  console.log("[bg] updateAd result:", res);

  return res;
}

// Hàm GET chi tiết quảng cáo theo advNo (adsNo)
async function getAdDetailByNo(adsNo) {
  const endpoint = "/sapi/v1/c2c/ads/getDetailByNo";
  const params = { adsNo }; // adsNo ở query string

  // data = null vì endpoint chỉ cần query param
  const res = await binanceClient.request("POST", endpoint, null, params);
  console.log("[bg] getAdDetailByNo result:", res);
  return res;
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "quickEditSave") {
    (async () => {
      try {
        // ⏱️ Delay 500ms trước khi xử lý
        await new Promise((resolve) => setTimeout(resolve, 100));

        const { rowId, newPrice } = msg;
        console.log("[bg] quickEditSave received:", msg);

        if (!rowId) {
          sendResponse({
            ok: false,
            error: "NO_ROW_ID"
          });
          return;
        }

        if (!newPrice || Number.isNaN(newPrice)) {
          sendResponse({
            ok: false,
            error: "INVALID_NEW_PRICE",
            newPrice
          });
          return;
        }

        // Luôn gọi lại exchange rate mỗi lần Save
        const rate = await fetchExchangeRate();
        let marketPrice = rate || GLOBAL_EXCHANGE_RATE;

        if (!marketPrice || marketPrice <= 0) {
          console.warn(
            "[bg] marketPrice (GLOBAL_EXCHANGE_RATE) chưa có hoặc = 0"
          );
          sendResponse({
            ok: false,
            error: "NO_MARKET_PRICE",
            marketPrice
          });
          return;
        }

        // priceFloatingRatio = newPrice / marketPrice * 100, làm tròn 2 số thập phân
        const priceFloatingRatio = Number(
          ((newPrice * 100) / marketPrice).toFixed(2)
        );

        console.log("[bg] Calculated priceFloatingRatio:", {
          newPrice,
          marketPrice,
          priceFloatingRatio
        });

        const apiResult = await updateAd({
          advNo: rowId,
          priceFloatingRatio
        });

        // ⏱️ Delay thêm 100ms rồi gọi getDetailByNo để lấy giá mới
        await new Promise((resolve) => setTimeout(resolve, 50));

        const detailRes = await getAdDetailByNo(rowId);
        let latestPrice = null;
        if (detailRes && detailRes.success && detailRes.data?.price) {
          latestPrice = Number(detailRes.data.price);
        }

        console.log("[bg] Latest price from getDetailByNo:", {
          rowId,
          latestPrice,
          raw: detailRes
        });

        sendResponse({
          ok: true,
          advNo: rowId,
          inputPrice: newPrice,
          marketPrice,
          priceFloatingRatio,
          apiResult,
          latestPrice // số đã parseFloat từ API
        });
      } catch (err) {
        console.error("[bg] quickEditSave error:", err);
        sendResponse({
          ok: false,
          error: err?.message || "UNKNOWN_ERROR"
        });
      }
    })();

    return true; // keep sendResponse async
  }
});



// (Tuỳ chọn) WebSocket tới server local để debug / sync (nếu bạn cần)
// let ws = null;
// let retryTimeout = 2000;

// function connectWebSocket() {
//   console.log("🔌 Connecting to WS server...");
//   ws = new WebSocket("ws://localhost:3000");

//   ws.onopen = () => {
//     console.log("🟢 WS Connected");
//     retryTimeout = 2000;
//   };

//   ws.onmessage = (event) => {
//     try {
//       const data = JSON.parse(event.data);
//       console.log("📨 Message from WS:", data);
//       // tuỳ ý xử lý thêm, ví dụ cập nhật GLOBAL_ADS
//     } catch (e) {
//       console.log("📨 Raw message from WS:", event.data);
//     }
//   };

//   ws.onerror = (err) => {
//     console.error("❌ WS Error:", err);
//   };

//   ws.onclose = () => {
//     console.log("🔴 WS Disconnected — reconnecting...");
//     setTimeout(connectWebSocket, retryTimeout);
//     retryTimeout = Math.min(30000, retryTimeout * 2);
//   };
// }

// Khởi động các dịch vụ nền
// connectWebSocket();
setupHeaderCapture();

console.log("✨ Merchant Background Initialized.");
