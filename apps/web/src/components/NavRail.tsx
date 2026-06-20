import {
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  FolderOpen,
  Settings,
  UsersRound
} from "lucide-react";
import type { AppView } from "../types/navigation";

interface NavRailProps {
  selected: AppView;
  onNavigate: (view: AppView) => void;
}

const primaryItems = [
  { label: "Career Vault", icon: FolderOpen, view: "vault" },
  { label: "Opportunities", icon: BriefcaseBusiness, view: "opportunities" },
  { label: "Resumes", icon: FileText, view: "resume" },
  { label: "Connections", icon: UsersRound, view: "connections" }
] as const;

export function NavRail({ selected, onNavigate }: NavRailProps) {
  return (
    <nav className="nav-rail" aria-label="Primary navigation">
      <button
        className="brand-mark"
        type="button"
        aria-label="Resume Builder home"
        onClick={() => onNavigate("vault")}
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
              onClick={() => onNavigate(item.view)}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-items nav-items--utility">
        <button className="nav-item" type="button" aria-label="Settings">
          <Settings aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </button>
        <button className="nav-item" type="button" aria-label="Help">
          <CircleHelp aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>Help</span>
        </button>
      </div>

      <button className="profile-control" type="button" aria-label="Open profile menu">
        <span className="avatar" aria-hidden="true">AM</span>
        <span>Alex Morgan</span>
      </button>
    </nav>
  );
}
