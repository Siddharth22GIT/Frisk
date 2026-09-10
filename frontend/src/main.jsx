import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#141312",
              color: "#f5efe6",
              border: "1px solid rgba(245, 239, 230, 0.12)",
              borderRadius: "14px",
              fontSize: "13px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7)",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "#090807" } },
            error: { iconTheme: { primary: "#f43f5e", secondary: "#090807" } },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
