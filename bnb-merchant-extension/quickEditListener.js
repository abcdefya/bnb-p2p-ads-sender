// quickEditListener.js
// Biến "Ad price" trong expanded row thành ô input "Giá USDT mới"
// và gửi rowId + giá mới về background khi bấm Save,
// sau đó cập nhật lại giá hiển thị ở row ngoài bảng theo giá mới từ API.

export function injectEditModule() {
  console.log("[ext] injectEditModule (Ad price → input) initialized");

  function transformAdPrice(row) {
    if (!(row instanceof HTMLElement)) return;

    // Tìm block có title "Ad price"
    const blocks = row.querySelectorAll("div.css-17bcr9w");
    let adBlock = null;

    for (const b of blocks) {
      const titleEl = b.querySelector("div[data-bn-type='text'].css-h4v6zg");
      if (!titleEl) continue;
      const t = (titleEl.textContent || "").trim();
      if (t.includes("Ad price") || t.includes("Ad Price")) {
        adBlock = b;
        break;
      }
    }

    if (!adBlock) return;

    const titleEl = adBlock.querySelector(
      "div[data-bn-type='text'].css-h4v6zg"
    );
    const valueContainer = adBlock.querySelector(".css-xue18y .css-vurnku");
    if (!titleEl || !valueContainer) return;

    // Nếu đã có input mình tạo rồi thì thôi (idempotent)
    let input = valueContainer.querySelector('input[data-usdt-new="1"]');
    if (!input) {
      // Đổi title
      titleEl.textContent = "Giá USDT mới";

      // Xoá nội dung cũ (₫26,300 + 2 dòng mô tả)
      while (valueContainer.firstChild) {
        valueContainer.removeChild(valueContainer.firstChild);
      }

      // Tạo input mới
      const wrapper = document.createElement("div");
      wrapper.className = "css-6nwkqp"; // giống style input khác

      input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.placeholder = "Nhập giá USDT mới";
      input.setAttribute("data-bn-type", "input");
      input.setAttribute("data-usdt-new", "1"); // flag để nhận diện
      input.className = "css-16fg16t"; // class input của Binance

      wrapper.appendChild(input);
      valueContainer.appendChild(wrapper);

      console.log("[ext] Ad price transformed → input box cho 1 row");
    }

    // ---- Hook nút Save ----
    const form = row.querySelector("form");
    if (!form) return;

    const parentRow = row.previousElementSibling;
    const rowId = parentRow?.getAttribute("data-row-key") || null;

    const saveBtn = form.querySelector('button[type="submit"]');
    if (!saveBtn || saveBtn.dataset.myExtHooked === "1") return;

    saveBtn.dataset.myExtHooked = "1";

    saveBtn.addEventListener(
      "click",
      function () {
        const giaMoiInput = form.querySelector('input[data-usdt-new="1"]');
        const giaMoiStr = giaMoiInput ? giaMoiInput.value : null;
        const giaMoi = giaMoiStr ? parseFloat(giaMoiStr) : null;

        console.log("[ext] SAVE clicked (quickEdit):", { rowId, giaMoi });

        if (!rowId || !giaMoi || Number.isNaN(giaMoi)) {
          console.warn(
            "[ext] rowId hoặc giá mới không hợp lệ → bỏ qua gửi background"
          );
          return;
        }

        // Gửi lên background để tính priceFloatingRatio, updateAd, rồi getDetailByNo
        chrome.runtime.sendMessage(
          {
            type: "quickEditSave",
            rowId,
            newPrice: giaMoi
          },
          (response) => {
            if (!response || !response.ok) {
              console.warn("[ext] quickEditSave failed:", response);
              return;
            }

            const { latestPrice } = response;

            // Nếu background trả về latestPrice, dùng nó; nếu không thì fallback dùng giá user nhập
            const finalPrice =
              latestPrice !== null &&
              latestPrice !== undefined &&
              !Number.isNaN(latestPrice)
                ? Number(latestPrice)
                : giaMoi;

            // Format giống UI: 22,341.00
            const displayPrice = finalPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });

            // Tìm lại row ngoài bảng (level-0) theo data-row-key
            const topRow =
              parentRow ||
              document.querySelector(
                `tr.bn-web-table-row[data-row-key="${rowId}"]`
              );

            if (!topRow) {
              console.warn(
                "[ext] Không tìm thấy row hiển thị cho adv:",
                rowId
              );
              return;
            }

            // Cột giá chính là td[aria-colindex="4"] .body4.text-primaryText
            const priceSpan = topRow.querySelector(
              'td[aria-colindex="4"] .body4.text-primaryText'
            );

            if (priceSpan) {
              console.log(
                "[ext] Updating displayed price in table row:",
                priceSpan.textContent,
                "→",
                displayPrice
              );
              priceSpan.textContent = displayPrice;
            } else {
              console.warn(
                "[ext] Không tìm thấy .body4.text-primaryText trong cột giá của row",
                rowId
              );
            }
          }
        );
      },
      true // capture để chạy ngay cả khi Binance chặn bubble
    );
  }

  function handlePossibleRow(node) {
    if (!(node instanceof HTMLElement)) return;

    // TH: node nằm trong expanded-row
    const row = node.closest("tr.bn-web-table-expanded-row");
    if (row) {
      transformAdPrice(row);
    }

    // TH: node là container chứa nhiều expanded-row
    const nested = node.querySelectorAll?.("tr.bn-web-table-expanded-row");
    nested?.forEach(transformAdPrice);
  }

  // Xử lý các row đang mở sẵn (nếu có)
  document
    .querySelectorAll("tr.bn-web-table-expanded-row")
    .forEach(transformAdPrice);

  // Observer: dùng cả m.target + addedNodes để bắt mọi re-render trong expanded row
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.target) {
        handlePossibleRow(m.target);
      }
      m.addedNodes.forEach(handlePossibleRow);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Fallback: mỗi lần click "Edit details" thì ép transform lại
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const text = (btn.textContent || "").toLowerCase().trim();
    if (text.includes("edit details")) {
      setTimeout(() => {
        const row = btn.closest("tr.bn-web-table-expanded-row");
        if (row) transformAdPrice(row);
      }, 80); // đợi React render xong
    }
  });

  console.log(
    "[ext] MutationObserver + click handler cho Ad price → input box đang chạy"
  );
}
