import { NextRequest, NextResponse } from "next/server";
import { createSynthesisJob } from "@/lib/ttsJobManager";

const MAX_CHARACTERS = 100_000;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { text, voiceId, speed, pitch, emotion } = payload ?? {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ message: "Texto inválido" }, { status: 400 });
    }

    if (text.length > MAX_CHARACTERS) {
      return NextResponse.json({ message: "Limite de caracteres excedido" }, { status: 400 });
    }

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json({ message: "Selecione uma voz" }, { status: 400 });
    }

    const jobId = createSynthesisJob({
      text,
      voiceId,
      speed: typeof speed === "number" ? speed : Number(speed ?? 1),
      pitch: typeof pitch === "number" ? pitch : Number(pitch ?? 0),
      emotion: typeof emotion === "string" ? emotion : "neutro"
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar job de síntese";
    return NextResponse.json({ message }, { status: 500 });
  }
}
