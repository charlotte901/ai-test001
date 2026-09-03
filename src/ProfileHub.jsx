import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { SourceCrop } from "./AssessmentHub";
import { TestWordmark } from "./TestWordmark";
import { PROFILE_CARDS, PROFILE_ART, PROFILE_WORDMARK, getProfileLayout } from "./profile-layout";

export function ProfileHub({ onBack, busy }) {
  const [size, setSize] = useState(() => ({ width: innerWidth, height: innerHeight }));
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const resize = () => setSize({ width: document.documentElement.clientWidth, height: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const layout = getProfileLayout(size.width, size.height);
  return (
    <main className="profile-screen" data-compact={layout.compact} style={layout.variables} aria-label="个人中心">
      <button className="assessment-back" onClick={onBack} disabled={busy}>
        <ArrowLeft size={18} /> 返回选择
      </button>
      <div className="profile-layout">
        <h1 className="profile-wordmark" tabIndex={-1} aria-label="个人中心">
          <TestWordmark reference={PROFILE_ART} crop={PROFILE_WORDMARK} />
        </h1>
        <div className="profile-grid" role="group" aria-label="个人中心功能">
          {PROFILE_CARDS.map((item) => (
            <button key={item.id} className="profile-card"
              aria-label={`${item.title} · ${item.subtitle}`}
              aria-pressed={selected === item.id}
              disabled={busy}
              onClick={() => setSelected(item.id)}>
              <SourceCrop crop={item.crop} source={PROFILE_ART} width={1672} height={941} />
              {selected === item.id && (
                <span className="assessment-check">
                  <Check size={18} weight="bold" />
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="profile-selection" role="status">
          {selected
            ? `${PROFILE_CARDS.find((item) => item.id === selected).title}即将开放，敬请期待。`
            : ""}
        </p>
      </div>
    </main>
  );
}
