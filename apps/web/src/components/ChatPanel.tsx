import { useState, type FormEvent } from "react";
import { Info, Paperclip, Send } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
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
  const [vaultContextEnabled, setVaultContextEnabled] = useState(true);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;

    setMessages((current) => [
      ...current,
      { id: Math.max(0, ...current.map((item) => item.id)) + 1, text: message }
    ]);
    setDraft("");
  };

  return (
    <aside className="chat-panel" aria-label="Resume conversation">
      <div className="panel-tabs" role="tablist" aria-label="Conversation views">
        <button className="panel-tab panel-tab--active" type="button" role="tab" aria-selected="true">
          Chat
        </button>
        <button className="panel-tab" type="button" role="tab" aria-selected="false">
          Recent
        </button>
      </div>

      <div className="message-list" aria-live="polite">
        {messages.map((message) => (
          <article className="chat-message" key={message.id}>
            <div className="chat-message__meta">
              <strong>You</strong>
              <span>Now</span>
            </div>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

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
        <div className="composer__actions">
          <button className="icon-button" type="button" aria-label="Attach evidence">
            <Paperclip aria-hidden="true" size={17} />
          </button>
          <button className="send-button" type="submit" aria-label="Send message">
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
