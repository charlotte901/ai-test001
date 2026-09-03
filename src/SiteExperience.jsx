import { useEffect, useState } from "react";
import { App } from "./App";
import { AssessmentHub } from "./AssessmentHub";

const route = () => {
  if (location.hash === "#assessments") return "assessments";
  return location.hash === "#login" ? "login" : "home";
};

export function SiteExperience() {
  const [view, setView] = useState(route);
  const [moving, setMoving] = useState(false);
  const [hasVisitedHome, setHasVisitedHome] = useState(() => route() !== "assessments");
  useEffect(() => {
    const pop = () => setView(route());
    window.addEventListener("popstate", pop);
    window.addEventListener("hashchange", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("hashchange", pop);
    };
  }, []);
  useEffect(() => {
    if (view !== "assessments") setHasVisitedHome(true);
    document.title = view === "assessments"
      ? "AIQUOS — 选择测评方式"
      : view === "login" ? "AIQUOS — 登录" : "AIQUOS — 你的 AI 实力到哪一步？";
  }, [view]);
  useEffect(() => {
    if (!moving) {
      const target = view === "assessments" ? ".assessment-wordmark"
        : view === "login" ? ".login-title" : ".home-brand";
      document.querySelector(target)?.focus({ preventScroll: true });
    }
  }, [moving, view]);
  function navigate(next) {
    setView(next);
    window.scrollTo(0, 0);
    history.pushState(null, "", `#${next}`);
  }
  return (
    <div className="site-experience" data-view={view} aria-busy={moving}>
      <div className="experience-panel" hidden={view === "assessments"}>
        {(view !== "assessments" || hasVisitedHome) && (
          <App
            onLogin={() => navigate("login")}
            onBack={() => navigate("home")}
            onLoginComplete={() => navigate("assessments")}
            loginView={view !== "home"}
            active={view !== "assessments"}
            transitionBusy={moving}
            onCubeMotionChange={setMoving}
          />
        )}
      </div>
      <div className="experience-panel" hidden={view !== "assessments"}>
        <AssessmentHub onBack={() => navigate("home")} busy={false} />
      </div>
    </div>
  );
}
