import { useState } from "react";
import { CareerVaultPage } from "./features/vault/CareerVaultPage";
import { ProfessionalIdentitiesPage } from "./features/identities/ProfessionalIdentitiesPage";
import { ConnectionsPage } from "./features/connections/ConnectionsPage";
import { OpportunitiesPage } from "./features/opportunities/OpportunitiesPage";
import { ResumeStudio } from "./features/resume/ResumeStudio";
import type {
  AppView,
  NavigateTo,
  NavigationOptions,
  VaultSection
} from "./types/navigation";

export function App() {
  const [view, setView] = useState<AppView>("resume");
  const [vaultSection, setVaultSection] = useState<VaultSection>("Review queue");

  const navigate: NavigateTo = (nextView: AppView, options?: NavigationOptions) => {
    if (nextView === "vault" && options?.vaultSection) {
      setVaultSection(options.vaultSection);
    }
    setView(nextView);
  };

  if (view === "vault") {
    return <CareerVaultPage initialSection={vaultSection} onNavigate={navigate} />;
  }

  if (view === "identities") {
    return <ProfessionalIdentitiesPage onNavigate={navigate} />;
  }

  if (view === "connections") {
    return <ConnectionsPage onNavigate={navigate} />;
  }

  if (view === "opportunities") {
    return <OpportunitiesPage onNavigate={navigate} />;
  }

  return <ResumeStudio onNavigate={navigate} />;
}
