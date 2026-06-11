import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getMissingEnvVars, renderEnvErrorScreen } from "./lib/env";

// Default to light mode
document.documentElement.classList.add('light');

const missingEnv = getMissingEnvVars();
if (missingEnv.length > 0) {
  renderEnvErrorScreen(missingEnv);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
