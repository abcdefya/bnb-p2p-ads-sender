chrome.runtime.onStartup.addListener(startNativeHost);
chrome.runtime.onInstalled.addListener(startNativeHost);

function startNativeHost() {
  const hostName = 'com.example.binancehost';
  const port = chrome.runtime.connectNative(hostName);
  port.postMessage({ action: 'start_server' });

  port.onMessage.addListener((response) => console.log('Native response:', response));
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) console.error('Native error:', chrome.runtime.lastError.message);
    console.log('Native disconnected');
  });
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.url === 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search' && details.method === 'POST') {
      console.log('Request Headers:');
      details.requestHeaders.forEach(h => console.log(`${h.name}: ${h.value}`));
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["*://p2p.binance.com/*"] },
  ['blocking', 'requestHeaders', 'extraHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.url === 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search' && details.method === 'POST') {
      console.log('Response Headers:');
      details.responseHeaders.forEach(h => console.log(`${h.name}: ${h.value}`));
    }
    return { responseHeaders: details.responseHeaders };
  },
  { urls: ["*://p2p.binance.com/*"] },
  ['blocking', 'responseHeaders', 'extraHeaders']
);