// content.js
console.log("⚡ Content script loaded!");

// Quick-update module (ngoài bảng)
// import("./injectQuickUpdate.js")
//   .then((module) => {
//     module.injectQuickUpdateModule();
//     console.log("💊 injectQuickUpdateModule initialized");
//   })
//   .catch((err) => {
//     console.error("Failed to load injectQuickUpdateModule:", err);
//   });

// Edit-details module (expanded row + Giá USDT mới)
import("./quickEditListener.js")
  .then((module) => {
    module.injectEditModule();
    console.log("🧩 injectEditModule (quickEdit + Giá mới) initialized");
  })
  .catch((err) => {
    console.error("Failed to load injectEditModule:", err);
  });
