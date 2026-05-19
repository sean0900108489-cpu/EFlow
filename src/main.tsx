import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./lib/i18n/language-context";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/tutorial.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
