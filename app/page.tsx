"use client";

import { useState } from "react";
import { TextToAudioModule } from "@/components/modules/TextToAudioModule";
import { VideoComposerModule } from "@/components/modules/VideoComposerModule";

export default function Home() {
  const [narrationUrl, setNarrationUrl] = useState<string | null>(null);
  const [narrationMeta, setNarrationMeta] = useState<{ duration?: number } | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-16 px-6 py-10 sm:px-8 lg:px-12">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-white/5 p-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-slate-300">
          <span className="h-px flex-1 bg-white/20" aria-hidden />
          Aurora Studio
          <span className="h-px flex-1 bg-white/20" aria-hidden />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Produção audiovisual completa com síntese de voz premium e edição visual inteligente.
            </h1>
            <p className="text-lg text-slate-300 lg:text-xl">
              Crie narrações épicas, dramatize roteiros complexos e componha vídeos cinematográficos em uma interface
              fluida projetada para criadores, agências e estúdios de pós-produção.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full bg-primary/20 px-4 py-2">Conversão de texto em áudio 320kbps</span>
              <span className="rounded-full bg-secondary/20 px-4 py-2">Timeline visual com drag-and-drop</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Transições dinâmicas & blending</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Exportação otimizada para streaming</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-3xl bg-primary/40 blur-3xl opacity-60" />
            <div className="relative h-full rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
              <dl className="grid gap-6 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Pipeline Inteligente</dt>
                  <dd className="mt-1 text-2xl font-semibold text-white">Processamento assíncrono em nuvem</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Biblioteca Cinematográfica</dt>
                  <dd className="mt-1">Integração com imagens, vídeos e transições personalizadas para storytelling completo.</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Renderização Premium</dt>
                  <dd className="mt-1">Áudio em MP3 320kbps com controle detalhado de timbre, emoção e cadência narrativa.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <TextToAudioModule
          onAudioReady={(payload) => {
            setNarrationUrl(payload.url);
            setNarrationMeta({ duration: payload.duration });
          }}
        />
        <VideoComposerModule narrationUrl={narrationUrl} narrationDuration={narrationMeta?.duration ?? null} />
      </section>
    </main>
  );
}
