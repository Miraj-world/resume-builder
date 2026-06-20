import { ChevronDown, MessageSquareText, Sparkles } from "lucide-react";

interface ManagementHeaderProps {
  title: string;
  onAsk: () => void;
  onAddSource: () => void;
}

export function ManagementHeader({
  title,
  onAsk,
  onAddSource
}: ManagementHeaderProps) {
  return (
    <header className="management-header">
      <div className="management-title">
        <Sparkles aria-hidden="true" size={18} strokeWidth={1.8} />
        <h1>{title}</h1>
      </div>
      <div className="management-header__actions">
        <button className="button button--quiet" type="button" onClick={onAsk}>
          <MessageSquareText aria-hidden="true" size={16} />
          Ask the Vault
        </button>
        <button className="button button--primary" type="button" onClick={onAddSource}>
          Add source
          <ChevronDown aria-hidden="true" size={14} />
        </button>
      </div>
    </header>
  );
}
