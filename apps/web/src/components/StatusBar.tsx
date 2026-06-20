import { Check, Maximize2, Minus, Plus } from "lucide-react";

interface StatusBarProps {
  statusMessage: string;
  zoom: number;
  checksOpen: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitPage: () => void;
  onToggleChecks: () => void;
}

export function StatusBar({
  statusMessage,
  zoom,
  checksOpen,
  onZoomOut,
  onZoomIn,
  onFitPage,
  onToggleChecks
}: StatusBarProps) {
  return (
    <footer className="status-bar" aria-live="polite">
      <span>Page 1 of 1</span>
      <span className="status-divider" />
      <div className="zoom-controls" aria-label="Zoom controls">
        <button type="button" aria-label="Zoom out" onClick={onZoomOut} disabled={zoom <= 70}><Minus aria-hidden="true" size={14} /></button>
        <span>{zoom}%</span>
        <button type="button" aria-label="Zoom in" onClick={onZoomIn} disabled={zoom >= 130}><Plus aria-hidden="true" size={14} /></button>
        <button type="button" aria-label="Fit page" onClick={onFitPage}><Maximize2 aria-hidden="true" size={14} /></button>
      </div>
      <div className="validation-status">
        <Check aria-hidden="true" size={15} />
        <span>{statusMessage}</span>
      </div>
      <button
        className="text-button"
        type="button"
        aria-expanded={checksOpen}
        onClick={onToggleChecks}
      >
        {checksOpen ? "Hide checks" : "View checks"}
      </button>
      {checksOpen ? (
        <section className="checks-popover" aria-label="Resume validation checks">
          <strong>Resume checks</strong>
          <p><Check aria-hidden="true" size={14} /> Claims have supporting evidence</p>
          <p><Check aria-hidden="true" size={14} /> One-page layout has no overflow</p>
          <p><Check aria-hidden="true" size={14} /> ATS reading order is valid</p>
        </section>
      ) : null}
    </footer>
  );
}
