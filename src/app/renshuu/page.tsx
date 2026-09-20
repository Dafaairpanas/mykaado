"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

import jftPaket01 from "@/data/renshuu/jft-paket-01.json";
import n5Paket01 from "@/data/renshuu/n5-paket-01.json";
import n4Paket01 from "@/data/renshuu/n4-paket-01.json";

const localSimulations = [
  { id: jftPaket01.id, title: jftPaket01.title, duration_minutes: jftPaket01.duration_minutes },
  { id: n5Paket01.id, title: n5Paket01.title, duration_minutes: n5Paket01.duration_minutes },
  { id: n4Paket01.id, title: n4Paket01.title, duration_minutes: n4Paket01.duration_minutes },
];

export default function RenshuuPage() {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSimulations() {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setSimulations([...localSimulations, ...data]);
      } else {
        setSimulations(localSimulations);
      }
      setIsLoading(false);
    }
    loadSimulations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="mb-8 animate-fade-in-up mt-8">
        <h1 className="text-3xl font-extrabold mb-2">Latihan (Renshuu)</h1>
        <p className="text-[var(--color-text-muted)]">Uji kemampuan Anda dengan simulasi ujian standar.</p>
      </div>

      <h2 className="text-xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>Daftar Ujian Tersedia</h2>
      
      {isLoading ? (
        <div className="text-center py-10 font-bold animate-pulse">Memuat data ujian...</div>
      ) : simulations.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-text-muted)] font-medium">
          Belum ada ujian yang tersedia saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulations.map((sim, idx) => (
            <Card key={sim.id} className="p-6 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-shadow-main)] transition-all flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: `${200 + (idx * 50)}ms` }}>
              <div>
                <h3 className="text-xl font-bold mb-2">{sim.title}</h3>
                <p className="text-[var(--color-text-muted)] mb-6">{sim.duration_minutes} Menit</p>
              </div>
              <Link href={`/renshuu/${sim.id}`}>
                <Button variant="primary" className="w-full">
                  Pilih Simulasi
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
