"use client";

import { useEffect, useState } from "react";
import { FlashMessage, type Flash } from "./Flash";
import { Modal } from "./Modal";
import { completeOnboarding, dismissOnboarding, getOnboardingStatus, updateAdminProfile, updateAgencyBasics, updateBranding, type OnboardingStatus } from "../../lib/api/onboarding";
import { useMe } from "../../lib/use-me";

type Step = 1 | 2 | 3 | 4;

export function OnboardingWizard(props: { autoOpen?: boolean }) {
  const { role } = useMe();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [flash, setFlash] = useState<Flash>(null);
  const [saving, setSaving] = useState(false);

  const [agencyBasics, setAgencyBasics] = useState({ name: "", phone: "", email: "", logoUrl: "" });
  const [branding, setBranding] = useState({ descriptionShort: "", officeAddress: "", brandColorHex: "" });
  const [admin, setAdmin] = useState({ fullName: "", phone: "", titleLabel: "" });

  async function refresh() {
    const s = await getOnboardingStatus();
    setStatus(s);
    setAgencyBasics({
      name: s.agency?.name ?? "",
      phone: s.agency?.phone ?? "",
      email: s.agency?.email ?? "",
      logoUrl: s.agency?.logoUrl ?? "",
    });
    setBranding({
      descriptionShort: s.agency?.descriptionShort ?? "",
      officeAddress: s.agency?.officeAddress ?? "",
      brandColorHex: s.agency?.brandColorHex ?? "",
    });
    setAdmin({
      fullName: s.membership?.user?.fullName ?? "",
      phone: s.membership?.phone ?? "",
      titleLabel: s.membership?.titleLabel ?? "",
    });
    return s;
  }

  useEffect(() => {
    refresh()
      .then((s) => {
        if (!props.autoOpen) return;
        if (role !== "OWNER" && role !== "MANAGER") return;
        if (s.completed) return;
        if (s.dismissed) return;
        setOpen(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canUse = role === "OWNER" || role === "MANAGER";
  if (!canUse) return null;

  return (
    <>
      {status && !status.completed ? (
        <div className="admin-card" style={{ maxWidth: "none", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 800 }}>Finish setup</div>
              <div style={{ color: "var(--admin-muted)", fontSize: 13 }}>
                Complete your agency setup to unlock a smoother workflow.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="admin-btn admin-btn-primary" type="button" onClick={() => setOpen(true)} style={{ minHeight: "2.25rem" }}>
                Resume setup
              </button>
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={async () => {
                  try {
                    await dismissOnboarding();
                    await refresh();
                    setFlash({ type: "success", message: "Setup wizard dismissed for now." });
                    setOpen(false);
                  } catch (e: any) {
                    setFlash({ type: "error", message: e?.message ?? "Failed to dismiss setup wizard." });
                  }
                }}
                style={{ minHeight: "2.25rem" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        title="Agency setup"
        open={open}
        onClose={() => {
          if (saving) return;
          setOpen(false);
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  await dismissOnboarding();
                  setOpen(false);
                  await refresh();
                  setFlash({ type: "success", message: "Setup wizard dismissed for now." });
                } catch (e: any) {
                  setFlash({ type: "error", message: e?.message ?? "Failed to dismiss setup wizard." });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Skip for now
            </button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {step > 1 ? (
                <button className="admin-btn admin-btn-ghost" type="button" disabled={saving} onClick={() => setStep((step - 1) as Step)}>
                  Back
                </button>
              ) : null}
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    if (step === 1) {
                      await updateAgencyBasics({
                        name: agencyBasics.name,
                        phone: agencyBasics.phone || undefined,
                        email: agencyBasics.email || undefined,
                        logoUrl: agencyBasics.logoUrl || undefined,
                      });
                      await refresh();
                      setStep(2);
                    } else if (step === 2) {
                      await updateBranding({
                        descriptionShort: branding.descriptionShort || undefined,
                        officeAddress: branding.officeAddress || undefined,
                        brandColorHex: branding.brandColorHex || undefined,
                      });
                      await refresh();
                      setStep(3);
                    } else if (step === 3) {
                      await updateAdminProfile({
                        fullName: admin.fullName || undefined,
                        phone: admin.phone || undefined,
                        titleLabel: admin.titleLabel || undefined,
                      });
                      await refresh();
                      setStep(4);
                    } else {
                      await completeOnboarding();
                      await refresh();
                      setFlash({ type: "success", message: "Setup completed." });
                      setOpen(false);
                    }
                  } catch (e: any) {
                    setFlash({ type: "error", message: e?.message ?? "Save failed" });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {step < 4 ? (saving ? "Saving…" : "Save & continue") : saving ? "Finishing…" : "Finish setup"}
              </button>
            </div>
          </div>
        }
      >
        <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ color: "var(--admin-muted)", fontSize: 13 }}>Step {step} of 4</span>
          {status ? (
            <span style={{ color: "var(--admin-muted)", fontSize: 13 }}>
              · Agency basics {status.steps.agencyBasicsOk ? "✓" : "—"} · Branding {status.steps.brandingOk ? "✓" : "—"} · Admin {status.steps.adminOk ? "✓" : "—"}
            </span>
          ) : null}
        </div>

        {step === 1 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div className="admin-field">
              <label>Agency name *</label>
              <input value={agencyBasics.name} onChange={(e) => setAgencyBasics({ ...agencyBasics, name: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Agency phone</label>
              <input value={agencyBasics.phone} onChange={(e) => setAgencyBasics({ ...agencyBasics, phone: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Agency email</label>
              <input value={agencyBasics.email} onChange={(e) => setAgencyBasics({ ...agencyBasics, email: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Logo URL (placeholder)</label>
              <input value={agencyBasics.logoUrl} onChange={(e) => setAgencyBasics({ ...agencyBasics, logoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <p className="admin-lead" style={{ margin: 0 }}>
              MVP: logo upload can be added later; use a URL or leave blank.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div className="admin-field">
              <label>Short description</label>
              <input value={branding.descriptionShort} onChange={(e) => setBranding({ ...branding, descriptionShort: e.target.value })} placeholder="e.g. Boutique agency in Athens..." />
            </div>
            <div className="admin-field">
              <label>Office address</label>
              <input value={branding.officeAddress} onChange={(e) => setBranding({ ...branding, officeAddress: e.target.value })} placeholder="Street, City, Country" />
            </div>
            <div className="admin-field">
              <label>Primary brand color (hex)</label>
              <input value={branding.brandColorHex} onChange={(e) => setBranding({ ...branding, brandColorHex: e.target.value })} placeholder="#2563eb" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div className="admin-field">
              <label>Your full name</label>
              <input value={admin.fullName} onChange={(e) => setAdmin({ ...admin, fullName: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Your phone</label>
              <input value={admin.phone} onChange={(e) => setAdmin({ ...admin, phone: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Title / role label</label>
              <input value={admin.titleLabel} onChange={(e) => setAdmin({ ...admin, titleLabel: e.target.value })} placeholder="Owner / Manager / Director..." />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div style={{ display: "grid", gap: 10 }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              Setup checklist (live signals):
            </p>
            <ul className="admin-list" style={{ margin: 0 }}>
              <li>First team member added {status?.checklist.firstTeamMemberAdded ? "✓" : "—"}</li>
              <li>First listing created {status?.checklist.firstListingCreated ? "✓" : "—"}</li>
              <li>Gmail connected {status?.checklist.gmailConnected ? "✓" : "—"}</li>
              <li>Billing configured {status?.checklist.billingConfigured ? "✓" : "—"}</li>
            </ul>
            <p className="admin-lead" style={{ margin: 0 }}>
              You can finish setup now, or come back later from the dashboard banner.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

