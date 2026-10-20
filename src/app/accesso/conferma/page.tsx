import { redirect } from "next/navigation";
/** Old sign-in links have been replaced with 6-digit verification codes. */
export default function LegacyConfirmPage() { redirect("/accedi"); }
