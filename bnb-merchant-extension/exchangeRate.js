
// exchangeRate.js
const TARGET_API =
  "https://c2c-admin.binance.com/bapi/c2c/v1/private/c2c/merchant/get-exchange-rate-list";

const BALANCE_API = 
  "https://c2c-admin.binance.com/bapi/c2c/v1/private/c2c/asset/balance";

let CAPTURED_HEADERS = {};
export let GLOBAL_EXCHANGE_RATE = 0;   // VND / USD
export let GLOBAL_BALANCE = null;      // User balance data

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


// 3. Fetch Balance API
export async function fetchBalance() {
  const stored = await chrome.storage.local.get({ exchange_headers: null });
  const headers = stored.exchange_headers;

  if (!headers) {
    console.warn("⚠️ Exchange headers not captured yet!");
    return null;
  }

  try {
    const res = await fetch(BALANCE_API, {
      method: "GET",
      headers
    });

    const data = await res.json();

    if (!data?.data) {
      console.warn("⚠️ Cannot extract balance data:", data);
      return null;
    }

    // Extract USDT balance only
    const usdtBalance = data.data.find(item => item.asset === "USDT");

    if (!usdtBalance) {
      console.warn("⚠️ Cannot find USDT in balance data");
      return null;
    }

    // Store balance info
    GLOBAL_BALANCE = {
      free: parseFloat(usdtBalance.free),
      freeze: parseFloat(usdtBalance.freeze),
      order: parseFloat(usdtBalance.order),
      total: parseFloat(usdtBalance.free) + parseFloat(usdtBalance.freeze) + parseFloat(usdtBalance.order)
    };

    console.log("💰 Updated USDT Balance:", GLOBAL_BALANCE);

    return GLOBAL_BALANCE;
  } catch (err) {
    console.error("❌ Balance fetch error:", err);
    return null;
  }
}
