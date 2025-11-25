import { NextRequest, NextResponse } from "next/server";
import { getJob, getJobAudio } from "@/lib/ttsJobManager";

interface RouteContext {
  params: { jobId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { jobId } = context.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ message: "Job não encontrado" }, { status: 404 });
  }

  if (job.status !== "completed") {
    return NextResponse.json({ message: "Áudio ainda não disponível" }, { status: 409 });
  }

  const audio = getJobAudio(jobId);
  if (!audio) {
    return NextResponse.json({ message: "Áudio não encontrado" }, { status: 404 });
  }

  const arrayBuffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
  const body = new Uint8Array(arrayBuffer);

  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename="aurora-${jobId}.mp3"`,
      "Content-Length": String(audio.length)
    }
  });
}
