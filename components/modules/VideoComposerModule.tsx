"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ChangeEvent, DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuid } from "uuid";
import { BoltIcon, PlayCircleIcon, PlusCircleIcon, SwatchIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface VideoComposerModuleProps {
  narrationUrl: string | null;
  narrationDuration: number | null;
}

type MediaType = "image" | "video";

type TransitionStyle = "corte" | "fade" | "zoom" | "slide" | "flash" | "glitch";

interface MediaAsset {
  id: string;
  type: MediaType;
  name: string;
  url: string;
  thumbnail: string;
  duration?: number;
}

interface TimelineItem {
  id: string;
  assetId: string;
  duration: number;
  transition: TransitionStyle;
}

const TRANSITIONS: TransitionStyle[] = ["corte", "fade", "zoom", "slide", "flash", "glitch"];

const readVideoDuration = (file: File): Promise<number | undefined> =>
  new Promise((resolve) => {
    if (!file.type.startsWith("video")) {
      resolve(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      resolve(video.duration || undefined);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      resolve(undefined);
      URL.revokeObjectURL(url);
    };
  });

const generatePreview = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    resolve(url);
  });

export function VideoComposerModule({ narrationUrl, narrationDuration }: VideoComposerModuleProps) {
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const audioDuration = narrationDuration ?? 120;

  const composedDuration = useMemo(
    () => timeline.reduce((acc, clip) => acc + clip.duration, 0),
    [timeline]
  );

  const narrationAvailable = Boolean(narrationUrl);

  const activeClip = timeline[activeClipIndex];
  const activeAsset = mediaLibrary.find((asset) => asset.id === activeClip?.assetId) ?? null;

  useEffect(() => {
    if (!timeline.length) {
      setActiveClipIndex(0);
      return;
    }
    if (activeClipIndex >= timeline.length) {
      setActiveClipIndex(timeline.length - 1);
    }
  }, [timeline, activeClipIndex]);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (!files.length) return;

      const assets: MediaAsset[] = [];
      for (const file of files) {
        const id = uuid();
        const previewUrl = await generatePreview(file);
        const duration = await readVideoDuration(file);
        assets.push({
          id,
          name: file.name,
          type: file.type.startsWith("video") ? "video" : "image",
          url: previewUrl,
          thumbnail: previewUrl,
          duration
        });
      }

      setMediaLibrary((prev) => [...prev, ...assets]);
      setSelectedLibraryId((prev) => prev ?? assets[0]?.id ?? null);
      event.target.value = "";
    },
    []
  );

  const applySimpleMode = useCallback(() => {
    if (!selectedLibraryId) return;
    const asset = mediaLibrary.find((item) => item.id === selectedLibraryId);
    if (!asset) return;

    const clip: TimelineItem = {
      id: uuid(),
      assetId: asset.id,
      duration: audioDuration,
      transition: "fade"
    };
    setTimeline([clip]);
    setMode("simple");
  }, [audioDuration, mediaLibrary, selectedLibraryId]);

  const addToTimeline = useCallback(
    (assetId: string) => {
      setTimeline((prev) => [
        ...prev,
        {
          id: uuid(),
          assetId,
          duration: 8,
          transition: "corte"
        }
      ]);
      setMode("advanced");
    },
    []
  );

  const updateClip = useCallback((clipId: string, data: Partial<TimelineItem>) => {
    setTimeline((prev) => prev.map((clip) => (clip.id === clipId ? { ...clip, ...data } : clip)));
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setTimeline((prev) => prev.filter((clip) => clip.id !== clipId));
  }, []);

  const onDragStart = useCallback((event: DragEvent<HTMLButtonElement>, clipId: string) => {
    event.dataTransfer.setData("text/plain", clipId);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
      event.preventDefault();
      const clipId = event.dataTransfer.getData("text/plain");
      const currentIndex = timeline.findIndex((clip) => clip.id === clipId);
      if (currentIndex === -1) return;
      const updated = [...timeline];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      setTimeline(updated);
    },
    [timeline]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (!timeline.length || !isPreviewPlaying) return;
    const clipDuration = timeline[activeClipIndex]?.duration ?? 0;
    if (!clipDuration) return;

    const timeout = setTimeout(() => {
      setActiveClipIndex((prev) => {
        const nextIndex = (prev + 1) % timeline.length;
        if (nextIndex === 0 && !narrationAvailable) {
          return 0;
        }
        return nextIndex;
      });
    }, clipDuration * 1000);

    return () => clearTimeout(timeout);
  }, [timeline, activeClipIndex, isPreviewPlaying, narrationAvailable]);

  const togglePreviewPlayback = useCallback(() => {
    setIsPreviewPlaying((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">Módulo 2 · Video Composer</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Combine suas narrações com visuais cinematográficos, transições dinâmicas e modo de timeline interativo.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          <button
            onClick={() => setMode("simple")}
            className={clsx(
              "rounded-full px-4 py-2 transition",
              mode === "simple" ? "bg-primary/40 text-white" : "bg-white/10"
            )}
          >
            Modo simples
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={clsx(
              "rounded-full px-4 py-2 transition",
              mode === "advanced" ? "bg-secondary/40 text-white" : "bg-white/10"
            )}
          >
            Modo avançado
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
            <input
              id="media-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <label
              htmlFor="media-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Carregar mídia
            </label>
            <p className="mt-3 text-xs text-slate-400">
              Suporte para imagens (JPG, PNG, WebP) e vídeos (MP4, WebM) com pré-visualização instantânea.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
              <span>Biblioteca de mídia</span>
              <span>{mediaLibrary.length} itens</span>
            </div>
            <div className="mt-4 grid max-h-48 grid-cols-3 gap-3 overflow-y-auto pr-1 scrollbar-thin">
              {mediaLibrary.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedLibraryId(asset.id)}
                  className={clsx(
                    "group relative aspect-video overflow-hidden rounded-xl border border-white/10 text-left",
                    selectedLibraryId === asset.id ? "border-primary/60" : "hover:border-white/20"
                  )}
                >
                  {asset.type === "image" ? (
                    <Image
                      src={asset.thumbnail}
                      alt={asset.name}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 33vw, 220px"
                      className="object-cover"
                    />
                  ) : (
                    <video src={asset.thumbnail} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 text-[11px] text-white">
                    <p className="truncate font-medium">{asset.name}</p>
                    {asset.duration && <p className="text-[10px] text-slate-300">{asset.duration.toFixed(1)}s</p>}
                  </div>
                </button>
              ))}
              {!mediaLibrary.length && (
                <div className="col-span-3 flex aspect-video items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                  Biblioteca vazia · faça upload para começar
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {mode === "simple" && selectedLibraryId && (
              <motion.div
                key="simple-mode"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="rounded-2xl border border-primary/20 bg-primary/10 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Modo simples habilitado</p>
                    <p className="mt-1 text-xs text-primary-foreground/80">
                      Aplicará a imagem selecionada ao longo de toda a narração ({audioDuration.toFixed(0)}s).
                    </p>
                  </div>
                  <button
                    onClick={applySimpleMode}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-slate-200"
                  >
                    Aplicar imagem ao longo do áudio
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "advanced" && selectedLibraryId && (
            <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Modo avançado ativo</p>
                  <p className="mt-1 text-xs text-white/70">
                    Construa uma sequência narrativa adicionando múltiplos clipes na timeline sequencial.
                  </p>
                </div>
                <button
                  onClick={() => addToTimeline(selectedLibraryId)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Inserir na timeline
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60">
            <div className="flex items-center justify-between px-5 py-4 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Pré-visualização</span>
              <button onClick={togglePreviewPlayback} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-[11px] font-semibold text-white transition hover:bg-white/10">
                <PlayCircleIcon className="h-4 w-4" />
                {isPreviewPlaying ? "Pausar" : "Reproduzir"}
              </button>
            </div>
            <div className="relative aspect-video w-full bg-slate-900">
              {activeAsset ? (
                activeAsset.type === "image" ? (
                  <Image
                    src={activeAsset.url}
                    alt={activeAsset.name}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover"
                  />
                ) : (
                  <video
                    key={activeAsset.id}
                    src={activeAsset.url}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Adicione clipes à timeline para visualizar
                </div>
              )}
              {narrationAvailable && (
                <div className="absolute bottom-4 left-1/2 flex w-[80%] -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[11px] text-slate-200">
                  <span className="flex items-center gap-2 uppercase tracking-[0.3em]">
                    <BoltIcon className="h-4 w-4 text-primary" />
                    Narração vinculada
                  </span>
                  <audio src={narrationUrl ?? undefined} controls className="h-9 w-40" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Timeline</span>
              <span className="text-slate-300">Duração total · {composedDuration.toFixed(1)}s</span>
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pr-3 scrollbar-thin">
              {timeline.map((clip, index) => {
                const asset = mediaLibrary.find((item) => item.id === clip.assetId);
                if (!asset) return null;
                return (
                  <div
                    key={clip.id}
                    onDrop={(event) => onDrop(event, index)}
                    onDragOver={onDragOver}
                    className={clsx(
                      "group relative flex min-w-[200px] flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4",
                      activeClipIndex === index && "border-primary/50"
                    )}
                  >
                    <button
                      draggable
                      onDragStart={(event) => onDragStart(event, clip.id)}
                      onClick={() => setActiveClipIndex(index)}
                      className="flex flex-1 cursor-grab flex-col gap-3"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10">
                        {asset.type === "image" ? (
                          <Image
                            src={asset.thumbnail}
                            alt={asset.name}
                            fill
                            unoptimized
                            sizes="200px"
                            className="object-cover"
                          />
                        ) : (
                          <video src={asset.url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                        )}
                      </div>
                      <div className="text-left text-xs text-slate-300">
                        <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
                        <p>{clip.duration.toFixed(1)}s · {clip.transition}</p>
                      </div>
                    </button>

                    <div className="flex flex-col gap-2 text-xs text-slate-300">
                      <label className="flex flex-col gap-2">
                        <span>Duração (s)</span>
                        <input
                          type="range"
                          min={2}
                          max={30}
                          step={0.5}
                          value={clip.duration}
                          onChange={(event) => updateClip(clip.id, { duration: Number(event.target.value) })}
                          className="accent-primary"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span>Transição</span>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {TRANSITIONS.map((transition) => (
                            <button
                              key={transition}
                              onClick={() => updateClip(clip.id, { transition })}
                              className={clsx(
                                "rounded-full px-3 py-1 capitalize transition",
                                clip.transition === transition
                                  ? "bg-white text-black"
                                  : "bg-white/10 text-slate-300 hover:bg-white/20"
                              )}
                              type="button"
                            >
                              {transition}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={() => removeClip(clip.id)}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {!timeline.length && (
                <div className="flex h-48 flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                  Sua timeline está vazia. Selecione um item e insira clipes para começar a montar o vídeo.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <SwatchIcon className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-white">Transições entre clipes</p>
                <p>Configure fades, zooms e efeitos criativos para cada junção entre clipes na timeline.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em]">
              <span className="rounded-full bg-white/10 px-3 py-1">Fade</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Zoom</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Slide</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Flash</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Glitch</span>
            </div>
            <p className="text-[11px] text-slate-400">
              O motor de renderização ajusta automaticamente keyframes, easing e blending de cor entre as transições escolhidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
