import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/ttsJobManager";

interface RouteContext {
  params: { jobId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const job = getJob(context.params.jobId);

  if (!job) {
    return NextResponse.json({ message: "Job não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    error: job.error,
    downloadUrl: job.status === "completed" ? `/api/tts/${job.id}/audio` : undefined,
    duration: job.duration
  });
}
