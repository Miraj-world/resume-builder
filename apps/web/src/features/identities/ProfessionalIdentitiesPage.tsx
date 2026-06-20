import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Archive,
  Bolt,
  BriefcaseBusiness,
  Database,
  FileText,
  Folder,
  House,
  IdCard,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Star
} from "lucide-react";
import { ManagementHeader } from "../../components/ManagementHeader";
import { NavRail } from "../../components/NavRail";
import {
  ApiError,
  apiRequest,
  type ProfessionalIdentity
} from "../../lib/api";
import type { NavigateTo } from "../../types/navigation";

interface ProfessionalIdentitiesPageProps {
  onNavigate: NavigateTo;
}

interface IdentityDraft {
  name: string;
  headline: string;
  targetRoles: string;
  emphasizedSkills: string;
  narrativeSummary: string;
}

const emptyDraft: IdentityDraft = {
  name: "",
  headline: "",
  targetRoles: "",
  emphasizedSkills: "",
  narrativeSummary: ""
};

const sectionItems = [
  { label: "Overview", icon: House },
  { label: "Review queue", icon: ShieldCheck },
  { label: "Sources", icon: Database },
  { label: "Experiences", icon: BriefcaseBusiness },
  { label: "Projects", icon: Folder },
  { label: "Skills", icon: Bolt },
  { label: "Identities", icon: IdCard, selected: true },
  { label: "Private context", icon: LockKeyhole }
] as const;

