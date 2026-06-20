export type AppView =
  | "vault"
  | "identities"
  | "opportunities"
  | "resume"
  | "connections";

export type VaultSection =
  | "Overview"
  | "Review queue"
  | "Sources"
  | "Experiences"
  | "Projects"
  | "Skills"
  | "Private context";

export interface NavigationOptions {
  vaultSection?: VaultSection;
}

export type NavigateTo = (view: AppView, options?: NavigationOptions) => void;
