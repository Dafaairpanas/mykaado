"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/admin/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">Admin Dashboard</h1>
          <p className="text-[var(--color-text-muted)]">Manajemen master data MyKaado.</p>
        </div>
        <Button variant="danger" className="bg-red-500 text-white" onClick={handleLogout}>Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-2">Manage Kotoba</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-4">Edit atau tambahkan kosakata baru ke dalam master data.</p>
          <Button variant="default" className="w-full">Buka Editor</Button>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-2">Manage Renshuu (JFT)</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-4">Buat soal simulasi JFT baru atau edit soal yang sudah ada.</p>
          <Button variant="default" className="w-full">Buka Editor</Button>
        </Card>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-[var(--radius-sm)]">
        <p className="text-sm font-semibold">Catatan Development:</p>
        <p className="text-xs mt-1">Karena aplikasi saat ini berjalan 100% secara lokal, fitur simpan dari editor ini nantinya bisa dirancang untuk men-generate file `.json` yang dapat Anda salin langsung ke folder project `src/data/`.</p>
      </div>
    </div>
  );
}
