import type { ReactNode } from "react";
import { Brand } from "./AppShell";
import { Icon } from "./Icon";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <p className="eyebrow">A CLEARER WAY TO WORK</p>
          <h1>
            Less juggling.
            <br />
            More <span>doing.</span>
          </h1>
          <p className="auth-story-description">
            Give every idea a place, every task a next step, and your team a
            shared direction.
          </p>
          <div className="workspace-preview">
            <div className="preview-heading">
              <span>Website launch</span>
              <span>WORKSPACE PREVIEW</span>
            </div>
            <div className="preview-columns">
              {["To do", "In progress", "Done"].map((label, index) => (
                <div key={label}>
                  <div className="preview-column-label">
                    <i />
                    {label}
                  </div>
                  <div className={`preview-task preview-task-${index}`}>
                    <span className="preview-tag">
                      {["Planning", "Design", "Delivery"][index]}
                    </span>
                    <strong>
                      {
                        [
                          "Map the next milestone",
                          "Refine the experience",
                          "Bring the team together",
                        ][index]
                      }
                    </strong>
                    <div className="preview-task-foot">
                      <span className="mini-avatar">
                        {["SK", "JD", "AM"][index]}
                      </span>
                      <Icon name={index === 2 ? "check" : "clock"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-story-footer">
          <Icon name="users" />
          <span>From the first idea to the final checkbox.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">
          {children}
          <p className="auth-footnote">
            <Icon name="clock" />
            Free demo: the first sign-in may take a minute while the server
            wakes up.
          </p>
        </div>
        <span className="auth-bottom-note">
          Focus on the work. We’ll keep it organized.
        </span>
      </section>
    </main>
  );
}
