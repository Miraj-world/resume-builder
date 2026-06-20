import { useRef, useState, type FormEvent } from "react";
import { FileText, Info, Paperclip, Send, X } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
  attachment?: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    text: "Make this project more concise and emphasize system design."
  }
];

export function ChatPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "recent">("chat");
  const [attachment, setAttachment] = useState<string>();
  const [vaultContextEnabled, setVaultContextEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message && !attachment) return;

    setMessages((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        text: message || "Review the attached evidence.",
        ...(attachment ? { attachment } : {})
      }
    ]);
    setDraft("");
    setAttachment(undefined);
  };

  return (
    <aside className="chat-panel" aria-label="Resume conversation">
      <div className="panel-tabs" role="tablist" aria-label="Conversation views">
        <button
          className={`panel-tab${activeTab === "chat" ? " panel-tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={`panel-tab${activeTab === "recent" ? " panel-tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "recent"}
          onClick={() => setActiveTab("recent")}
        >
          Recent
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="message-list" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <strong>Start a new resume conversation</strong>
              <p>Ask for a rewrite, evidence check, or tighter positioning.</p>
            </div>
          ) : messages.map((message) => (
            <article className="chat-message" key={message.id}>
              <div className="chat-message__meta">
                <strong>You</strong>
                <span>Now</span>
              </div>
              <p>{message.text}</p>
              {message.attachment ? (
                <span className="message-attachment">
                  <FileText aria-hidden="true" size={13} />
                  {message.attachment}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="recent-conversations" role="tabpanel" aria-label="Recent conversations">
          <article>
            <strong>Northstar Labs tailoring</strong>
            <span>Today · {messages.length} message{messages.length === 1 ? "" : "s"}</span>
          </article>
          <article>
            <strong>System design emphasis</strong>
            <span>Yesterday · Resume version 2</span>
          </article>
        </div>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="resume-question">
          Ask about this resume
        </label>
        <textarea
          id="resume-question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask anything about your resume..."
          rows={3}
        />
        {attachment ? (
          <div className="attachment-chip">
            <FileText aria-hidden="true" size={13} />
            <span>{attachment}</span>
            <button type="button" aria-label={`Remove ${attachment}`} onClick={() => setAttachment(undefined)}>
              <X aria-hidden="true" size={13} />
            </button>
          </div>
        ) : null}
        <input
          className="sr-only"
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          aria-label="Choose evidence file"
          onChange={(event) => setAttachment(event.target.files?.[0]?.name)}
        />
        <div className="composer__actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Attach evidence"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip aria-hidden="true" size={17} />
          </button>
          <button
            className="send-button"
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim() && !attachment}
          >
            <Send aria-hidden="true" size={18} />
          </button>
        </div>
      </form>

      <div className="context-toggle">
        <span>
          Career Vault context
          <Info aria-hidden="true" size={14} />
        </span>
        <button
          className={`switch${vaultContextEnabled ? " switch--active" : ""}`}
          type="button"
          role="switch"
          aria-checked={vaultContextEnabled}
          onClick={() => setVaultContextEnabled((current) => !current)}
          aria-label="Use Career Vault context"
        >
          <span />
        </button>
      </div>
    </aside>
  );
}
