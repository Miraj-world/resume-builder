import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Database,
  Eye,
  EyeOff,
  GitFork,
  KeyRound,
  LockKeyhole,
  Monitor,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import { ManagementHeader } from "../../components/ManagementHeader";
import { NavRail } from "../../components/NavRail";
import {
  ApiError,
  apiRequest,
  type CredentialMetadata
} from "../../lib/api";
import type { NavigateTo } from "../../types/navigation";

interface ConnectionsPageProps {
  onNavigate: NavigateTo;
}

const connectionSections = [
  { label: "AI providers", icon: Sparkles, selected: true },
  { label: "GitHub", icon: GitFork },
  { label: "Companion devices", icon: Monitor },
  { label: "Authorized repositories", icon: Database }
] as const;

type ConnectionSection = (typeof connectionSections)[number]["label"];

export function ConnectionsPage({ onNavigate }: ConnectionsPageProps) {
  const [activeSection, setActiveSection] = useState<ConnectionSection>("AI providers");
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [provider, setProvider] = useState<CredentialMetadata["provider"]>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Session keys are removed when the server restarts.");

  const loadCredentials = useCallback(async () => {
    try {
      const response = await apiRequest<{ credentials: CredentialMetadata[] }>(
        "/v1/credentials"
      );
      setCredentials(response.credentials);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Connections could not be loaded.");
    }
  }, []);

  useEffect(() => {
    // This request synchronizes the page with the external credential store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCredentials();
  }, [loadCredentials]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (apiKey.trim().length < 12) {
      setMessage("Enter a valid provider key.");
      return;
    }

    setBusy(true);
    setMessage("Connecting session credential…");
    try {
      await apiRequest("/v1/credentials/session", {
        method: "POST",
        body: JSON.stringify({
          provider,
          apiKey,
          storageMode: "session_only"
        })
      });
      setApiKey("");
      setShowKey(false);
      setMessage("Provider connected for this server session.");
      await loadCredentials();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The provider could not be connected.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (credentialId: string) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/credentials/${credentialId}`, { method: "DELETE" });
      setMessage("Session credential revoked.");
      await loadCredentials();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The credential could not be revoked.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="management-shell connections-shell">
      <NavRail selected="connections" onNavigate={onNavigate} />
      <ManagementHeader
        title="Connections"
        onAsk={() => onNavigate("vault", { vaultSection: "Overview" })}
        onAddSource={() => onNavigate("vault", { vaultSection: "Sources" })}
      />

      <aside className="secondary-rail" aria-label="Connection types">
        {connectionSections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`secondary-nav-item${activeSection === item.label ? " secondary-nav-item--selected" : ""}`}
              type="button"
              key={item.label}
              onClick={() => {
                setActiveSection(item.label);
                setMessage(`Viewing ${item.label.toLowerCase()}.`);
              }}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      <main className="connections-workspace" id="main">
        <header className="workspace-intro">
          <h2>{activeSection}</h2>
          <p>{activeSection === "AI providers" ? "Use your own provider key for resume analysis and generation." : "Review and manage this connection surface."}</p>
          <span aria-live="polite">{message}</span>
        </header>

        {activeSection === "AI providers" ? <>
        <form className="credential-form" onSubmit={handleSubmit}>
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as CredentialMetadata["provider"])
            }
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>

          <label htmlFor="api-key">API key</label>
          <div className="password-field">
            <input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="api-key-help"
            />
            <button
              type="button"
              onClick={() => setShowKey((current) => !current)}
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
            </button>
          </div>
          <small id="api-key-help">The key is never returned after this request.</small>

          <fieldset>
            <legend>Storage mode</legend>
            <label className="storage-option">
              <input type="radio" name="storage-mode" value="session_only" checked readOnly />
              <span>
                <strong>Session only</strong>
                <small>Removed when this server restarts.</small>
              </span>
            </label>
            <label className="storage-option storage-option--disabled">
              <input type="radio" name="storage-mode" value="encrypted" disabled />
              <span>
                <strong>
                  Encrypted storage
                  <LockKeyhole aria-hidden="true" size={13} />
                </strong>
                <small>Persistent storage is disabled in local development.</small>
              </span>
            </label>
          </fieldset>

          <div className="credential-actions">
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? "Connecting…" : "Connect provider"}
            </button>
            <button className="button button--quiet" type="button" onClick={() => setApiKey("")}>
              Cancel
            </button>
          </div>
        </form>

        <section className="connected-providers">
          <h3>Connected providers</h3>
          {credentials.length === 0 ? (
            <div className="connected-empty">No provider connected yet.</div>
          ) : (
            credentials.map((credential) => (
              <article className="provider-row" key={credential.id}>
                <KeyRound aria-hidden="true" size={18} />
                <div>
                  <strong>{credential.provider}</strong>
                  <span>{credential.maskedHint} · Session only</span>
                </div>
                <span className="provider-state">Active</span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Revoke ${credential.provider} credential`}
                  onClick={() => void handleRevoke(credential.id)}
                  disabled={busy}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </article>
            ))
          )}
        </section>
        </> : (
          <section className="connection-placeholder" aria-label={`${activeSection} connection details`}>
            {activeSection === "GitHub" ? <GitFork aria-hidden="true" size={28} /> : activeSection === "Companion devices" ? <Monitor aria-hidden="true" size={28} /> : <Database aria-hidden="true" size={28} />}
            <h3>{activeSection}</h3>
            <p>
              {activeSection === "GitHub"
                ? "GitHub OAuth is not connected yet. Existing Career Vault data remains available without repository access."
                : activeSection === "Companion devices"
                  ? "No Windows companion is paired with this local workspace."
                  : "No repositories have been authorized for cloud inspection."}
            </p>
          </section>
        )}
      </main>

      <aside className="credential-safety" aria-label="Credential safety">
        <h2>Credential safety</h2>
        <ul>
          <li><ShieldCheck aria-hidden="true" size={18} /><span>Keys are never returned after entry.</span></li>
          <li><LockKeyhole aria-hidden="true" size={18} /><span>Keys are excluded from logs and traces.</span></li>
          <li><KeyRound aria-hidden="true" size={18} /><span>You can revoke a key at any time.</span></li>
        </ul>
        <p>
          Persistent encrypted storage requires server key management and is disabled
          in local development.
        </p>
      </aside>
    </div>
  );
}
