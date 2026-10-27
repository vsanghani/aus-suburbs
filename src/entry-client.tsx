import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { siteOrigin } from "./config/site";
import { OriginContext, RouteDataContext } from "./seo/context";
import { readRoutePayload } from "./seo/routeData";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element.");

const tree = (
  <StrictMode>
    <OriginContext.Provider value={siteOrigin()}>
      <RouteDataContext.Provider value={readRoutePayload()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RouteDataContext.Provider>
    </OriginContext.Provider>
  </StrictMode>
);

if (root.childElementCount > 0) hydrateRoot(root, tree);
else createRoot(root).render(tree);
