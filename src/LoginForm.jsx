import { useState } from "react";
import { ArrowRight, Eye, EyeSlash, LockKey, User } from "@phosphor-icons/react";

/** Navigation-only demo: never read, serialize, store or send credentials. */
export function submitDemoLogin(event, onLogin) {
  event.preventDefault();
  event.currentTarget.reset();
  onLogin();
}

export function LoginForm({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="login-form" noValidate autoComplete="off"
      aria-labelledby="login-title" aria-describedby="login-note"
      onSubmit={(event) => submitDemoLogin(event, onLogin)}>
      <header className="login-heading">
        <span className="login-kicker" aria-hidden="true">
          <span className="login-kicker-dot" />
          AIQUOS · PLAYGROUND
        </span>
        <h2 id="login-title" className="login-title" tabIndex={-1}>欢迎回来</h2>
        <p>登录，探索你的 AI 实力</p>
      </header>
      <div className="login-fields">
        <label className="login-field">
          <span className="sr-only">账号</span>
          <User size={19} aria-hidden="true" />
          <input type="text" placeholder="手机号 / 邮箱" autoComplete="off"
            autoCapitalize="none" spellCheck={false} aria-label="账号" />
        </label>
        <div className="login-field">
          <LockKey size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="login-password">密码</label>
          <input id="login-password" type={showPassword ? "text" : "password"}
            placeholder="密码" autoComplete="off" />
          <button type="button" className="login-password-toggle"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeSlash size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
      <button type="submit" className="login-submit">
        <span>登录</span><ArrowRight size={19} weight="bold" aria-hidden="true" />
      </button>
      <p id="login-note" className="login-note">演示模式 · 无需填写真实账号</p>
    </form>
  );
}
