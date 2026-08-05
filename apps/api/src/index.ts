import { createApp } from "./app.js";

createApp().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
