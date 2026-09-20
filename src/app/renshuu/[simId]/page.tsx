"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

import jftPaket01 from "@/data/renshuu/jft-paket-01.json";
import n5Paket01 from "@/data/renshuu/n5-paket-01.json";
import n4Paket01 from "@/data/renshuu/n4-paket-01.json";

const localSimulationsData: Record<string, any> = {
  [jftPaket01.id]: jftPaket01,
  [n5Paket01.id]: n5Paket01,
  [n4Paket01.id]: n4Paket01,
};

type Status = "idle" | "running" | "finished";

export default function SimulationEngine() {
  const { simId } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSim() {
      setIsLoading(true);
      
      // 1. Cek apakah ini simulasi lokal
      if (typeof simId === "string" && localSimulationsData[simId]) {
        const simData = localSimulationsData[simId];
        let finalQuestions = simData.questions;
        if (simData.is_randomized) {
          finalQuestions = [...simData.questions];
          for (let i = finalQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
          }
        }
        setData({
          ...simData,
          total_questions: finalQuestions.length,
          questions: finalQuestions
        });
        setIsLoading(false);
        return;
      }

      // 2. Jika bukan lokal, fetch dari Supabase
      const { data: simData, error: simErr } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simId)
        .single();
        
      if (simErr) {
        alert("Simulasi tidak ditemukan!");
        router.push("/renshuu");
        return;
      }

      // Fetch questions
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('simulation_id', simId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (qData) {
        let finalQuestions = qData;
        if (simData.is_randomized) {
          // Fisher-Yates shuffle
          finalQuestions = [...qData];
          for (let i = finalQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
          }
        }
        
        setData({
          ...simData,
          total_questions: finalQuestions.length,
          questions: finalQuestions
        });
      }
      setIsLoading(false);
    }
    loadSim();
  }, [simId, router]);

  useEffect(() => {
    if (status === "running" && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (status === "running" && timeLeft === 0) {
      setStatus("finished");
    }
  }, [status, timeLeft]);

  if (isLoading || !data) return <div className="text-center py-20 font-bold animate-pulse">Memuat Ujian...</div>;

  if (data.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-extrabold mb-4">{data.title}</h1>
        <p className="text-[var(--color-text-muted)] mb-8">Maaf, ujian ini belum memiliki soal.</p>
        <Link href="/renshuu">
          <Button variant="default">Kembali</Button>
        </Link>
      </div>
    );
  }

  const startExam = () => {
    setTimeLeft(data.duration_minutes * 60);
    setStatus("running");
  };

  const handleAnswer = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [data.questions[currentQ].id]: optionIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    data.questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer_index) correct++;
    });
    return {
      correct,
      total: data.total_questions,
      percentage: Math.round((correct / data.total_questions) * 100)
    };
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "idle") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in-up">
        <h1 className="text-3xl font-extrabold mb-4">{data.title}</h1>
        <Card className="p-8 bg-[var(--color-bg-card)]">
          <ul className="text-left space-y-4 mb-8 text-lg font-medium">
            <li className="flex justify-between border-b-[2px] border-dashed border-[var(--color-border-main)] pb-2">
              <span className="text-[var(--color-text-muted)]">Durasi Ujian</span>
              <span>{data.duration_minutes} Menit</span>
            </li>
            <li className="flex justify-between border-b-[2px] border-dashed border-[var(--color-border-main)] pb-2">
              <span className="text-[var(--color-text-muted)]">Total Soal</span>
              <span>{data.total_questions} Soal</span>
            </li>
          </ul>
          <div className="flex gap-4 justify-center">
            <Link href="/renshuu">
              <Button variant="default">Kembali</Button>
            </Link>
            <Button variant="primary" onClick={startExam}>Mulai Sekarang</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "finished") {
    const score = calculateScore();
    const isPassed = score.percentage >= 60;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Ujian Selesai!</h2>
          <div className={`text-6xl font-black mb-4 ${isPassed ? 'text-[var(--color-fsrs-good)]' : 'text-[var(--color-fsrs-again)]'}`}>
            {score.percentage}%
          </div>
          <p className="text-lg font-bold">
            Benar {score.correct} dari {score.total} soal.
          </p>
        </div>

        <h3 className="text-xl font-bold mb-4">Review Jawaban</h3>
        <div className="space-y-6">
          {data.questions.map((q: any, i: number) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer_index;
            
            return (
              <Card key={q.id} className={`p-6 border-[3px] ${isCorrect ? 'border-[var(--color-fsrs-good)]' : 'border-[var(--color-fsrs-again)]'}`}>
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Soal {i + 1}</span>
                  {isCorrect ? <CheckCircle className="text-[var(--color-fsrs-good)]" /> : <XCircle className="text-[var(--color-fsrs-again)]" />}
                </div>
                <div className="mb-4">
                  <p className="text-sm font-bold text-[var(--color-accent)] mb-2">{q.instruction}</p>
                  
                  {q.image_url && (
                    <img src={q.image_url} alt="Soal" className="max-h-48 object-contain mb-4 rounded bg-white border border-[var(--color-border-main)]" />
                  )}
                  {q.audio_url && (
                    <audio src={q.audio_url} controls className="mb-4 w-full max-w-sm" />
                  )}
                  
                  <p className="jp-text text-xl whitespace-pre-wrap">{q.question_text}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt: string, idx: number) => {
                    let btnClass = "bg-[var(--color-bg-nav)]";
                    if (idx === q.correct_answer_index) btnClass = "bg-[var(--color-fsrs-good)] text-white";
                    else if (idx === userAnswer && !isCorrect) btnClass = "bg-[var(--color-fsrs-again)] text-white";
                    
                    return (
                      <div key={idx} className={`p-3 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] font-medium jp-text ${btnClass}`}>
                        {opt}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="mt-4 p-4 bg-[var(--color-bg-main)] rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-main)]">
                    <p className="font-bold text-sm mb-1">Penjelasan:</p>
                    <p className="text-sm whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/renshuu">
            <Button variant="primary" className="px-8">Kembali ke Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Running State
  const question = data.questions[currentQ];
  const selectedAnswer = answers[question.id];

  return (
    <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
      <div className="flex items-center justify-between py-4 border-b-[2px] border-[var(--color-border-main)] mb-6">
        <div className="font-bold">
          Soal {currentQ + 1} / {data.total_questions}
        </div>
        <div className="flex items-center gap-2 font-bold text-lg bg-[var(--color-bg-nav)] px-4 py-1.5 rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
          <Clock className="w-5 h-5" />
          <span className={timeLeft < 60 ? "text-[var(--color-fsrs-again)] animate-pulse" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="animate-fade-in-up" key={currentQ}>
          <div className="mb-6 bg-[var(--color-accent)] text-[var(--color-btn-text)] p-3 rounded-[var(--radius-md)] inline-block font-bold shadow-[2px_2px_0px_var(--color-shadow-main)] border-[2px] border-[var(--color-border-main)]">
            {question.instruction}
          </div>
          
          {question.image_url && (
            <div className="mb-6">
              <img src={question.image_url} alt="Soal" className="max-w-full max-h-64 object-contain rounded-[var(--radius-sm)] border-[2px] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] bg-white" />
            </div>
          )}
          
          {question.audio_url && (
            <div className="mb-6 bg-[var(--color-bg-card)] p-4 rounded-[var(--radius-md)] border-[2px] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
              <p className="font-bold text-sm text-[var(--color-text-muted)] mb-2">Putar Audio (Choukai)</p>
              <audio src={question.audio_url} controls className="w-full" />
            </div>
          )}

          <div className="text-2xl md:text-3xl jp-text font-normal mb-8 leading-relaxed whitespace-pre-wrap">
            {question.question_text}
          </div>

          <div className="space-y-3">
            {question.options.map((opt: string, idx: number) => {
              const isSelected = selectedAnswer === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 rounded-[var(--radius-md)] border-[2px] border-[var(--color-border-main)] transition-all flex items-center gap-3 text-lg jp-text
                    ${isSelected 
                      ? 'bg-[var(--color-accent)] text-[var(--color-btn-text)] shadow-[4px_4px_0px_var(--color-shadow-main)] translate-y-[-2px] font-bold' 
                      : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-nav)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-shadow-main)]'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full border-[2px] border-current flex items-center justify-center shrink-0`}>
                    {isSelected && <div className="w-3 h-3 bg-current rounded-full" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-main)] border-t-[2px] border-[var(--color-border-main)] z-10 flex justify-between max-w-3xl mx-auto w-full shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          variant="default" 
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        
        {currentQ < data.total_questions - 1 ? (
          <Button 
            variant="primary" 
            onClick={() => setCurrentQ(prev => Math.min(data.total_questions - 1, prev + 1))}
          >
            Selanjutnya
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            variant="primary" 
            className="bg-[var(--color-fsrs-easy)] text-black"
            onClick={() => setStatus("finished")}
          >
            Selesai Ujian
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
