declare module "fluent-ffmpeg" {
  import type { Readable } from "stream";
  import type { Writable } from "stream";

  type EventName = "start" | "codecData" | "progress" | "stderr" | "error" | "end";

  interface Command {
    input(source: string | Readable): Command;
    inputFormat(format: string): Command;
    audioCodec(codec: string): Command;
    audioBitrate(bitrate: string | number): Command;
    format(format: string): Command;
    on(event: EventName, handler: (arg?: any) => void): Command;
    pipe(stream: Writable, opts?: { end?: boolean }): Writable;
  }

  interface FfmpegStatic {
    (input?: string | Readable): Command;
    setFfmpegPath(path: string): void;
  }

  const ffmpeg: FfmpegStatic;
  export = ffmpeg;
}
