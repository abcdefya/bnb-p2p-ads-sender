
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

    this.headers = {
      "Content-Type": "application/json;charset=utf-8",
      "X-MBX-APIKEY": this.api_key,
      "clientType": "WEB"
    };

    this.cryptoKey = null; 
  }

  // Timestamp
  _timestamp() {
    return Date.now();
  }


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

  // SIGNATURE (WebCrypto)
  async _sign(payload) {
    const query = new URLSearchParams(payload).toString();

    const key = await this._loadKey();

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(query)
    );

    // Convert ArrayBuffer → hex string
    return [...new Uint8Array(signature)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  _dispatch(method) {
    return method.toUpperCase();
  }

  // MAIN REQUEST (fetch)
  async request(method, path, data = null, params = null) {
    params = params || {};
    params.timestamp = this._timestamp();

    const signature = await this._sign(params);

    const qs = new URLSearchParams(params).toString();
    const url = `${this.base_url}${path}?${qs}&signature=${signature}`;

    const httpMethod = this._dispatch(method);

    try {
      const res = await fetch(url, {
        method: httpMethod,
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined
      });

      const json = await res.json();
      return json;

    } catch (err) {
      return {
        error: err.message || "Unknown",
        status: null
      };
    }
  }
}
