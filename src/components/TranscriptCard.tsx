type TranscriptCardProps = {
  transcript: string;
  audioUrl?: string;
};

export const TranscriptCard = ({
  transcript,
  audioUrl
}: TranscriptCardProps) => {
  if (!transcript) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">文字起こし結果</h3>
        {audioUrl && (
          <a
            href={audioUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            変換音声を開く
          </a>
        )}
      </div>
      <div className="rounded-xl bg-slate-50 p-4">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {transcript}
        </pre>
      </div>
      {audioUrl && (
        <audio
          controls
          className="w-full rounded-xl bg-slate-100 px-3 py-2"
          src={audioUrl}
        />
      )}
    </div>
  );
};
