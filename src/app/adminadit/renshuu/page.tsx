"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminRenshuuList() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth !== "true") {
      router.push("/adminadit/login");
      return;
    }
    fetchSimulations();
  }, [router]);

  async function fetchSimulations() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching simulations:", error);
    } else {
      setSimulations(data || []);
    }
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus simulasi ini? Semua soal di dalamnya juga akan terhapus.")) return;
    
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', id);
      
    if (error) {
      alert("Gagal menghapus simulasi: " + error.message);
    } else {
      fetchSimulations();
    }
  }

  async function createNewSimulation() {
    const title = prompt("Masukkan Judul Simulasi Baru (Misal: JFT-Basic A2 Paket 02):");
    if (!title) return;
    
    const duration = prompt("Masukkan Durasi Ujian (dalam Menit):", "30");
    if (!duration) return;

    // Generate simple ID
    const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const { data, error } = await supabase
      .from('simulations')
      .insert([
        { id: newId, title, duration_minutes: parseInt(duration) }
      ])
      .select();

    if (error) {
      alert("Gagal membuat simulasi: " + error.message);
    } else if (data && data.length > 0) {
      router.push(`/adminadit/renshuu/${data[0].id}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Link href="/adminadit" className="text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-2 inline-block">
            &larr; Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold mb-2">Manage Renshuu</h1>
          <p className="text-[var(--color-text-muted)]">Daftar semua paket soal simulasi (JFT/JLPT).</p>
        </div>
        <Button variant="primary" onClick={createNewSimulation} className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Buat Simulasi Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-bold animate-pulse">Memuat data dari Supabase...</div>
      ) : simulations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg font-bold text-[var(--color-text-muted)] mb-4">Belum ada simulasi ujian.</p>
          <Button variant="default" onClick={createNewSimulation}>Mulai Buat Ujian Pertama</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulations.map(sim => (
            <Card key={sim.id} className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{sim.title}</h3>
                <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-text-muted)] mb-6">
                  <span>ID: {sim.id}</span>
                  <span>•</span>
                  <span>{sim.duration_minutes} Menit</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/adminadit/renshuu/${sim.id}`} className="flex-1">
                  <Button variant="default" className="w-full flex items-center justify-center">
                    <Edit className="w-4 h-4 mr-2" /> Edit Soal
                  </Button>
                </Link>
                <Button variant="danger" className="px-3" onClick={() => handleDelete(sim.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
