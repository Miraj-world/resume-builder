import { LockKeyhole } from "lucide-react";
import type { CSSProperties } from "react";
import { brightlineBullets, northstarBullets } from "../data/resume";

interface ResumeCanvasProps {
  selectedBullet: string;
  selected: boolean;
  atsPreview: boolean;
  zoom: number;
}

export function ResumeCanvas({
  selectedBullet,
  selected,
  atsPreview,
  zoom
}: ResumeCanvasProps) {
  const zoomStyle = { "--resume-zoom": `${zoom}%` } as CSSProperties;

  if (atsPreview) {
    return (
      <main className="canvas-stage canvas-stage--ats" id="main" data-testid="resume-canvas">
        <section className="ats-document" aria-label="ATS text preview" style={zoomStyle}>
          <header>
            <span>ATS text preview</span>
            <strong>Reading order and plain-text projection</strong>
          </header>
          <pre>{`ALEX MORGAN
Senior Product Engineer
Seattle, WA | alex.morgan@example.com | linkedin.com/in/alexmorgan

SUMMARY
Product-minded engineer designing reliable systems and delivering customer impact.

EXPERIENCE
Northstar Labs — Senior Product Engineer
${selectedBullet}

Brightline Technologies — Software Engineer
Built services for billing and subscriptions using Node.js and DynamoDB.

EDUCATION
University of Washington — B.S. in Computer Science`}</pre>
        </section>
      </main>
    );
  }

  return (
    <main className="canvas-stage" id="main" data-testid="resume-canvas">
      <article className="resume-page" aria-label="Resume preview" style={zoomStyle}>
        <header className="resume-header">
          <h1>Alex Morgan</h1>
          <p className="resume-role">Senior Product Engineer</p>
          <p>Seattle, WA · alex.morgan@example.com · linkedin.com/in/alexmorgan</p>
        </header>

        <section className="resume-section">
          <h2>Summary</h2>
          <p>
            Product-minded engineer designing reliable systems and delivering customer
            impact in collaborative product teams.
          </p>
        </section>

        <section className="resume-section">
          <div className="resume-section__heading">
            <h2>Experience</h2>
            <span className="locked-note">
              <LockKeyhole aria-hidden="true" size={11} />
              Evidence locked
            </span>
          </div>

          <div className="resume-entry">
            <div className="resume-entry__header">
              <div>
                <h3>Northstar Labs</h3>
                <em>Senior Product Engineer</em>
              </div>
              <div className="resume-entry__meta">
                <span>Seattle, WA</span>
                <span>May 2021 — Present</span>
              </div>
            </div>
            <ul>
              {northstarBullets.map((bullet, index) => {
                const displayBullet = index === 1 ? selectedBullet : bullet;
                return (
                  <li
                    className={index === 1 && selected ? "resume-bullet--selected" : undefined}
                    data-testid={index === 1 ? "selected-bullet" : undefined}
                    key={bullet}
                  >
                    {displayBullet}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="resume-entry">
            <div className="resume-entry__header">
              <div>
                <h3>Brightline Technologies</h3>
                <em>Software Engineer</em>
              </div>
              <div className="resume-entry__meta">
                <span>Austin, TX</span>
                <span>Jun 2017 — Apr 2021</span>
              </div>
            </div>
            <ul>
              {brightlineBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="resume-section resume-section--education">
          <h2>Education</h2>
          <div className="resume-entry__header">
            <div>
              <h3>University of Washington</h3>
              <em>B.S. in Computer Science</em>
            </div>
            <div className="resume-entry__meta">
              <span>Seattle, WA</span>
              <span>May 2017</span>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
