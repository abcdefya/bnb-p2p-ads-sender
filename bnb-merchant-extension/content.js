(function() {
  const ws = new WebSocket('ws://localhost:3000');
  ws.onopen = () => console.log('Connected to server');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
    localStorage.setItem('binance_ads', JSON.stringify(data));
    // Logic adjust giá (mở rộng sau): Ví dụ tính avg price từ ads (giả sử data có field 'data' là array ads)
    if (data && data.data && data.data.length > 0) {
      const prices = data.data.map(ad => parseFloat(ad.adv.price)); // Adjust field 'adv.price' dựa trên API response structure
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const adjustedPrice = avgPrice * 1.02; // Ví dụ +2% cho giá bán/mua hợp lý
      console.log('Min:', minPrice, 'Max:', maxPrice, 'Avg:', avgPrice, 'Adjusted:', adjustedPrice);
      // Inject vào trang Binance (kiểm tra selector bằng F12)
      const priceInput = document.querySelector('.bn-p2p-input input[type="number"]'); // Ví dụ selector giá
      if (priceInput) priceInput.value = adjustedPrice.toFixed(2);
    }
  };
  ws.onerror = (err) => console.error('WS error:', err);
  ws.onclose = () => console.log('WS closed');
})();