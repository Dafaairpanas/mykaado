import Link from "next/link";
import { Card } from "@/components/ui/card";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-[var(--color-bg-card)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[6px_6px_0px_var(--color-shadow-main)]">
        <div className="w-16 h-16 mx-auto mb-6 bg-[var(--color-bg-nav)] rounded-full flex items-center justify-center border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
          <WifiOff className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4 text-[var(--color-text-main)]">Koneksi Terputus</h1>
        <p className="text-lg text-[var(--color-text-muted)] mb-8 font-medium">
          Sepertinya kamu sedang tidak terhubung ke internet. Beberapa fitur mungkin tidak bisa diakses saat ini.
        </p>
        <Link 
          href="/"
          className="inline-flex justify-center items-center w-full px-6 py-3 bg-[var(--color-text-main)] text-[var(--color-bg-main)] font-bold rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] hover:bg-[var(--color-accent)] hover:text-[var(--color-text-main)] transition-colors"
        >
          Coba Muat Ulang Halaman
        </Link>
      </Card>
    </div>
  );
}
