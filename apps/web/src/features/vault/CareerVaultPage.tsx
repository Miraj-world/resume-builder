import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent
} from "react";
import type { CareerFact } from "@resume-builder/contracts";
import {
  Bolt,
  BriefcaseBusiness,
  Database,
  FileText,
  Folder,
  House,
  IdCard,
  LockKeyhole,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { ManagementHeader } from "../../components/ManagementHeader";
import { NavRail } from "../../components/NavRail";
import {
  ApiError,
  apiRequest,
  type VaultBootstrap
} from "../../lib/api";
import type { AppView } from "../../types/navigation";

interface CareerVaultPageProps {
  onNavigate: (view: AppView) => void;
}

type ReviewTab = "pending" | "accepted" | "conflicts";

const emptyVault: VaultBootstrap = {
  summary: {
    sources: 0,
    facts: 0,
    pendingReview: 0,
    autoAccepted: 0,
    verified: 0,
    conflicts: 0
  },
  sources: [],
  facts: []
};

const sectionItems = [
  { label: "Overview", icon: House },
  { label: "Review queue", icon: ShieldCheck, selected: true },
  { label: "Sources", icon: Database },
  { label: "Experiences", icon: BriefcaseBusiness },
  { label: "Projects", icon: Folder },
  { label: "Skills", icon: Bolt },
  { label: "Identities", icon: IdCard },
  { label: "Private context", icon: LockKeyhole }
] as const;

const predicateLabels: Readonly<Record<string, string>> = {
  "experience.title": "Employment title",
  "experience.date_range": "Employment dates",
  "achievement.quantified_claim": "Quantified achievement",
  "project.architecture_claim": "Inferred architecture",
  "skill.observed": "Observed skill"
};

function factLabel(fact: CareerFact): string {
  return predicateLabels[fact.predicate] ?? fact.predicate.replaceAll(".", " ");
}

function factValue(fact: CareerFact): string {
  return typeof fact.value === "string" ? fact.value : JSON.stringify(fact.value);
}

interface FactReviewRowProps {
  fact: CareerFact;
  selected: boolean;
  correcting: boolean;
  correctionText: string;
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onCorrect: () => void;
  onCorrectionTextChange: (value: string) => void;
  onSaveCorrection: () => void;
  onCancelCorrection: () => void;
  busy: boolean;
}

function FactReviewRow({
  fact,
  selected,
  correcting,
  correctionText,
  onSelect,
  onAccept,
  onReject,
  onCorrect,
  onCorrectionTextChange,
  onSaveCorrection,
  onCancelCorrection,
  busy
}: FactReviewRowProps) {
  const evidence = fact.evidence[0];
  const isReviewable = fact.verificationStatus === "pending_review";

  return (
    <article className={`fact-row${selected ? " fact-row--selected" : ""}`}>
      <div className="fact-row__summary">
        <button
          className={`fact-selector${selected ? " fact-selector--selected" : ""}`}
          type="button"
          onClick={onSelect}
          aria-label={`View evidence for ${factLabel(fact)}`}
        >
          <span />
        </button>
        <div className="fact-primary">
          <strong>{factLabel(fact)}</strong>
          <p>{factValue(fact)}</p>
        </div>
        <div className="fact-source">
          <FileText aria-hidden="true" size={15} />
          <span>{evidence?.sourceKind.replaceAll("_", " ") ?? "Imported source"}</span>
          <small>{evidence?.locator.value}</small>
        </div>
        <div className="fact-confidence">
          <strong>{Math.round(fact.confidence * 100)}%</strong>
          <span>{fact.evidenceType === "inferred" ? "Inferred" : "Text match"}</span>
        </div>
        <div className={`risk-label risk-label--${fact.riskLevel}`}>
          <span aria-hidden="true" />
          {fact.riskLevel[0]?.toUpperCase()}{fact.riskLevel.slice(1)} risk
        </div>
        <div className="fact-actions">
          {isReviewable ? (
            <>
              <button className="button button--quiet" type="button" onClick={onReject} disabled={busy}>
                Reject
              </button>
              <button className="button button--quiet" type="button" onClick={onCorrect} disabled={busy}>
                Correct
              </button>
              <button className="button button--primary" type="button" onClick={onAccept} disabled={busy}>
                Accept
              </button>
            </>
          ) : (
            <span className="fact-state">
              {fact.verificationStatus.replaceAll("_", " ")}
            </span>
          )}
        </div>
      </div>

      {selected ? (
        <div className="fact-evidence">
          <div className="fact-evidence__heading">
            <strong>Evidence from source</strong>
            <span>{evidence?.locator.value}</span>
          </div>
          <blockquote>{evidence?.safeExcerpt ?? factValue(fact)}</blockquote>
          <p>
            <strong>Why {fact.riskLevel} risk?</strong>{" "}
            {fact.riskLevel === "high"
              ? "This claim can materially affect employment history, ownership, or measurable impact."
              : "This interpretation needs context before it can become a resume claim."}
          </p>
          {correcting ? (
            <div className="correction-editor">
              <label htmlFor={`correction-${fact.id}`}>Corrected value</label>
              <input
                id={`correction-${fact.id}`}
                value={correctionText}
                onChange={(event) => onCorrectionTextChange(event.target.value)}
              />
              <button className="button button--quiet" type="button" onClick={onCancelCorrection}>
                Cancel
              </button>
              <button className="button button--primary" type="button" onClick={onSaveCorrection} disabled={busy}>
                Save correction
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function CareerVaultPage({ onNavigate }: CareerVaultPageProps) {
  const [vault, setVault] = useState<VaultBootstrap>(emptyVault);
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [selectedFactId, setSelectedFactId] = useState<string>();
  const [correctingFactId, setCorrectingFactId] = useState<string>();
  const [correctionText, setCorrectionText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Loading Career Vault…");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const loadVault = useCallback(async () => {
    try {
      const nextVault = await apiRequest<VaultBootstrap>("/v1/vault/bootstrap");
      setVault(nextVault);
      setMessage(
        nextVault.summary.sources === 0
          ? "Import a resume to begin building your Career Vault."
          : "Career Vault is up to date."
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Career Vault could not be loaded."
      );
    }
  }, []);

  useEffect(() => {
    // This request synchronizes the page with the external Career Vault store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVault();
  }, [loadVault]);

  const visibleFacts = vault.facts.filter((fact) => {
    if (tab === "pending") return fact.verificationStatus === "pending_review";
    if (tab === "conflicts") return fact.verificationStatus === "in_conflict";
    return ["auto_accepted", "user_verified"].includes(fact.verificationStatus);
  });
  const selectedFact =
    visibleFacts.find((fact) => fact.id === selectedFactId) ?? visibleFacts[0];

  const handleReview = async (
    fact: CareerFact,
    action: "accept" | "reject" | "correct",
    value?: string
  ) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/facts/${fact.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, value })
      });
      setCorrectingFactId(undefined);
      setCorrectionText("");
      setSelectedFactId(undefined);
      setMessage(
        action === "reject"
          ? "Fact rejected and excluded from generation."
          : "Fact verified and saved to the Career Vault."
      );
      await loadVault();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The fact could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile && resumeText.trim().length < 10) {
      setMessage("Choose a resume file or paste at least 10 characters.");
      return;
    }

    setBusy(true);
    setMessage("Extracting career information…");
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        await apiRequest("/v1/sources/upload", {
          method: "POST",
          body: formData
        });
      } else {
        await apiRequest("/v1/sources/text", {
          method: "POST",
          body: JSON.stringify({ text: resumeText, name: "Pasted resume text" })
        });
      }

      setSelectedFile(undefined);
      setResumeText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTab("pending");
      setMessage("Career information extracted. Review important claims before use.");
      await loadVault();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "The resume could not be processed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="management-shell">
      <NavRail selected="vault" onNavigate={onNavigate} />
      <ManagementHeader
        title="Career Vault"
        onAsk={() => setMessage("Ask the Vault will use only permitted Career Vault context.")}
        onAddSource={() => textAreaRef.current?.focus()}
      />

      <aside className="secondary-rail" aria-label="Career Vault sections">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`secondary-nav-item${"selected" in item && item.selected ? " secondary-nav-item--selected" : ""}`}
              type="button"
              key={item.label}
              onClick={() => {
                if (item.label === "Identities") onNavigate("identities");
              }}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.label === "Review queue" && vault.summary.pendingReview > 0 ? (
                <strong>{vault.summary.pendingReview}</strong>
              ) : null}
            </button>
          );
        })}
      </aside>

      <main className="vault-workspace" id="main">
        <header className="workspace-intro">
          <h2>Review important facts</h2>
          <p>Confirm claims that could materially affect your resume.</p>
          <span aria-live="polite">{message}</span>
        </header>

        <div className="review-tabs" role="tablist" aria-label="Fact review states">
          <button type="button" role="tab" aria-selected={tab === "pending"} onClick={() => setTab("pending")}>
            Needs review ({vault.summary.pendingReview})
          </button>
          <button type="button" role="tab" aria-selected={tab === "accepted"} onClick={() => setTab("accepted")}>
            Auto-accepted ({vault.summary.autoAccepted + vault.summary.verified})
          </button>
          <button type="button" role="tab" aria-selected={tab === "conflicts"} onClick={() => setTab("conflicts")}>
            Conflicts ({vault.summary.conflicts})
          </button>
        </div>

        <div className="fact-table" aria-label="Career facts">
          <div className="fact-table__header" aria-hidden="true">
            <span />
            <span>Fact</span>
            <span>Source</span>
            <span>Confidence</span>
            <span>Risk</span>
            <span>Actions</span>
          </div>
          {visibleFacts.length === 0 ? (
            <div className="fact-empty">
              <ShieldCheck aria-hidden="true" size={24} strokeWidth={1.6} />
              <strong>
                {vault.summary.sources === 0
                  ? "Import a resume to create your review queue."
                  : "No facts in this review state."}
              </strong>
            </div>
          ) : (
            visibleFacts.map((fact) => (
              <FactReviewRow
                key={fact.id}
                fact={fact}
                selected={selectedFact?.id === fact.id}
                correcting={correctingFactId === fact.id}
                correctionText={correctionText}
                onSelect={() => setSelectedFactId(fact.id)}
                onAccept={() => void handleReview(fact, "accept")}
                onReject={() => void handleReview(fact, "reject")}
                onCorrect={() => {
                  setSelectedFactId(fact.id);
                  setCorrectingFactId(fact.id);
                  setCorrectionText(factValue(fact));
                }}
                onCorrectionTextChange={setCorrectionText}
                onSaveCorrection={() => void handleReview(fact, "correct", correctionText)}
                onCancelCorrection={() => setCorrectingFactId(undefined)}
                busy={busy}
              />
            ))
          )}
        </div>
      </main>

      <aside className="import-panel" id="import-source" aria-label="Import source">
        <h2>Import source</h2>
        <form onSubmit={handleImport}>
          <label
            className={`upload-dropzone${selectedFile ? " upload-dropzone--selected" : ""}`}
            htmlFor="resume-file"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadCloud aria-hidden="true" size={28} strokeWidth={1.6} />
            <strong>{selectedFile ? selectedFile.name : "Drop a resume here or choose a file"}</strong>
            <span>PDF, DOC, DOCX, or TXT</span>
          </label>
          <input
            className="sr-only"
            id="resume-file"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(event) => setSelectedFile(event.target.files?.[0])}
          />

          <div className="or-divider"><span>or paste resume text</span></div>

          <label className="sr-only" htmlFor="resume-text">Resume text</label>
          <textarea
            id="resume-text"
            ref={textAreaRef}
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste your resume text here..."
            rows={7}
          />
          <small>{resumeText.length.toLocaleString()} characters</small>

          <button className="button button--primary import-submit" type="submit" disabled={busy}>
            {busy ? "Extracting…" : "Extract career information"}
          </button>
        </form>
        <p className="reference-note">
          <LockKeyhole aria-hidden="true" size={15} />
          Your master resume is reference-only and will not be modified.
        </p>
      </aside>
    </div>
  );
}
