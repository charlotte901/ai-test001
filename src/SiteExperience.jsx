import { useEffect, useRef, useState } from "react";
import { App } from "./App";
import { AssessmentHub } from "./AssessmentHub";
import { AssessmentMap, AssessmentTask } from "./AssessmentFlow";
import { ChooseHub } from "./ChooseHub";
import { assessmentHash, getAssessmentRoute } from "./assessment-flow";
import { animateCards } from "./card-transition";
import {
  animateStrips,
  collectSceneFrames,
  freezeView,
  holdView,
  measureAssessmentBands,
} from "./split-transition";

const route = () => {
  const assessment = getAssessmentRoute();
  if (assessment) return assessment.mode === "task" ? "assessment-task" : "assessment-map";
  if (location.hash === "#assessments") return "assessments";
  if (location.hash === "#choose") return "choose";
  return location.hash === "#login" ? "login" : "home";
};

const PANEL = {
  home: "cube",
  login: "cube",
  choose: "choose",
  assessments: "assessments",
  "assessment-map": "assessment-flow",
  "assessment-task": "assessment-flow",
};
// login → choose keeps the three-band strip pull; the choose ↔ assessments
// hop flies whole cards out and in. Back from choose reveals the still-flat
// login surface first so the cube can rotate home after the strips land.
const STRIP_MOVES = new Set(["login>choose", "choose>home"]);

