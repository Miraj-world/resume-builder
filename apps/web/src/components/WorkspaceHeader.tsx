import {
  ChevronDown,
  Download,
  FileCheck2,
  Sparkles
} from "lucide-react";

interface WorkspaceHeaderProps {
  atsPreview: boolean;
  onToggleAtsPreview: () => void;
  onExport: () => void;
}

export function WorkspaceHeader({
  atsPreview,
  onToggleAtsPreview,
  onExport
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <Sparkles aria-hidden="true" size={17} strokeWidth={1.8} />
        <strong>Resume Studio</strong>
      </div>

      <button className="select-control" type="button">
        Software Engineer
        <ChevronDown aria-hidden="true" size={15} />
      </button>

      <button className="opportunity-control" type="button">
        Senior Product Engineer — Northstar Labs
        <ChevronDown aria-hidden="true" size={15} />
      </button>

      <div className="header-actions">
        <button className="button button--quiet" type="button">
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
        <button className="button button--primary" type="button" onClick={onExport}>
          <Download aria-hidden="true" size={16} />
          Export
        </button>
      </div>
    </header>
  );
}
