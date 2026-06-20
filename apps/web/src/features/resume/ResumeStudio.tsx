import { useState } from "react";
import { ChatPanel } from "../../components/ChatPanel";
import { NavRail } from "../../components/NavRail";
import { ResumeCanvas } from "../../components/ResumeCanvas";
import {
  SuggestionInspector,
  type SuggestionState
} from "../../components/SuggestionInspector";
import { StatusBar } from "../../components/StatusBar";
import { WorkspaceHeader } from "../../components/WorkspaceHeader";
import { originalBullet, proposedBullet } from "../../data/resume";
import type { AppView } from "../../types/navigation";

interface ResumeStudioProps {
  onNavigate: (view: AppView) => void;
}

export function ResumeStudio({ onNavigate }: ResumeStudioProps) {
  const [suggestionState, setSuggestionState] = useState<SuggestionState>("pending");
  const [selectedBullet, setSelectedBullet] = useState(originalBullet);
  const [atsPreview, setAtsPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState("No validation issues");

  const handleAccept = (value: string, modified: boolean) => {
    setSelectedBullet(value);
    setSuggestionState(modified ? "modified" : "accepted");
    setStatusMessage("New resume version created");
  };

  const handleReject = () => {
    setSuggestionState("rejected");
    setStatusMessage("Suggestion rejected — resume unchanged");
  };

  const handleReset = () => {
    setSelectedBullet(originalBullet);
    setSuggestionState("pending");
    setStatusMessage("No validation issues");
  };

  return (
    <div className="app-shell">
      <NavRail selected="resume" onNavigate={onNavigate} />
      <WorkspaceHeader
        atsPreview={atsPreview}
        onToggleAtsPreview={() => setAtsPreview((current) => !current)}
        onExport={() =>
          setStatusMessage("Export validation passed — demo export ready")
        }
      />
      <ChatPanel />
      <ResumeCanvas
        selectedBullet={selectedBullet}
        selected={suggestionState === "pending"}
        atsPreview={atsPreview}
      />
      <SuggestionInspector
        original={originalBullet}
        proposed={proposedBullet}
        state={suggestionState}
        onAccept={handleAccept}
        onReject={handleReject}
        onReset={handleReset}
      />
      <StatusBar statusMessage={statusMessage} />
    </div>
  );
}
