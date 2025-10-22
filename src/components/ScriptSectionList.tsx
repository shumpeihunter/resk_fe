import { ScriptSection } from "../types/script";

type ScriptSectionListProps = {
  sections: ScriptSection[];
  onSynthesize: (sectionId: string) => Promise<void> | void;
  onBatchSynthesize: () => Promise<void> | void;
  isBatching: boolean;
  batchError?: string | null;
  batchZipUrl?: string | null;
};

export const ScriptSectionList = ({
  sections,
  onSynthesize,
  onBatchSynthesize,
  isBatching,
  batchError,
  batchZipUrl
}: ScriptSectionListProps) => {
  if (!sections.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            章ごとの台本
          </h3>
          <p className="text-sm text-slate-600">
            各章を選択して音声化するか、まとめて音声化できます。
          </p>
        </div>
        <button
          type="button"
          onClick={onBatchSynthesize}
          disabled={isBatching}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isBatching ? "一括音声化中..." : "一括音声化とダウンロード"}
        </button>
        {batchZipUrl && (
          <a
            href={batchZipUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-emerald-600 underline underline-offset-4 hover:text-emerald-500"
          >
            生成されたZIPをダウンロード
          </a>
        )}
      </div>

      {batchError && (
        <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {batchError}
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section, index) => (
          <article
            key={section.id}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  第{index + 1}章
                </p>
                <h4 className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onSynthesize(section.id)}
                disabled={section.isSynthesizing}
                className="inline-flex items-center justify-center rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                {section.isSynthesizing ? "音声変換中..." : "この章を音声化"}
              </button>
            </header>
            <div className="rounded-xl bg-slate-50 p-4">
              {section.body.split(/\n+/).map((line, lineIndex) => (
                <p
                  key={lineIndex}
                  className="mb-2 text-sm leading-relaxed text-slate-800 last:mb-0"
                >
                  {line}
                </p>
              ))}
            </div>

            {section.error && (
              <p className="text-sm text-red-600">エラー: {section.error}</p>
            )}

            {section.audioUrl && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <audio
                  controls
                  className="w-full rounded-xl bg-white px-3 py-2"
                  src={section.audioUrl}
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
