import { useState } from "react";
import { CareerVaultPage } from "./features/vault/CareerVaultPage";
import { ProfessionalIdentitiesPage } from "./features/identities/ProfessionalIdentitiesPage";
import { ConnectionsPage } from "./features/connections/ConnectionsPage";
import { OpportunitiesPage } from "./features/opportunities/OpportunitiesPage";
import { ResumeStudio } from "./features/resume/ResumeStudio";
import type { AppView } from "./types/navigation";

export function App() {
  const [view, setView] = useState<AppView>("resume");

  if (view === "vault") {
    return <CareerVaultPage onNavigate={setView} />;
  }

  if (view === "identities") {
    return <ProfessionalIdentitiesPage onNavigate={setView} />;
  }

  if (view === "connections") {
    return <ConnectionsPage onNavigate={setView} />;
  }

  if (view === "opportunities") {
    return <OpportunitiesPage onNavigate={setView} />;
  }

  return <ResumeStudio onNavigate={setView} />;
}
