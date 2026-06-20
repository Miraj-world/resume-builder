import {
  Check,
  ChevronDown,
  Download,
  FileCheck2,
  Sparkles
} from "lucide-react";
import { useState } from "react";

interface WorkspaceHeaderProps {
  atsPreview: boolean;
  identity: string;
  opportunity: string;
  exportHref: string;
  onClear: () => void;
  onIdentityChange: (identity: string) => void;
  onOpportunityChange: (opportunity: string) => void;
  onToggleAtsPreview: () => void;
  onExport: () => void;
}

const identityOptions = [
  "Software Engineer",
  "Engineering Leader",
  "Product-minded Engineer"
] as const;

const opportunityOptions = [
  "Senior Product Engineer — Northstar Labs",
  "Staff Software Engineer — Solace Systems",
  "No active opportunity"
] as const;

export function WorkspaceHeader({
  atsPreview,
  identity,
  opportunity,
  exportHref,
  onClear,
  onIdentityChange,
  onOpportunityChange,
  onToggleAtsPreview,
  onExport
}: WorkspaceHeaderProps) {
  const [openMenu, setOpenMenu] = useState<"identity" | "opportunity" | null>(null);

  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <Sparkles aria-hidden="true" size={17} strokeWidth={1.8} />
        <strong>Resume Studio</strong>
      </div>

      <div className="header-menu">
        <button
          className="select-control"
          type="button"
          aria-haspopup="menu"
          aria-expanded={openMenu === "identity"}
          onClick={() => setOpenMenu((current) => current === "identity" ? null : "identity")}
        >
          {identity}
          <ChevronDown aria-hidden="true" size={15} />
        </button>
        {openMenu === "identity" ? (
          <div className="header-menu__options" role="menu" aria-label="Professional identity">
            {identityOptions.map((option) => (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={identity === option}
                key={option}
                onClick={() => {
                  onIdentityChange(option);
                  setOpenMenu(null);
                }}
              >
                <span>{option}</span>
                {identity === option ? <Check aria-hidden="true" size={14} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="header-menu header-menu--opportunity">
        <button
          className="opportunity-control"
          type="button"
          aria-haspopup="menu"
          aria-expanded={openMenu === "opportunity"}
          onClick={() => setOpenMenu((current) => current === "opportunity" ? null : "opportunity")}
        >
          {opportunity}
          <ChevronDown aria-hidden="true" size={15} />
        </button>
        {openMenu === "opportunity" ? (
          <div className="header-menu__options" role="menu" aria-label="Active opportunity">
            {opportunityOptions.map((option) => (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={opportunity === option}
                key={option}
                onClick={() => {
                  onOpportunityChange(option);
                  setOpenMenu(null);
                }}
              >
                <span>{option}</span>
                {opportunity === option ? <Check aria-hidden="true" size={14} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="header-actions">
        <button className="button button--quiet" type="button" onClick={onClear}>
          Clear
        </button>
        <button
          className={`button button--quiet${atsPreview ? " button--active" : ""}`}
          type="button"
          onClick={onToggleAtsPreview}
          aria-pressed={atsPreview}
        >
          <FileCheck2 aria-hidden="true" size={16} />
          ATS preview
        </button>
        <a
          className="button button--primary"
          href={exportHref}
          download="alex-morgan-resume.txt"
          onClick={onExport}
        >
          <Download aria-hidden="true" size={16} />
          Export
        </a>
      </div>
    </header>
  );
}
