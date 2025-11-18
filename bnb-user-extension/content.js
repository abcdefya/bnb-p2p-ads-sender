(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url === 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search' && (options && options.method === 'POST')) {
      console.log('API called. Waiting response...');
      return originalFetch(url, options).then(response => {
        const cloned = response.clone();
        cloned.json().then(data => {
          console.log('API Data:', data);
          const ws = new WebSocket('ws://localhost:3000');
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'update', payload: data }));
            ws.close();
          };
          ws.onerror = (err) => console.error('WS error:', err);
        }).catch(err => console.error('JSON error:', err));
        return response;
      }).catch(err => console.error('Fetch error:', err));
    }
    return originalFetch(url, options);
  };
})();
