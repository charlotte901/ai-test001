import React from "react";
import { createRoot } from "react-dom/client";
import { SiteExperience } from "./SiteExperience.jsx";
import "./styles.css";
import "./responsive.css";
import "./cases.css";
import "./assessment.css";
import "./assessment-flow.css";
import "./choose.css";
import "./cube-turn.css";
import "./login.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteExperience />
  </React.StrictMode>,
);
