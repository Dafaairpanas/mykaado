"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded simple password for admin access
    if (password === "@r27Pd81") {
      localStorage.setItem("admin_auth", "true");
      router.push("/adminadit");
    } else {
      setError(true);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 mt-20">
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Admin Access</h1>
        <p className="text-[var(--color-text-muted)] text-sm mb-6 text-center">Silakan masukkan password admin.</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Password..."
            className="w-full px-4 py-3 rounded-[var(--radius-sm)] border-[var(--bw-sm)] border-[var(--color-border-main)] bg-[var(--color-bg-main)] text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          {error && <span className="text-red-500 text-sm font-semibold">Password salah!</span>}
          <Button variant="primary" type="submit">Login</Button>
        </form>
      </Card>
    </div>
  );
}
