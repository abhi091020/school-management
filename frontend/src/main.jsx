import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

// 👇 FIX: Import the chart setup file here to register all elements globally
import "./utils/chartSetup";

import App from "./App";
import store from "./store";

import "./index.css"; // Tailwind styles

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
