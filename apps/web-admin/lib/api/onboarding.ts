import { readApiError } from "./errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch(path: string, init?: RequestInit) {
  const resp = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!resp.ok) throw new Error(await readApiError(resp));
  if (resp.status === 204) return null;
  const contentType = resp.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return resp.json();
}

export type OnboardingStatus = {
  completed: boolean;
  dismissed: boolean;
  steps: { agencyBasicsOk: boolean; brandingOk: boolean; adminOk: boolean };
  agency: any;
  membership: any;
  checklist: {
    firstTeamMemberAdded: boolean;
    firstListingCreated: boolean;
    gmailConnected: boolean;
    billingConfigured: boolean;
  };
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return await apiFetch(`/onboarding/status`, { method: "GET" });
}

export async function updateAgencyBasics(dto: { name: string; phone?: string; email?: string; logoUrl?: string }) {
  return await apiFetch(`/onboarding/agency-basics`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function updateBranding(dto: { descriptionShort?: string; officeAddress?: string; brandColorHex?: string }) {
  return await apiFetch(`/onboarding/branding`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function updateAdminProfile(dto: { fullName?: string; phone?: string; titleLabel?: string }) {
  return await apiFetch(`/onboarding/admin-profile`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function dismissOnboarding() {
  return await apiFetch(`/onboarding/dismiss`, { method: "POST", body: JSON.stringify({}) });
}

export async function completeOnboarding() {
  return await apiFetch(`/onboarding/complete`, { method: "POST", body: JSON.stringify({}) });
}

