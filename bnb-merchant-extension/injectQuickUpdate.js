export function injectQuickUpdateModule() {

    console.log("🚀 injectQuickUpdateModule started");

    window.quickUpdateData = window.quickUpdateData || [];

    const style = document.createElement("style");
    style.innerHTML = `
        .quick-ok-btn {
            padding: 3px 6px;
            background: #fcd535;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: 0.2s ease;
        }
        .quick-ok-btn:hover {
            background: #ffea7f;
            transform: scale(1.05);
        }
        .quick-ok-btn.pressed {
            background: #8fcf5b !important;
            color:#fff !important;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);

    // ============================
    // Hàm inject
    // ============================
    function injectColumn() {
        try {
            const table = document.querySelector(".bn-web-table table");
            if (!table) return;

            // không inject trùng
            if (table.dataset.quickInjected === "1") return;
            table.dataset.quickInjected = "1";

            console.log("🔥 Injecting Quick Update column...");

            const theadRow = table.querySelector("thead tr");
            const bodyRows = table.querySelectorAll("tbody tr");

            let adPriceIndex = Array.from(theadRow.children)
                .findIndex(th => th.innerText.includes("Ad price"));

            if (adPriceIndex === -1) return;

            const newTH = document.createElement("th");
            newTH.innerHTML = `<div>Chỉnh giá nhanh</div>`;
            newTH.style.textAlign = "center";
            theadRow.insertBefore(newTH, theadRow.children[adPriceIndex + 1]);

            bodyRows.forEach(row => {
                const priceCell = row.children[adPriceIndex];
                const priceText = priceCell.innerText.split("\n")[0].trim();
                const numericPrice = priceText.replace(/[^0-9.]/g, "") || 0;

                const adCell = row.children[1];
                const adsOrderId = adCell.querySelector("div.underline")?.innerText.trim();

                const td = document.createElement("td");
                td.style.textAlign = "center";

                const inputId = `quick-${adsOrderId}`;

                td.innerHTML = `
                    <input 
                        id="${inputId}"
                        type="number"
                        value="${numericPrice}"
                        style="width:90px;padding:3px;border:1px solid #ccc;border-radius:4px;"
                    />
                    <button 
                        class="quick-ok-btn"
                        data-ad="${adsOrderId}"
                        data-input="${inputId}"
                    >OK</button>
                `;

                row.insertBefore(td, row.children[adPriceIndex + 1]);

                const btn = td.querySelector(".quick-ok-btn");
                btn.addEventListener("click", () => {
                    const newValue = document.getElementById(inputId).value.trim();
                    const payload = { adsOrderId, newPrice: parseFloat(newValue) };

                    window.quickUpdateData.push(payload);
                    console.log("👉 ĐÃ LƯU PAYLOAD:", payload);
                    console.log("🔥 TẤT CẢ DỮ LIỆU:", window.quickUpdateData);

                    btn.classList.add("pressed");
                    btn.innerText = "✓";
                    setTimeout(() => {
                        btn.classList.remove("pressed");
                        btn.innerText = "OK";
                    }, 700);
                });

            });

            console.log("✅ Inject xong!");

        } catch (err) {
            console.error("Inject error:", err);
        }
    }

    // ============================
    // OBSERVER — RE-INJECT WHENEVER TABLE CHANGES
    // ============================

    const observer = new MutationObserver(() => {
        const table = document.querySelector(".bn-web-table table");
        if (!table) return;

        if (!table.dataset.quickInjected) {
            injectColumn();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log("👀 MutationObserver is watching...");
}
