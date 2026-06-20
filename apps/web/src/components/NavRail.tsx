import {
  BriefcaseBusiness,
  CircleHelp,
  X,
  FileText,
  FolderOpen,
  Settings,
  UsersRound
} from "lucide-react";
import { useState } from "react";
import type { AppView, NavigateTo } from "../types/navigation";

interface NavRailProps {
  selected: AppView;
  onNavigate: NavigateTo;
}

const primaryItems = [
  { label: "Career Vault", icon: FolderOpen, view: "vault" },
  { label: "Opportunities", icon: BriefcaseBusiness, view: "opportunities" },
  { label: "Resumes", icon: FileText, view: "resume" },
  { label: "Connections", icon: UsersRound, view: "connections" }
] as const;

export function NavRail({ selected, onNavigate }: NavRailProps) {
  const [openPanel, setOpenPanel] = useState<"help" | "profile" | null>(null);

  const navigate: NavigateTo = (view, options) => {
    setOpenPanel(null);
    onNavigate(view, options);
  };

  return (
    <nav className="nav-rail" aria-label="Primary navigation">
      <button
        className="brand-mark"
        type="button"
        aria-label="Resume Builder home"
        onClick={() => navigate("vault", { vaultSection: "Overview" })}
      >
        RB
      </button>

      <div className="nav-items">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isSelected = selected === item.view;
          return (
            <button
              className={`nav-item${isSelected ? " nav-item--selected" : ""}`}
              type="button"
              key={item.label}
              aria-label={item.label}
              aria-current={isSelected ? "page" : undefined}
              onClick={() => navigate(item.view)}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-items nav-items--utility">
        <button
          className="nav-item"
          type="button"
          aria-label="Settings"
          onClick={() => navigate("connections")}
        >
          <Settings aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </button>
        <button
          className={`nav-item${openPanel === "help" ? " nav-item--selected" : ""}`}
          type="button"
          aria-label="Help"
          aria-expanded={openPanel === "help"}
          onClick={() => setOpenPanel((current) => current === "help" ? null : "help")}
        >
          <CircleHelp aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>Help</span>
        </button>
      </div>

      {openPanel === "help" ? (
        <section className="rail-popover" aria-label="Help">
          <div className="rail-popover__heading">
            <strong>Resume Builder help</strong>
            <button type="button" aria-label="Close help" onClick={() => setOpenPanel(null)}>
              <X aria-hidden="true" size={15} />
            </button>
          </div>
          <p>Use the left rail to move between your evidence, opportunities, resumes, and provider connections.</p>
          <button className="text-button" type="button" onClick={() => navigate("vault", { vaultSection: "Overview" })}>
            Open Career Vault overview
          </button>
        </section>
      ) : null}

      {openPanel === "profile" ? (
        <section className="rail-popover rail-popover--profile" aria-label="Profile menu">
          <div className="rail-popover__heading">
            <strong>Alex Morgan</strong>
            <button type="button" aria-label="Close profile menu" onClick={() => setOpenPanel(null)}>
              <X aria-hidden="true" size={15} />
            </button>
          </div>
          <p>Local development workspace</p>
          <button className="text-button" type="button" onClick={() => navigate("connections")}>
            Manage connections
          </button>
        </section>
      ) : null}

      <button
        className="profile-control"
        type="button"
        aria-label="Open profile menu"
        aria-expanded={openPanel === "profile"}
        onClick={() => setOpenPanel((current) => current === "profile" ? null : "profile")}
      >
        <span className="avatar" aria-hidden="true">AM</span>
        <span>Alex Morgan</span>
      </button>
    </nav>
  );
}
