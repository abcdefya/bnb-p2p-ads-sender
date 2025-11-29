// quickEditListener.js
// Biến "Ad price" trong expanded row thành ô input "Giá USDT mới"
// và log rowId & giá mới khi bấm Save

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
        const giaMoi = giaMoiInput ? giaMoiInput.value : null;
        console.log("[ext] SAVE clicked (quickEdit):", { rowId, giaMoi });

        // Nếu muốn gửi về background:
        // chrome.runtime.sendMessage({
        //   type: "quickEditSave",
        //   rowId,
        //   giaMoi
        // });
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

  // Observer: dùng cả m.target + addedNodes (giống đoạn V2 bạn test trực tiếp)
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
    subtree: true,
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
