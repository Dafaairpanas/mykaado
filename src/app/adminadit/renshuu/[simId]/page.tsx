"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ChevronLeft, Plus, Edit, Trash2, Save, Upload, GripVertical } from "lucide-react";
import Link from "next/link";

export default function AdminSimulationEditor() {
  const { simId } = useParams();
  const router = useRouter();

  const [simulation, setSimulation] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth !== "true") {
      router.push("/adminadit/login");
      return;
    }
    fetchData();
  }, [simId, router]);

  async function fetchData() {
    setIsLoading(true);
    // Fetch Simulation Info
    const { data: simData, error: simErr } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simId)
      .single();
    
    if (simErr) {
      alert("Simulasi tidak ditemukan!");
      router.push('/adminadit/renshuu');
      return;
    }
    setSimulation(simData);

    // Fetch Questions
    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .eq('simulation_id', simId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
      
    setQuestions(qData || []);
    setIsLoading(false);
  }

  async function handleUpdateSimulation(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('simulations')
      .update({ 
        title: simulation.title, 
        duration_minutes: simulation.duration_minutes,
        is_randomized: simulation.is_randomized
      })
      .eq('id', simulation.id);
    
    if (error) alert("Gagal menyimpan: " + error.message);
    else alert("Tersimpan!");
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Hapus soal ini?")) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) fetchData();
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        
        let questionsToImport = [];
        if (parsed.questions && Array.isArray(parsed.questions)) {
          questionsToImport = parsed.questions;
        } else if (Array.isArray(parsed)) {
          questionsToImport = parsed;
        } else {
          throw new Error("Format JSON tidak dikenali. Harus berupa array soal atau memiliki properti 'questions'.");
        }

        const formattedQuestions = questionsToImport.map((q: any, idx: number) => ({
          simulation_id: simId,
          type: q.type || "standard",
          instruction: q.instruction || "",
          question_text: q.question_text || q.question || "",
          options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
          correct_answer_index: q.correct_answer_index ?? q.correctAnswerIndex ?? 0,
          explanation: q.explanation || "",
          image_url: q.question_image || q.image_url || null,
          audio_url: q.audio_url || null,
          order_index: questions.length + idx + 1
        }));

        if (!confirm(`Ditemukan ${formattedQuestions.length} soal. Lanjutkan import?`)) return;

        setIsLoading(true);
        const { error } = await supabase.from('questions').insert(formattedQuestions);
        if (error) throw error;
        
        alert("Berhasil import soal!");
        fetchData();
      } catch (err: any) {
        alert("Gagal import: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openNewQuestion = () => {
    setEditingQuestion({
      simulation_id: simId,
      type: "standard",
      instruction: "",
      question_text: "",
      options: ["", "", "", ""],
      correct_answer_index: 0,
      explanation: "",
      image_url: null,
      audio_url: null,
      order_index: questions.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditQuestion = (q: any) => {
    setEditingQuestion({ ...q });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="text-center py-20 font-bold">Memuat data...</div>;
  if (!simulation) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <Link href="/adminadit/renshuu" className="flex items-center text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Simulasi
      </Link>

      {/* Editor Simulasi Header */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-extrabold mb-4 border-b-[2px] border-[var(--color-border-main)] pb-2">Pengaturan Simulasi</h2>
        <form onSubmit={handleUpdateSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Judul Ujian</label>
            <input 
              type="text" 
              value={simulation.title}
              onChange={e => setSimulation({...simulation, title: e.target.value})}
              className="w-full px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-main)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Durasi (Menit)</label>
            <input 
              type="number" 
              value={simulation.duration_minutes}
              onChange={e => setSimulation({...simulation, duration_minutes: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-main)]"
            />
          </div>
          <div className="md:col-span-3 flex items-center justify-between mt-2 pt-4 border-t-[2px] border-dashed border-[var(--color-border-main)]">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={simulation.is_randomized || false}
                onChange={e => setSimulation({...simulation, is_randomized: e.target.checked})}
                className="w-5 h-5 accent-[var(--color-accent)] mr-2"
              />
              <span className="font-bold text-sm">Acak Urutan Soal (Randomize)</span>
            </label>
            <Button variant="primary" type="submit" className="flex items-center">
              <Save className="w-4 h-4 mr-2" /> Simpan Pengaturan
            </Button>
          </div>
        </form>
      </Card>

      {/* Daftar Soal */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold">Daftar Soal ({questions.length})</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer inline-flex items-center justify-center rounded-[var(--radius-sm)] text-sm font-bold px-4 py-2 bg-[var(--color-bg-nav)] text-[var(--color-text-main)] border-[2px] border-[var(--color-border-main)] hover:-translate-y-1 hover:shadow-[2px_2px_0px_var(--color-shadow-main)] transition-all">
            <Upload className="w-4 h-4 mr-2" /> Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
          </label>
          <Button variant="default" onClick={openNewQuestion}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Soal
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-[var(--color-bg-nav)] border-[2px] border-[var(--color-border-main)] rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0 mt-1">
                {idx + 1}
              </div>
              <div>
                <span className="text-xs font-bold uppercase px-2 py-1 bg-[var(--color-accent)] text-[#111] rounded-[var(--radius-sm)] inline-block mb-1">{q.type}</span>
                <p className="font-bold jp-text line-clamp-2">{q.question_text}</p>
                <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">{q.instruction}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="default" onClick={() => openEditQuestion(q)} className="px-3 py-1 text-sm h-auto">
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="danger" onClick={() => handleDeleteQuestion(q.id)} className="px-3 py-1 text-sm h-auto bg-red-500 text-white border-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-12 bg-[var(--color-bg-card)] rounded-[var(--radius-md)] border-[2px] border-dashed border-[var(--color-border-main)] font-bold text-[var(--color-text-muted)]">
            Belum ada soal. Klik Tambah Soal untuk memulai.
          </div>
        )}
      </div>

      {isModalOpen && (
        <QuestionEditorModal 
          question={editingQuestion} 
          onClose={() => setIsModalOpen(false)} 
          onSave={() => {
            setIsModalOpen(false);
            fetchData(); // reload
          }}
        />
      )}
    </div>
  );
}

function QuestionEditorModal({ question, onClose, onSave }: { question: any, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState(question);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"image"|"audio"|null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Pastikan options tidak kosong
    const payload = { ...formData };
    
    let res;
    if (payload.id) {
      // Update
      res = await supabase.from('questions').update(payload).eq('id', payload.id);
    } else {
      // Insert
      res = await supabase.from('questions').insert([payload]);
    }

    setIsSaving(false);
    if (res.error) alert("Gagal menyimpan soal: " + res.error.message);
    else onSave();
  };

  const triggerUpload = (type: "image"|"audio") => {
    setUploadType(type);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file || !uploadType) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `questions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('renshuu_media')
      .upload(filePath, file);

    if (uploadError) {
      alert("Gagal upload: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from('renshuu_media').getPublicUrl(filePath);
      if (uploadType === "image") {
        setFormData({ ...formData, image_url: data.publicUrl });
      } else {
        setFormData({ ...formData, audio_url: data.publicUrl });
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadType("image");
          handleFileUpload(file);
        }
        break;
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={formData.id ? "Edit Soal" : "Tambah Soal Baru"} className="max-w-3xl">
      <form onSubmit={handleSave} onPaste={handlePaste} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Tipe Soal</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-bold outline-none"
            >
              <option value="standard">Standard (Teks)</option>
              <option value="dokkai">Dokkai (Membaca)</option>
              <option value="choukai">Choukai (Mendengar)</option>
              <option value="gambar">Gambar / Ilustrasi</option>
              <option value="moji_goi">Moji & Goi (Kosakata)</option>
              <option value="kaiwa">Kaiwa (Percakapan)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Urutan Soal</label>
            <input 
              type="number" 
              value={formData.order_index}
              onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Instruksi Soal</label>
          <input 
            type="text" 
            placeholder="Contoh: Pilih cara baca Kanji yang digarisbawahi..."
            value={formData.instruction}
            onChange={e => setFormData({...formData, instruction: e.target.value})}
            className="w-full px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Pertanyaan Pokok (Teks / Dokkai)</label>
          <textarea 
            rows={4}
            placeholder="Masukkan teks cerita atau soal pertanyaan..."
            value={formData.question_text}
            onChange={e => setFormData({...formData, question_text: e.target.value})}
            className="w-full px-4 py-3 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] outline-none jp-text font-normal resize-y"
            required
          />
        </div>

        {/* Media Uploaders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-[2px] border-dashed border-[var(--color-border-main)] p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-nav)]">
            <label className="block text-sm font-bold mb-2">Media Gambar</label>
            {formData.image_url ? (
              <div className="mb-2">
                <img src={formData.image_url} alt="Preview" className="max-h-32 object-contain bg-white border border-gray-200" />
                <button type="button" onClick={() => setFormData({...formData, image_url: null})} className="text-red-500 text-xs font-bold mt-1 hover:underline">Hapus Gambar</button>
              </div>
            ) : (
              <Button type="button" variant="default" className="w-full text-xs" onClick={() => triggerUpload("image")} disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" /> {isUploading && uploadType === 'image' ? 'Mengunggah...' : 'Upload Gambar (.png/jpg)'}
              </Button>
            )}
          </div>

          <div className="border-[2px] border-dashed border-[var(--color-border-main)] p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-nav)]">
            <label className="block text-sm font-bold mb-2">Media Audio (Choukai)</label>
            {formData.audio_url ? (
              <div className="mb-2">
                <audio src={formData.audio_url} controls className="w-full h-8" />
                <button type="button" onClick={() => setFormData({...formData, audio_url: null})} className="text-red-500 text-xs font-bold mt-2 hover:underline">Hapus Audio</button>
              </div>
            ) : (
              <Button type="button" variant="default" className="w-full text-xs" onClick={() => triggerUpload("audio")} disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" /> {isUploading && uploadType === 'audio' ? 'Mengunggah...' : 'Upload Audio (.mp3)'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={uploadType === "image" ? "image/*" : "audio/*"}
          onChange={handleFileUpload}
        />

        {/* Opsi Pilihan Ganda */}
        <div>
          <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-2">Pilihan Ganda & Jawaban Benar</label>
          <div className="space-y-3">
            {[0, 1, 2, 3].map(idx => (
              <div key={idx} className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="correct_answer" 
                  checked={formData.correct_answer_index === idx}
                  onChange={() => setFormData({...formData, correct_answer_index: idx})}
                  className="w-5 h-5 accent-[var(--color-accent)] shrink-0"
                />
                <span className="font-bold w-6">{['A', 'B', 'C', 'D'][idx]}.</span>
                <input 
                  type="text" 
                  value={formData.options[idx] || ""}
                  onChange={e => {
                    const newOpts = [...formData.options];
                    newOpts[idx] = e.target.value;
                    setFormData({...formData, options: newOpts});
                  }}
                  placeholder={`Opsi ${['A', 'B', 'C', 'D'][idx]}...`}
                  className="flex-1 px-4 py-2 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] outline-none jp-text"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">Penjelasan Jawaban (Opsional)</label>
          <textarea 
            rows={3}
            placeholder="Kenapa jawabannya itu? Jelaskan dengan singkat..."
            value={formData.explanation || ""}
            onChange={e => setFormData({...formData, explanation: e.target.value})}
            className="w-full px-4 py-3 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] bg-[var(--color-bg-card)] outline-none resize-y"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t-[2px] border-[var(--color-border-main)]">
          <Button variant="default" type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={isSaving || isUploading}>
            {isSaving ? "Menyimpan..." : "Simpan Soal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
