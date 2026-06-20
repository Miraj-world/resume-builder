import { Check, Maximize2, Minus, Plus } from "lucide-react";

interface StatusBarProps {
  statusMessage: string;
}

export function StatusBar({ statusMessage }: StatusBarProps) {
  return (
    <footer className="status-bar" aria-live="polite">
      <span>Page 1 of 1</span>
      <span className="status-divider" />
      <div className="zoom-controls" aria-label="Zoom controls">
        <button type="button" aria-label="Zoom out"><Minus aria-hidden="true" size={14} /></button>
        <span>100%</span>
        <button type="button" aria-label="Zoom in"><Plus aria-hidden="true" size={14} /></button>
        <button type="button" aria-label="Fit page"><Maximize2 aria-hidden="true" size={14} /></button>
      </div>
      <div className="validation-status">
        <Check aria-hidden="true" size={15} />
        <span>{statusMessage}</span>
      </div>
      <button className="text-button" type="button">View checks</button>
    </footer>
  );
}
