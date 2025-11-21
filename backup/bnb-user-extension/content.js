(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url.startsWith('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search') && (options && options.method === 'POST')) {
      console.log('Intercepted fetch call. URL:', url, 'Options:', options);
      return originalFetch(url, options).then(response => {
        const cloned = response.clone();
        cloned.json().then(data => {
          console.log('Intercepted fetch data:', data);
          // Send to background for WS
          chrome.runtime.sendMessage({ type: 'update', payload: data });
        }).catch(err => console.error('Fetch JSON error:', err));
        return response;
      }).catch(err => console.error('Fetch error:', err));
    }
    return originalFetch(url, options);
  };

  // Override XHR if used
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url.startsWith('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search') && method === 'POST') {
      console.log('Intercepted XHR call. URL:', url);
      this.addEventListener('load', () => {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const data = JSON.parse(this.responseText);
            console.log('Intercepted XHR data:', data);
            // Send to background for WS
            chrome.runtime.sendMessage({ type: 'update', payload: data });
          } catch (err) {
            console.error('XHR JSON error:', err);
          }
        }
      });
    }
    originalOpen.apply(this, arguments);
  };
})();(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url.startsWith('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search') && (options && options.method === 'POST')) {
      console.log('Intercepted fetch call. URL:', url, 'Options:', options);
      return originalFetch(url, options).then(response => {
        const cloned = response.clone();
        cloned.json().then(data => {
          console.log('Intercepted fetch data:', data);
          // Send to background for WS
          chrome.runtime.sendMessage({ type: 'update', payload: data });
        }).catch(err => console.error('Fetch JSON error:', err));
        return response;
      }).catch(err => console.error('Fetch error:', err));
    }
    return originalFetch(url, options);
  };

  // Override XHR if used
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url.startsWith('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search') && method === 'POST') {
      console.log('Intercepted XHR call. URL:', url);
      this.addEventListener('load', () => {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const data = JSON.parse(this.responseText);
            console.log('Intercepted XHR data:', data);
            // Send to background for WS
            chrome.runtime.sendMessage({ type: 'update', payload: data });
          } catch (err) {
            console.error('XHR JSON error:', err);
          }
        }
      });
    }
    originalOpen.apply(this, arguments);
  };
})();