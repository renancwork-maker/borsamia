import "server-only";
import { createHash } from "node:crypto";
import { welcomeMessage } from "@/lib/welcome-email";

export async function sendWelcomeEmail(args: {
  transaction: string;
  productId: string;
  email: string;
  collectionIds: readonly string[];
}): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const baseUrl = process.env.APP_BASE_URL;
  if (!apiKey || !from || !baseUrl) throw new Error("resend_not_configured");
  const message = welcomeMessage(args.collectionIds, baseUrl);
  const dedup = createHash("sha256").update(`${args.productId}:${args.transaction}`).digest("hex");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Stable across Hotmart retries; Resend also deduplicates matching requests.
      "Idempotency-Key": `borsamia-welcome-${dedup}`,
    },
    body: JSON.stringify({
      from,
      to: [args.email],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`resend_http_${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || typeof (payload as { id?: unknown }).id !== "string") {
    throw new Error("resend_invalid_response");
  }
  return (payload as { id: string }).id;
}
