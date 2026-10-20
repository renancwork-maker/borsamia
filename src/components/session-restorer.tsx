"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Expired access cookie? Recover a remembered, verified browser session if possible. */
export default function SessionRestorer() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void fetch("/api/access/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(async response => response.ok ? await response.json() as { authenticated?: boolean } : null)
      .then(data => { if (active && data?.authenticated) router.refresh(); })
      .catch(() => {});
    return () => { active = false; };
  }, [router]);
  return null;
}
