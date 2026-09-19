"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RenshuuPage() {
  const simulations = [
    { id: "batch-01", title: "JFT-Basic A2 - Paket 01", desc: "5 Menit • 5 Soal (Demo)" },
    { id: "n4-paket-01", title: "Tes Level N4 - Bunpou", desc: "30 Menit • 50 Soal" },
    { id: "n5-paket-01", title: "Tes Level N5 - Bunpou", desc: "30 Menit • 50 Soal" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold mb-2">Latihan (Renshuu)</h1>
        <p className="text-[var(--color-text-muted)]">Uji kemampuan Anda dengan simulasi ujian standar.</p>
      </div>

      <h2 className="text-xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>Simulasi JFT-Basic</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {simulations.map((sim, idx) => (
          <Card key={sim.id} className="p-6 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-shadow-main)] transition-all flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: `${200 + (idx * 50)}ms` }}>
            <div>
              <h3 className="text-xl font-bold mb-2">{sim.title}</h3>
              <p className="text-[var(--color-text-muted)] mb-6">{sim.desc}</p>
            </div>
            <Link href={`/renshuu/${sim.id}`}>
              <Button variant="primary" className="w-full">
                Pilih Simulasi
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
