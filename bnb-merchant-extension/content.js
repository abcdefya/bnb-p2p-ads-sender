(function() {
  const ws = new WebSocket('ws://localhost:3000');
  ws.onopen = () => console.log('Connected to server');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
    localStorage.setItem('binance_ads', JSON.stringify(data));

  };
  ws.onerror = (err) => console.error('WS error:', err);
  ws.onclose = () => console.log('WS closed');
})();