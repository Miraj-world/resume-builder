import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  Database,
  FileText,
  LockKeyhole,
  X
} from "lucide-react";

export type SuggestionState = "pending" | "accepted" | "rejected" | "modified";

interface SuggestionInspectorProps {
  original: string;
  proposed: string;
  state: SuggestionState;
  onAccept: (value: string, modified: boolean) => void;
  onReject: () => void;
  onReset: () => void;
}

export function SuggestionInspector({
  original,
  proposed,
  state,
  onAccept,
  onReject,
  onReset
}: SuggestionInspectorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(proposed);

  if (state !== "pending") {
    const message =
      state === "rejected"
        ? "Suggestion rejected. The resume is unchanged."
        : state === "modified"
          ? "Edited suggestion accepted as a new resume version."
          : "Suggestion accepted as a new resume version.";

    return (
      <aside className="suggestion-panel" aria-label="Suggestions">
        <div className="suggestion-panel__heading">
          <h2>Suggestions</h2>
          <X aria-hidden="true" size={17} />
        </div>
        <div className="suggestion-result" aria-live="polite">
          <span className={`result-mark result-mark--${state}`} aria-hidden="true" />
          <h3>{state === "rejected" ? "Not applied" : "Resume updated"}</h3>
          <p>{message}</p>
          <button className="button button--quiet" type="button" onClick={onReset}>
            Restore demo suggestion
          </button>
        </div>
      </aside>
    );
  }

  const handleEditedAccept = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    onAccept(value, value !== proposed);
    setEditing(false);
  };

  return (
    <aside className="suggestion-panel" aria-label="Suggestions">
      <div className="suggestion-panel__heading">
        <h2>Suggestions</h2>
        <X aria-hidden="true" size={17} />
      </div>

      <div className="panel-tabs" role="tablist" aria-label="Suggestion views">
        <button className="panel-tab panel-tab--active" type="button" role="tab" aria-selected="true">
          Active (1)
        </button>
        <button className="panel-tab" type="button" role="tab" aria-selected="false">
          All suggestions (4)
        </button>
      </div>

      <section className="suggestion-card">
        <header className="suggestion-card__header">
          <span className="pending-dot" aria-hidden="true" />
          <strong>Bullet refinement</strong>
          <span>Pending</span>
          <ChevronDown aria-hidden="true" size={15} />
        </header>

        <div className="suggestion-card__body">
          <div className="suggestion-copy">
            <span>Original</span>
            <p>{original}</p>
          </div>

          {editing ? (
            <form onSubmit={handleEditedAccept}>
              <label className="suggestion-label" htmlFor="suggestion-edit">
                Edit proposed text
              </label>
              <textarea
                className="suggestion-editor"
                id="suggestion-edit"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={5}
                autoFocus
              />
              <div className="suggestion-edit-actions">
                <button className="button button--quiet" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="button button--primary" type="submit">
                  Accept edit
                </button>
              </div>
            </form>
          ) : (
            <div className="suggestion-copy suggestion-copy--proposed">
              <span>Proposed</span>
              <p>{proposed}</p>
            </div>
          )}

          <button className="text-button" type="button">
            Show diff
            <ChevronDown aria-hidden="true" size={13} />
          </button>

          <div className="suggestion-reason">
            <span>Why this helps</span>
            <p>
              Shorter, sharper, and centered on system design with explicit data-isolation
              evidence.
            </p>
          </div>

          <section className="evidence-box" aria-label="Supporting evidence">
            <header>
              <strong>Evidence</strong>
              <span>
                <LockKeyhole aria-hidden="true" size={13} />
                Locked section
              </span>
            </header>
            <div className="evidence-row">
              <FileText aria-hidden="true" size={17} />
              <div>
                <strong>Architecture Decision Record: ADR-007</strong>
                <p>Describes event-driven multi-tenant design with Kafka and PostgreSQL.</p>
              </div>
            </div>
            <div className="evidence-row">
              <Database aria-hidden="true" size={17} />
              <div>
                <strong>System Design Notes</strong>
                <p>Documents the data-isolation model and audit logging strategy.</p>
              </div>
            </div>
          </section>
        </div>

        {!editing ? (
          <footer className="suggestion-actions">
            <button className="button button--quiet" type="button" onClick={onReject}>
              Reject
            </button>
            <button
              className="button button--quiet"
              type="button"
              onClick={() => {
                setDraft(proposed);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button className="button button--primary" type="button" onClick={() => onAccept(proposed, false)}>
              Accept
            </button>
          </footer>
        ) : null}
      </section>
    </aside>
  );
}