function splitList(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function draftFromIdentity(identity: ProfessionalIdentity): IdentityDraft {
  return {
    name: identity.name,
    headline: identity.headline,
    targetRoles: identity.targetRoleFamilies.join(", "),
    emphasizedSkills: identity.emphasizedSkills.join(", "),
    narrativeSummary: identity.narrativeSummary
  };
}

export function ProfessionalIdentitiesPage({
  onNavigate
}: ProfessionalIdentitiesPageProps) {
  const [identities, setIdentities] = useState<ProfessionalIdentity[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [draft, setDraft] = useState<IdentityDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Create distinct professional narratives without duplicating career facts."
  );

  const loadIdentities = useCallback(async () => {
    try {
      const response = await apiRequest<{ identities: ProfessionalIdentity[] }>(
        "/v1/identities"
      );
      setIdentities(response.identities);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Identities could not be loaded.");
    }
  }, []);

  useEffect(() => {
    // This request synchronizes the page with the external Career Vault store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadIdentities();
  }, [loadIdentities]);

  const selectIdentity = (identity: ProfessionalIdentity) => {
    setSelectedId(identity.id);
    setDraft(draftFromIdentity(identity));
    setMessage(`Editing ${identity.name}. Shared facts remain unchanged.`);
  };

  const beginNewIdentity = () => {
    setSelectedId(undefined);
    setDraft(emptyDraft);
    setMessage("Creating a new identity over the same Career Vault.");
  };

  const saveIdentity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.name.trim().length === 0) {
      setMessage("Give this identity a concise name.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        headline: draft.headline.trim(),
        targetRoleFamilies: splitList(draft.targetRoles),
        emphasizedSkills: splitList(draft.emphasizedSkills),
        narrativeSummary: draft.narrativeSummary.trim()
      };
      const response = selectedId
        ? await apiRequest<{ identity: ProfessionalIdentity }>(
            `/v1/identities/${selectedId}`,
            { method: "PATCH", body: JSON.stringify(payload) }
          )
        : await apiRequest<{ identity: ProfessionalIdentity }>("/v1/identities", {
            method: "POST",
            body: JSON.stringify(payload)
          });
      setSelectedId(response.identity.id);
      setDraft(draftFromIdentity(response.identity));
      setMessage(selectedId ? "Identity updated." : "Identity created and linked to the Career Vault.");
      await loadIdentities();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The identity could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (identity: ProfessionalIdentity) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/identities/${identity.id}/default`, { method: "POST" });
      setMessage(`${identity.name} is now the default identity.`);
      await loadIdentities();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The default could not be changed.");
    } finally {
      setBusy(false);
    }
  };

  const archiveIdentity = async (identity: ProfessionalIdentity) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/identities/${identity.id}`, { method: "DELETE" });
      if (selectedId === identity.id) beginNewIdentity();
      setMessage(`${identity.name} archived. Its shared Career Vault facts were not deleted.`);
      await loadIdentities();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The identity could not be archived.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="management-shell identities-shell">
      <NavRail selected="vault" onNavigate={onNavigate} />
      <ManagementHeader
        title="Professional identities"
        onAsk={() => setMessage("Ask the Vault can compare identities without changing verified facts.")}
        onAddSource={() => onNavigate("vault")}
      />

      <aside className="secondary-rail" aria-label="Career Vault sections">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`secondary-nav-item${item.label === "Identities" ? " secondary-nav-item--selected" : ""}`}
              type="button"
              key={item.label}
              onClick={() => {
                if (item.label !== "Identities") onNavigate("vault", { vaultSection: item.label });
              }}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      <main className="identities-workspace" id="main">
        <header className="workspace-intro identities-intro">
          <div>
            <h2>One career, multiple identities</h2>
            <p>Shape role-specific positioning while keeping one evidence-backed history.</p>
            <span aria-live="polite">{message}</span>
          </div>
          <button className="button button--primary" type="button" onClick={beginNewIdentity}>
            <Plus aria-hidden="true" size={15} />
            Create identity
          </button>
        </header>

        <div className="identity-list" aria-label="Professional identities">
          {identities.length === 0 ? (
            <div className="identity-empty">
              <IdCard aria-hidden="true" size={28} strokeWidth={1.5} />
              <strong>No identities yet</strong>
              <p>Create your first role-specific narrative. Career facts stay shared.</p>
            </div>
          ) : (
            identities.map((identity) => (
              <article
                className={`identity-card${selectedId === identity.id ? " identity-card--selected" : ""}`}
                key={identity.id}
              >
                <button
                  className="identity-card__body"
                  type="button"
                  onClick={() => selectIdentity(identity)}
                  aria-label={`Edit ${identity.name}`}
                >
                  <span className="identity-card__icon" aria-hidden="true">
                    <IdCard size={20} strokeWidth={1.6} />
                  </span>
                  <span className="identity-card__copy">
                    <strong>{identity.name}</strong>
                    <small>{identity.headline || "Add a positioning headline"}</small>
                  </span>
                  {identity.isDefault ? <span className="identity-default">Default</span> : null}
                </button>

                <div className="identity-card__details">
                  <div>
                    <span>Target roles</span>
                    <p>{identity.targetRoleFamilies.join(" · ") || "Not specified"}</p>
                  </div>
                  <div>
                    <span>Emphasized skills</span>
                    <p>{identity.emphasizedSkills.join(" · ") || "Not specified"}</p>
                  </div>
                  {identity.narrativeSummary ? <blockquote>{identity.narrativeSummary}</blockquote> : null}
                </div>

                <div className="identity-card__actions">
                  <button className="button button--quiet" type="button" onClick={() => selectIdentity(identity)}>
                    <Pencil aria-hidden="true" size={14} /> Edit
                  </button>
                  {!identity.isDefault ? (
                    <button className="button button--quiet" type="button" onClick={() => void setDefault(identity)} disabled={busy}>
                      <Star aria-hidden="true" size={14} /> Set default
                    </button>
                  ) : null}
                  <button className="button button--quiet" type="button" onClick={() => void archiveIdentity(identity)} disabled={busy}>
                    <Archive aria-hidden="true" size={14} /> Archive
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <aside className="identity-editor" aria-label="Identity editor">
        <div className="identity-editor__heading">
          <FileText aria-hidden="true" size={18} />
          <div>
            <h2>{selectedId ? "Edit identity" : "New identity"}</h2>
            <p>Preferences guide selection; they never rewrite facts.</p>
          </div>
        </div>

        <form onSubmit={saveIdentity}>
          <label htmlFor="identity-name">Identity name</label>
          <input
            id="identity-name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Product engineering leader"
            maxLength={80}
            required
          />

          <label htmlFor="identity-headline">Headline and positioning</label>
          <input
            id="identity-headline"
            value={draft.headline}
            onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))}
            placeholder="What should this identity lead with?"
            maxLength={160}
          />

          <label htmlFor="identity-roles">Target role families</label>
          <input
            id="identity-roles"
            value={draft.targetRoles}
            onChange={(event) => setDraft((current) => ({ ...current, targetRoles: event.target.value }))}
            placeholder="Engineering Manager, Staff Engineer"
          />
          <small>Separate roles with commas.</small>

          <label htmlFor="identity-skills">Skills to emphasize</label>
          <input
            id="identity-skills"
            value={draft.emphasizedSkills}
            onChange={(event) => setDraft((current) => ({ ...current, emphasizedSkills: event.target.value }))}
            placeholder="System design, mentorship, product strategy"
          />
          <small>These influence ranking, not verification.</small>

          <label htmlFor="identity-narrative">Preferred narrative</label>
          <textarea
            id="identity-narrative"
            value={draft.narrativeSummary}
            onChange={(event) => setDraft((current) => ({ ...current, narrativeSummary: event.target.value }))}
            placeholder="Describe the legitimate through-line for this identity..."
            rows={6}
            maxLength={2_000}
          />

          <button className="button button--primary identity-save" type="submit" disabled={busy}>
            {busy ? "Saving…" : selectedId ? "Save changes" : "Create identity"}
          </button>
        </form>

        <div className="identity-policy-note">
          <LockKeyhole aria-hidden="true" size={16} />
          <p><strong>Shared history stays canonical.</strong> Identity preferences cannot alter verified dates, titles, ownership, or outcomes.</p>
        </div>
      </aside>
    </div>
  );
}
