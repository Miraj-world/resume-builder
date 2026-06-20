import { BriefcaseBusiness } from "lucide-react";
import { ManagementHeader } from "../../components/ManagementHeader";
import { NavRail } from "../../components/NavRail";
import type { AppView } from "../../types/navigation";

interface OpportunitiesPageProps {
  onNavigate: (view: AppView) => void;
}

export function OpportunitiesPage({ onNavigate }: OpportunitiesPageProps) {
  return (
    <div className="management-shell management-shell--simple">
      <NavRail selected="opportunities" onNavigate={onNavigate} />
      <ManagementHeader
        title="Opportunities"
        onAsk={() => onNavigate("vault")}
        onAddSource={() => onNavigate("vault")}
      />
      <main className="simple-workspace">
        <BriefcaseBusiness aria-hidden="true" size={28} strokeWidth={1.6} />
        <h2>Opportunity intelligence is next</h2>
        <p>
          The Career Vault foundation is ready for job-description matching and
          project recommendations.
        </p>
        <button className="button button--primary" type="button" onClick={() => onNavigate("vault")}>
          Review Career Vault
        </button>
      </main>
    </div>
  );
}