export function SiteExperience() {
  const [view, setView] = useState(route);
  const [assessmentRoute, setAssessmentRoute] = useState(
    () => getAssessmentRoute() ?? { id: "comprehensive", stage: 1, mode: "map" },
  );
  const [progress, setProgress] = useState({
    comprehensive: 1,
    objective: 1,
    conversation: 1,
    practical: 1,
  });
  const [moving, setMoving] = useState(false);
  const [holdingLogin, setHoldingLogin] = useState(false);
  const [cubeMounted, setCubeMounted] = useState(
    () => route() === "home" || route() === "login",
  );
  const panels = useRef({});
  const stage = useRef(null);
  const busy = useRef(false);
  useEffect(() => {
    const pop = () => {
      const nextAssessment = getAssessmentRoute();
      if (nextAssessment) setAssessmentRoute(nextAssessment);
      setView(route());
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("hashchange", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("hashchange", pop);
    };
  }, []);
  useEffect(() => {
    if (view === "home" || view === "login") setCubeMounted(true);
    document.title = view === "assessments"
      ? "AIQUOS — 选择测评方式"
      : view === "assessment-map"
        ? "AIQUOS — 闯关地图"
        : view === "assessment-task"
          ? "AIQUOS — AI 能力测评"
      : view === "choose"
        ? "AIQUOS — 选择你的下一步"
        : view === "login"
          ? "AIQUOS — 登录"
          : "AIQUOS — 你的 AI 实力到哪一步？";
  }, [view]);
  useEffect(() => {
    if (!moving) {
      const target = view === "assessments"
        ? ".assessment-wordmark"
        : view === "assessment-map" || view === "assessment-task"
          ? ".flow-wordmark"
        : view === "choose"
          ? ".choose-wordmark"
          : view === "login"
            ? ".login-title"
            : ".home-brand";
      document.querySelector(target)?.focus({ preventScroll: true });
    }
  }, [moving, view]);

  async function go(next, hash = `#${next}`) {
    if (busy.current || next === view) return;
    const fromPanel = panels.current[PANEL[view]];
    const toPanel = panels.current[PANEL[next]];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCubeMounted(true);
    // home ↔ login share one panel: the cube's own 900 ms turn is the
    // transition, so a frozen overlay would only hide it.
    if (reduce || fromPanel === toPanel || !stage.current) {
      setView(next);
      window.scrollTo(0, 0);
      history.pushState(null, "", hash);
      return;
    }
    busy.current = true;
    setMoving(true);
    const move = `${view}>${next}`;
    try {
      const scrollY = window.scrollY;
      // The seams must cut card whitespace, so measure whichever side carries
      // cards while it is still laid out on screen.
      const cardPage = (node) =>
        node.querySelector(".choose-card, .assessment-card");
      const boundsFrom = cardPage(fromPanel)
        ? measureAssessmentBands(fromPanel)
        : null;
      const outgoing = await freezeView(
        fromPanel,
        await collectSceneFrames(fromPanel),
      );
      holdView(stage.current, outgoing, scrollY);
      if (next === "home") setHoldingLogin(true);
      setView(next);
      window.scrollTo(0, 0);
      history.pushState(null, "", hash);
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const boundaries = cardPage(toPanel)
        ? measureAssessmentBands(toPanel)
        : boundsFrom ?? [0, 0, innerHeight, innerHeight];
      const incoming = await freezeView(
        toPanel,
        await collectSceneFrames(toPanel),
      );
      await (STRIP_MOVES.has(move)
        ? animateStrips(stage.current, outgoing, incoming, scrollY, next === "home", boundaries)
        : animateCards(stage.current, outgoing, incoming, scrollY, next === "choose"));
    } finally {
      stage.current?.replaceChildren();
      stage.current?.classList.remove("is-running");
      setHoldingLogin(false);
      busy.current = false;
      setMoving(false);
    }
  }

  function openAssessmentMap(id) {
    const stage = progress[id] ?? 1;
    setAssessmentRoute({ id, stage, mode: "map" });
    go("assessment-map", assessmentHash(id));
  }

  function openAssessmentStage(stage) {
    const complete = progress[assessmentRoute.id] ?? 1;
    if (stage > complete) return;
    setAssessmentRoute((current) => ({ ...current, stage, mode: "task" }));
    go("assessment-task", assessmentHash(assessmentRoute.id, stage));
  }

  function completeAssessmentStage(stage) {
    const id = assessmentRoute.id;
    const nextStage = Math.min(5, stage + 1);
    setProgress((current) => ({ ...current, [id]: Math.max(current[id] ?? 1, nextStage) }));
    setAssessmentRoute({ id, stage: nextStage, mode: "map" });
    go("assessment-map", assessmentHash(id));
  }

  return (
    <div className="site-experience" data-view={view} aria-busy={moving}>
      <div
        className="experience-panel"
        ref={(node) => {
          panels.current.cube = node;
        }}
        hidden={view === "choose" || view === "assessments" || view === "assessment-map" || view === "assessment-task"}
      >
        {(cubeMounted || view === "home" || view === "login") && (
          <App
            onLogin={() => go("login")}
            onBack={() => go("home")}
            onLoginComplete={() => go("choose")}
            loginView={view !== "home" || holdingLogin}
            active={view === "home" || view === "login"}
            transitionBusy={moving}
            onCubeMotionChange={setMoving}
          />
        )}
      </div>
      <div
        className="experience-panel"
        ref={(node) => {
          panels.current.choose = node;
        }}
        hidden={view !== "choose"}
      >
        <ChooseHub
          onBack={() => go("home")}
          onTest={() => go("assessments")}
          busy={moving}
        />
      </div>
      <div
        className="experience-panel"
        ref={(node) => {
          panels.current.assessments = node;
        }}
        hidden={view !== "assessments"}
      >
        <AssessmentHub onBack={() => go("choose")} onStart={openAssessmentMap} busy={moving} />
      </div>
      <div
        className="experience-panel"
        ref={(node) => {
          panels.current["assessment-flow"] = node;
        }}
        hidden={view !== "assessment-map" && view !== "assessment-task"}
      >
        {view === "assessment-map" ? (
          <AssessmentMap
            id={assessmentRoute.id}
            current={progress[assessmentRoute.id] ?? 1}
            complete={progress[assessmentRoute.id] ?? 1}
            onBack={() => go("assessments")}
            onOpenStage={openAssessmentStage}
            busy={moving}
          />
        ) : (
          <AssessmentTask
            id={assessmentRoute.id}
            stage={assessmentRoute.stage}
            complete={progress[assessmentRoute.id] ?? 1}
            onBack={() => openAssessmentMap(assessmentRoute.id)}
            onPick={openAssessmentStage}
            onComplete={completeAssessmentStage}
            busy={moving}
          />
        )}
      </div>
      <div className="split-transition" ref={stage} aria-hidden="true" />
    </div>
  );
}
