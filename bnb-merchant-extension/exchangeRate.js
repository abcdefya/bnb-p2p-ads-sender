
// exchangeRate.js
const TARGET_API =
  "https://c2c-admin.binance.com/bapi/c2c/v1/private/c2c/merchant/get-exchange-rate-list";

let CAPTURED_HEADERS = {};
export let GLOBAL_EXCHANGE_RATE = 0;   // VND / USD

// 1. Capture headers once
export function setupHeaderCapture() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (!details.url.startsWith(TARGET_API)) return;

      const headerMap = {};

      for (const h of details.requestHeaders) {
        const key = h.name.toLowerCase();

        if (
          key === "cookie" ||
          key === "csrftoken" ||
          key === "device-info" ||
          key === "fvideo-id" ||
          key === "fvideo-token" ||
          key === "bnc-uuid" ||
          key === "content-type" ||
          key === "c2ctype" ||
          key === "clienttype" ||
          key === "accept" ||
          key === "accept-language" ||
          key === "user-agent"
        ) {
          headerMap[h.name] = h.value;
        }
      }

      // console.log("Captured Exchange Rate Headers:", headerMap);

      CAPTURED_HEADERS = headerMap;
      chrome.storage.local.set({ exchange_headers: headerMap });
    },
    { urls: ["https://c2c-admin.binance.com/*"] },
    ["requestHeaders"]
  );
}


// 2. Fetch Exchange Rate API
export async function fetchExchangeRate() {
  const stored = await chrome.storage.local.get({ exchange_headers: null });
  const headers = stored.exchange_headers;

  if (!headers) {
    console.warn("⚠️ Exchange headers not captured yet!");
    return null;
  }

  try {
    const res = await fetch(TARGET_API, {
      method: "GET",
      headers
    });

    const data = await res.json();

    const vndRow = data?.data?.find(
      row => row.fiatCurrency === "VND" && row.againstCurrency === "USD"
    );

    if (!vndRow) {
      console.warn("⚠️ Cannot extract VND/USD rate:", data);
      return null;
    }

    const rate = parseFloat(vndRow.customExRate || vndRow.exchangeRate);

    GLOBAL_EXCHANGE_RATE = rate;

    console.log("💰 Updated Exchange Rate (VND/USDT):", GLOBAL_EXCHANGE_RATE);

    return rate;
  } catch (err) {
    console.error("❌ Exchange rate fetch error:", err);
    return null;
  }
}


