import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import summaryData from "@/data/ringkasan/data.json";

export default function RingkasanPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
        <Link href="/" className="inline-flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Dashboard
        </Link>
        <div className="md:ml-4">
          <h1 className="text-3xl font-extrabold mb-2">Ringkasan Tata Bahasa</h1>
          <p className="text-[var(--color-text-muted)] font-medium">Kumpulan perubahan bentuk kata dan pola kalimat (Matome)</p>
        </div>
      </div>

      {/* Navigation Filter / Anchor Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
        {summaryData.map(section => (
          <a 
            key={`nav-${section.id}`} 
            href={`#${section.id}`}
            className="flex items-center justify-center p-3 bg-[var(--color-bg-card)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] text-sm font-bold text-center hover:bg-[var(--color-text-main)] hover:text-[var(--color-bg-main)] hover:-translate-y-1 transition-all shadow-[3px_3px_0px_var(--color-shadow-main)]"
          >
            {section.title}
          </a>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-12">
        {summaryData.map((section, idx) => (
          <div key={section.id} id={section.id} className="animate-fade-in-up scroll-mt-8" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-2 h-8 bg-[var(--color-accent)] rounded-full shadow-[2px_2px_0px_var(--color-shadow-main)]"></div>
              <h2 className="text-2xl font-bold">{section.title}</h2>
            </div>
            <p className="text-[var(--color-text-muted)] font-medium mb-6">{section.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Aturan Perubahan */}
              <Card className="p-5 md:p-6 bg-[var(--color-bg-card)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[4px_4px_0px_var(--color-shadow-main)]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-text-main)]"></span>
                  Aturan Perubahan
                </h3>
                <div className="space-y-4">
                  {section.rules.map((rule, ruleIdx) => (
                    <div key={ruleIdx} className="border-b border-dashed border-[var(--color-border-main)] pb-3 last:border-0 last:pb-0">
                      <div className="inline-block px-2 py-0.5 bg-[var(--color-bg-nav)] text-xs font-bold rounded-[var(--radius-sm)] border border-[var(--color-border-main)] mb-2 text-[var(--color-text-muted)]">
                        {rule.group}
                      </div>
                      <div className="font-mono text-sm md:text-base font-bold text-[var(--color-text-main)] mb-1 whitespace-pre-wrap">
                        {rule.rule}
                      </div>
                      <div className="text-sm jp-text text-[var(--color-text-muted)] whitespace-pre-wrap">
                        Contoh: <span className="font-bold text-[var(--color-accent)]">{rule.example}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Pola Tata Bahasa Terkait */}
              <Card className="p-5 md:p-6 bg-[var(--color-bg-nav)] border-dashed border-[length:var(--bw-sm)] border-[var(--color-border-main)]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                  Pola Terkait (Bunpou)
                </h3>
                <ul className="space-y-3">
                  {section.related_bunpou.map((bunpou, bIdx) => (
                    <li key={bIdx} className="bg-[var(--color-bg-main)] p-3 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] flex flex-col gap-1 hover:-translate-y-0.5 transition-transform">
                      <span className="jp-text font-bold text-[var(--color-text-main)] whitespace-pre-wrap">{bunpou.pattern}</span>
                      <span className="text-sm text-[var(--color-text-muted)] font-medium whitespace-pre-wrap">{bunpou.meaning}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
