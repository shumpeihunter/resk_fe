import { FormEvent, useState } from "react";

type UploadCardProps = {
  onUpload: (file: File) => Promise<void> | void;
  isLoading: boolean;
  error?: string | null;
  lastUploadedFileName?: string | null;
  progress?: number | null;
  statusLabel?: string | null;
};

export const UploadCard = ({
  onUpload,
  isLoading,
  error,
  lastUploadedFileName,
  progress,
  statusLabel
}: UploadCardProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      return;
    }
    await onUpload(file);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">動画をアップロード</h2>
        <p className="mt-1 text-sm text-slate-600">
          mp4またはmovファイルを選択して文字起こしを開始します。
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label
          htmlFor="upload"
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition ${
            isLoading
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer hover:border-slate-400 hover:bg-slate-100"
          }`}
          aria-disabled={isLoading}
        >
          <span className="text-sm font-medium text-slate-700">
            ファイルをここにドラッグ＆ドロップ <br />
            またはクリックして選択
          </span>
          <span className="text-xs text-slate-500">対応形式: mp4, mov</span>
          <input
            id="upload"
            type="file"
            className="hidden"
            accept=".mp4,.mov"
            disabled={isLoading}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            選択中:
            <span className="ml-1 font-medium text-slate-800">
              {file?.name ?? "未選択"}
            </span>
          </span>
          {lastUploadedFileName && (
            <span className="text-xs text-slate-500">
              前回アップロード: {lastUploadedFileName}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading
            ? `アップロード中…${
                typeof progress === "number" ? `${Math.round(progress)}%` : ""
              }`
            : "文字起こしを開始"}
        </button>
        {statusLabel && (
          <p className="text-sm font-medium text-slate-700">{statusLabel}</p>
        )}
        {typeof progress === "number" && (
          <div className="space-y-2 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>アップロード進捗</span>
              <span className="font-semibold text-slate-900">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}
        {progress === null && isLoading && (
          <p className="text-xs text-slate-500">アップロード進捗を計測しています…</p>
        )}
        {error && <p className="text-sm text-red-600">エラー: {error}</p>}
      </form>
    </div>
  );
};
