import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const container = document.getElementById("root");

if (!container) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Add error handler for React to show in console
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

try {
  root.render(<App />);
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("❌ Failed to render app:", error);
  // Render a fallback error message
  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #111111;
      color: #F8F8F8;
      font-family: Inter, sans-serif;
    ">
      <div style="text-align: center; max-width: 600px;">
        <h1 style="color: #FF5252; margin-bottom: 16px;">Application Error</h1>
        <p style="margin-bottom: 16px;">An error occurred while loading the application.</p>
        <pre style="
          background: #1a1a1a;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          text-align: left;
          font-size: 12px;
          border: 1px solid #2a2a2a;
        ">${error instanceof Error ? error.message : String(error)}</pre>
        <p style="margin-top: 16px; font-size: 12px; color: #AAAAAA;">
          Open the browser console (F12) to see more details.
        </p>
      </div>
    </div>
  `;
}
