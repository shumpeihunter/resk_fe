type ScriptGeneratorCardProps = {
  onGenerate: () => Promise<void> | void;
  isGenerating: boolean;
  disabled?: boolean;
  error?: string | null;
};

export const ScriptGeneratorCard = ({
  onGenerate,
  isGenerating,
  disabled,
  error
}: ScriptGeneratorCardProps) => (
  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">台本を生成</h3>
      <p className="mt-1 text-sm text-slate-600">
        文字起こし結果をもとに章立てされた台本を生成します。
      </p>
    </div>
    <button
      type="button"
      disabled={disabled || isGenerating}
      onClick={onGenerate}
      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {isGenerating ? "生成中..." : "台本を生成する"}
    </button>
    {error && <p className="text-sm text-red-600">エラー: {error}</p>}
  </div>
);
