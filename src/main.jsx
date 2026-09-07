import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Showcase from "./Showcase.jsx";
import { useIsStandalone } from "./PhoneFrame.jsx";
import { isNative } from "./native/platform.js";
import { I18nProvider } from "./i18n.jsx";
import "./styles.css";

function Root() {
  const standalone = useIsStandalone();
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (hash === "#app" || standalone || isNative())
    return (
      <I18nProvider>
        <App />
      </I18nProvider>
    );
  return <Showcase />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
