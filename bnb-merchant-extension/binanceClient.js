// binanceClient.js

export class BinanceConfig {
  constructor(api_key, secret_key, base_url = "https://api.binance.com") {
    this.api_key = api_key;
    this.secret_key = secret_key;
    this.base_url = base_url;
  }
}

export class BinanceClient {
  constructor(config) {
    this.api_key = config.api_key;
    this.secret = config.secret_key;
    this.base_url = config.base_url;

    // Tương đương session.headers trong Python
    this.headers = {
      "Content-Type": "application/json;charset=utf-8",
      "X-MBX-APIKEY": this.api_key,
      "clientType": "WEB"
    };

    this.cryptoKey = null; // cache WebCrypto key
  }

  // Timestamp giống _timestamp() bên Python
  _timestamp() {
    return Date.now();
  }

  // Import secret vào WebCrypto HMAC-SHA256
  async _loadKey() {
    if (this.cryptoKey) return this.cryptoKey;

    this.cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    return this.cryptoKey;
  }

  // Ký query string giống _sign() bên Python
  async _sign(payload) {
    const query = new URLSearchParams(payload).toString();
    const key = await this._loadKey();

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(query)
    );

    // ArrayBuffer -> hex string
    return [...new Uint8Array(signature)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Gần tương đương với request() trong Python:
   *
   * method: "GET" | "POST" | "PUT" | "DELETE"
   * path  : "/api/v3/account", "/sapi/v1/c2c/ads/update", ...
   * data  : body JSON (POST/PUT)
   * params: query params sẽ được ký (timestamp + signature)
   */
  async request(method, path, data = null, params = null) {
    params = params || {};
    params.timestamp = this._timestamp();

    // Ký tham số query
    const signature = await this._sign(params);
    const qs = new URLSearchParams(params).toString();
    const url = `${this.base_url}${path}?${qs}&signature=${signature}`;

    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined
      });

      const json = await res.json();
      return json;
    } catch (err) {
      return {
        error: err?.message || "Unknown error",
        status: null
      };
    }
  }
}
