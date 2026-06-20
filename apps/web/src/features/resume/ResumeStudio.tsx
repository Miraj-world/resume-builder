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
import type { NavigateTo } from "../../types/navigation";

interface ResumeStudioProps {
  onNavigate: NavigateTo;
}

export function ResumeStudio({ onNavigate }: ResumeStudioProps) {
  const [suggestionState, setSuggestionState] = useState<SuggestionState>("pending");
  const [selectedBullet, setSelectedBullet] = useState(originalBullet);
  const [atsPreview, setAtsPreview] = useState(false);
  const [identity, setIdentity] = useState("Software Engineer");
  const [opportunity, setOpportunity] = useState("Senior Product Engineer — Northstar Labs");
  const [zoom, setZoom] = useState(100);
  const [checksOpen, setChecksOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [conversationKey, setConversationKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState("No validation issues");
  const exportText = `ALEX MORGAN\n${identity}\nSeattle, WA | alex.morgan@example.com | linkedin.com/in/alexmorgan\n\nTARGET OPPORTUNITY\n${opportunity}\n\nSUMMARY\nProduct-minded engineer designing reliable systems and delivering customer impact.\n\nEXPERIENCE\nNorthstar Labs — Senior Product Engineer\n${selectedBullet}\n\nBrightline Technologies — Software Engineer\nBuilt services for billing and subscriptions using Node.js and DynamoDB.\n\nEDUCATION\nUniversity of Washington — B.S. in Computer Science\n`;
  const exportHref = `data:text/plain;charset=utf-8,${encodeURIComponent(exportText)}`;

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

  const handleClear = () => {
    setSelectedBullet(originalBullet);
    setSuggestionState("pending");
    setAtsPreview(false);
    setIdentity("Software Engineer");
    setOpportunity("Senior Product Engineer — Northstar Labs");
    setZoom(100);
    setChecksOpen(false);
    setInspectorOpen(true);
    setConversationKey((current) => current + 1);
    setStatusMessage("Workspace reset to the saved demo version");
  };

  const handleExport = () => {
    setStatusMessage("Exported ATS-ready text resume");
  };

  return (
    <div className="app-shell">
      <NavRail selected="resume" onNavigate={onNavigate} />
      <WorkspaceHeader
        atsPreview={atsPreview}
        identity={identity}
        opportunity={opportunity}
        exportHref={exportHref}
        onClear={handleClear}
        onIdentityChange={(nextIdentity) => {
          setIdentity(nextIdentity);
          setStatusMessage(`Using ${nextIdentity} identity`);
        }}
        onOpportunityChange={(nextOpportunity) => {
          setOpportunity(nextOpportunity);
          setStatusMessage(`Targeting ${nextOpportunity}`);
        }}
        onToggleAtsPreview={() => setAtsPreview((current) => !current)}
        onExport={handleExport}
      />
      <ChatPanel key={conversationKey} />
      <ResumeCanvas
        selectedBullet={selectedBullet}
        selected={suggestionState === "pending"}
        atsPreview={atsPreview}
        zoom={zoom}
      />
      <SuggestionInspector
        original={originalBullet}
        proposed={proposedBullet}
        state={suggestionState}
        onAccept={handleAccept}
        onReject={handleReject}
        onReset={handleReset}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        onOpen={() => setInspectorOpen(true)}
      />
      <StatusBar
        statusMessage={statusMessage}
        zoom={zoom}
        checksOpen={checksOpen}
        onZoomOut={() => setZoom((current) => Math.max(70, current - 10))}
        onZoomIn={() => setZoom((current) => Math.min(130, current + 10))}
        onFitPage={() => {
          setZoom(90);
          setStatusMessage("Resume fitted to the available canvas");
        }}
        onToggleChecks={() => setChecksOpen((current) => !current)}
      />
    </div>
  );
}
