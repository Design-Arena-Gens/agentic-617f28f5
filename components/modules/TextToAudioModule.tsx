"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { VOICE_DEFINITIONS } from "@/lib/voices";

interface VoiceProfile {
  id: string;
  label: string;
  description: string;
  gender: "masculine" | "feminine";
  tone: string;
}

interface FormValues {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  emotion: string;
}

interface JobStatus {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  downloadUrl?: string;
  duration?: number;
}

interface TextToAudioModuleProps {
  onAudioReady?: (payload: { url: string; duration?: number }) => void;
}

const VOICE_LIBRARY: VoiceProfile[] = VOICE_DEFINITIONS.map((voice) => ({
  id: voice.id,
  label: voice.label,
  description: voice.description,
  gender: voice.gender,
  tone: voice.tone
}));

const EMOTIONS = ["neutro", "feliz", "triste", "intenso", "misterioso", "épico"] as const;

const MAX_CHARACTERS = 100_000;

export function TextToAudioModule({ onAudioReady }: TextToAudioModuleProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      text: "",
      voiceId: VOICE_LIBRARY[0]?.id ?? "",
      speed: 1,
      pitch: 0,
      emotion: "neutro"
    }
  });

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const hasEmittedAudio = useRef(false);

  const textValue = watch("text");
  const voiceId = watch("voiceId");
  const speed = watch("speed");
  const pitch = watch("pitch");
  const emotion = watch("emotion");

  useEffect(() => {
    if (!jobId) return;

    let isCancelled = false;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tts/${jobId}`);
        if (!response.ok) {
          throw new Error("Falha ao consultar status");
        }
        const data: JobStatus = await response.json();
        if (!isCancelled) {
          setJobStatus(data);
          if (data.status === "completed" && data.downloadUrl) {
            setAudioUrl(data.downloadUrl);
            if (!hasEmittedAudio.current) {
              hasEmittedAudio.current = true;
              onAudioReady?.({ url: data.downloadUrl, duration: data.duration });
            }
            clearInterval(interval);
          }
          if (data.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [jobId, onAudioReady]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!values.text.trim()) return;
      setIsSubmitting(true);
      setJobStatus({ status: "queued", progress: 1 });
      setAudioUrl(null);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.message ?? "Não foi possível criar o job de síntese");
        }

        const data = await response.json();
        setJobId(data.jobId);
        hasEmittedAudio.current = false;
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setJobStatus({ status: "failed", progress: 0, error: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">Módulo 1 · Síntese de Voz Premium</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Converta roteiros extensos em narrações imersivas com vozes cinematográficas, controle de cadência e emoção.
          </p>
        </div>
        <span className="rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground">
          320kbps
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid flex-1 gap-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Roteiro · até 100.000 caracteres</span>
              <span className={clsx("tabular-nums", textValue.length > MAX_CHARACTERS ? "text-rose-400" : "text-slate-300")}>{`
                ${textValue.length.toLocaleString("pt-BR")} / ${MAX_CHARACTERS.toLocaleString("pt-BR")}
              `}</span>
            </div>
            <textarea
              {...register("text", {
                required: "Insira o conteúdo a ser narrado",
                maxLength: { value: MAX_CHARACTERS, message: "Limite máximo excedido" }
              })}
              className="min-h-[260px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30"
              placeholder="Cole o roteiro completo, incluindo marcações de pausa ou diretivas narrativas."
            />
            {errors.text && <p className="text-sm text-rose-400">{errors.text.message}</p>}
          </div>

          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Biblioteca de vozes</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("voiceId", "masc-deep")}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                  voiceId?.startsWith("masc") ? "bg-primary/30 text-white" : "bg-white/10 text-slate-300"
                )}
              >
                Masculinas
              </button>
              <button
                type="button"
                onClick={() => setValue("voiceId", "fem-soft")}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                  voiceId?.startsWith("fem") ? "bg-secondary/20 text-white" : "bg-white/10 text-slate-300"
                )}
              >
                Femininas
              </button>
            </div>

            <div className="grid gap-3">
              {VOICE_LIBRARY.filter((voice) => voice.gender === (voiceId?.startsWith("fem") ? "feminine" : "masculine")).map((voice) => (
                <label
                  key={voice.id}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-primary/50",
                    voice.id === voiceId && "border-primary bg-primary/20"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{voice.label}</p>
                    <p className="text-xs text-slate-400">{voice.description}</p>
                  </div>
                  <input
                    type="radio"
                    value={voice.id}
                    className="h-4 w-4"
                    {...register("voiceId", { required: "Selecione uma voz" })}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
              <span>Velocidade</span>
              <span className="tabular-nums text-sm text-slate-200">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.01}
              {...register("speed", { valueAsNumber: true })}
              className="w-full accent-primary"
            />
            <p className="mt-3 text-xs text-slate-400">
              Ajuste a cadência narrativa para diálogos rápidos ou locuções contemplativas.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
              <span>Pitch / Tom</span>
              <span className="tabular-nums text-sm text-slate-200">{pitch > 0 ? `+${pitch}` : pitch}</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              {...register("pitch", { valueAsNumber: true })}
              className="w-full accent-secondary"
            />
            <p className="mt-3 text-xs text-slate-400">
              Equalize a densidade vocal para narradores graves, neutros ou com timbres mais agudos.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
              <span>Emoção</span>
              <span className="text-sm text-slate-200">{emotion}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {EMOTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValue("emotion", option)}
                  className={clsx(
                    "rounded-full px-3 py-2 capitalize transition",
                    emotion === option ? "bg-white text-black" : "bg-white/10 text-slate-300 hover:bg-white/20"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("emotion", { required: true })} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-5 text-sm text-slate-200">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-white">Pipeline assíncrono com otimização tonal</p>
              <p className="text-xs text-slate-300">
                Seu áudio será renderizado em cloud compute com mixagem automática e normalização de loudness.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Processando..." : "Gerar Narração"}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {jobStatus && (
          <motion.div
            key="job-status"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="space-y-4 rounded-2xl border border-white/10 bg-black/60 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Status do processamento</p>
                <p className="text-xs text-slate-400">
                  {jobStatus.status === "completed"
                    ? "Renderização concluída"
                    : jobStatus.status === "failed"
                    ? jobStatus.error ?? "Erro ao processar"
                    : "Seu job está sendo sintetizado com ajustes tonais dedicados."}
                </p>
              </div>
              <span
                className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", {
                  "bg-emerald-500/20 text-emerald-200": jobStatus.status === "completed",
                  "bg-amber-500/20 text-amber-200": jobStatus.status === "processing" || jobStatus.status === "queued",
                  "bg-rose-500/20 text-rose-200": jobStatus.status === "failed"
                })}
              >
                {jobStatus.status}
              </span>
            </div>
            {jobStatus.status !== "failed" && (
              <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
                  style={{ width: `${Math.max(8, jobStatus.progress)}%` }}
                />
              </div>
            )}
            {audioUrl && (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <audio controls src={audioUrl} className="w-full min-w-[260px] flex-1" />
                <a
                  href={audioUrl}
                  download="aurora-narracao.mp3"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Baixar MP3 320kbps
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
