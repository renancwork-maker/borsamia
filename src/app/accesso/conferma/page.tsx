import Link from "next/link";
import ConfirmAccess from "@/components/confirm-access";

export default function ConfirmPage() {
  return <main className="login-page"><h1>Conferma il tuo accesso</h1>
    <ConfirmAccess /><Link href="/accedi">Richiedi un nuovo link</Link>
  </main>;
}
