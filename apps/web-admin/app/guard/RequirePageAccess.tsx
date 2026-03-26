"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "../../lib/use-me";
import type { UserRole } from "../../utils/permissions";

export function RequirePageAccess(props: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { state, role } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  const ok = role ? props.allowedRoles.includes(role) : false;

  useEffect(() => {
    if (state.status === "ok" && !ok) {
      // Prefer UX: show message, but also prevent “staying” on forbidden URL.
      // For static export this is client-side only.
      router.replace(props.redirectTo ?? "/");
    }
  }, [ok, router, state.status, pathname, props.redirectTo]);

  if (state.status === "loading") {
    return <p className="admin-lead">Checking permissions…</p>;
  }

  if (state.status !== "ok") {
    return (
      <div>
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          You must be signed in to access this page.
        </p>
        <Link href="/login/" className="admin-btn admin-btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  if (!ok) {
    return (
      <div>
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          You don’t have permission to access this page.
        </p>
        <Link href="/" className="admin-btn admin-btn-ghost">
          Go home
        </Link>
      </div>
    );
  }

  return <>{props.children}</>;
}

