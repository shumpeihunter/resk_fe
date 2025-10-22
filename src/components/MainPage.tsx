import { useEffect, useState } from "react";
import { UploadCard } from "./UploadCard";
import { TranscriptCard } from "./TranscriptCard";
import { ScriptGeneratorCard } from "./ScriptGeneratorCard";
import { ScriptSectionList } from "./ScriptSectionList";
import { ScriptSection } from "../types/script";
import {
  ApiError,
  batchSynthesizeToZip,
  generateScript,
  synthesizeSpeech,
  transcribeVideo
} from "../services/api";
import { parseScriptMarkdown } from "../utils/scriptParser";
import { downloadScriptAsText } from "../utils/textDownload";

const STORAGE_KEY = "reskiling_ai_workspace_state";

type PersistedWorkspaceState = {
  transcript: string;
  transcribedAudioUrl?: string;
  lastUploadedFileName: string | null;
  sections: ScriptSection[];
  batchZipUrl: string | null;
};

const getDefaultPersistedState = (): PersistedWorkspaceState => ({
  transcript: "",
  transcribedAudioUrl: undefined,
  lastUploadedFileName: null,
  sections: [],
  batchZipUrl: null
});

const reviveSections = (sections: ScriptSection[]): ScriptSection[] =>
  sections.map((section) => ({
    ...section,
    isSynthesizing: false,
    error: section.error ?? null
  }));

const loadPersistedState = (): PersistedWorkspaceState => {
  if (typeof window === "undefined") {
    return getDefaultPersistedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultPersistedState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
    return {
      transcript: typeof parsed.transcript === "string" ? parsed.transcript : "",
      transcribedAudioUrl:
        typeof parsed.transcribedAudioUrl === "string"
          ? parsed.transcribedAudioUrl
          : undefined,
      lastUploadedFileName:
        typeof parsed.lastUploadedFileName === "string"
          ? parsed.lastUploadedFileName
          : null,
      sections: Array.isArray(parsed.sections)
        ? reviveSections(parsed.sections as ScriptSection[])
        : [],
      batchZipUrl:
        typeof parsed.batchZipUrl === "string" ? parsed.batchZipUrl : null
    };
  } catch {
    return getDefaultPersistedState();
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "不明なエラーが発生しました。";
};

const createSectionId = (index: number) => {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `section-${index}-${unique}`;
};

export const MainPage = () => {
  const persistedState = loadPersistedState();

  const [transcript, setTranscript] = useState(persistedState.transcript);
  const [transcribedAudioUrl, setTranscribedAudioUrl] = useState<
    string | undefined
  >(persistedState.transcribedAudioUrl);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [lastUploadedFileName, setLastUploadedFileName] = useState<
    string | null
  >(persistedState.lastUploadedFileName);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [transcribeStatusLabel, setTranscribeStatusLabel] = useState<
    string | null
  >(null);

  const [sections, setSections] = useState<ScriptSection[]>(
    persistedState.sections
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isBatching, setIsBatching] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchZipUrl, setBatchZipUrl] = useState<string | null>(
    persistedState.batchZipUrl
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedWorkspaceState = {
      transcript,
      transcribedAudioUrl,
      lastUploadedFileName,
      sections: sections.map((section) => ({
        ...section,
        isSynthesizing: false,
        error: section.error ?? null
      })),
      batchZipUrl
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    transcript,
    transcribedAudioUrl,
    lastUploadedFileName,
    sections,
    batchZipUrl
  ]);

  const handleUpload = async (file: File) => {
    setIsTranscribing(true);
    setTranscribeError(null);
    setLastUploadedFileName(file.name);
    setGenerateError(null);
    setSections([]);
    setBatchError(null);
    setBatchZipUrl(null);
    setUploadProgress(0);
    setTranscribeStatusLabel("文字起こし中です");

    try {
      const { transcript: nextTranscript, audioUrl } = await transcribeVideo(
        file,
        {
          onUploadProgress: (percent) => {
            setUploadProgress(
              typeof percent === "number"
                ? Math.max(0, Math.min(100, Math.round(percent)))
                : null
            );
          }
        }
      );
      setTranscript(nextTranscript);
      setTranscribedAudioUrl(audioUrl);
      setTranscribeStatusLabel(null);
    } catch (error) {
      setTranscribeError(getErrorMessage(error));
      setTranscript("");
      setTranscribedAudioUrl(undefined);
      setTranscribeStatusLabel("エラーです");
    } finally {
      setIsTranscribing(false);
      setUploadProgress(null);
    }
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setGenerateError("文字起こし結果がありません。");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setBatchZipUrl(null);
    setBatchError(null);

    try {
      const { response } = await generateScript(transcript);
      const parsedSections = parseScriptMarkdown(response);

      if (!parsedSections.length) {
        setGenerateError("台本を解析できませんでした。");
        return;
      }

      setSections(
        parsedSections.map((section, index) => ({
          id: createSectionId(index),
          title: section.title,
          body: section.body
        }))
      );
    } catch (error) {
      setGenerateError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const synthesizeSection = async (
    sectionId: string,
    text: string
  ): Promise<string | undefined> => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, isSynthesizing: true, error: null }
          : section
      )
    );

    try {
      const { audioUrl } = await synthesizeSpeech(text);
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, audioUrl, isSynthesizing: false }
            : section
        )
      );
      return audioUrl;
    } catch (error) {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                isSynthesizing: false,
                error: getErrorMessage(error)
              }
            : section
        )
      );
      return undefined;
    }
  };

  const handleSynthesize = async (sectionId: string) => {
    const target = sections.find((section) => section.id === sectionId);
    if (!target) {
      return;
    }
    await synthesizeSection(sectionId, target.body);
  };

  const handleBatchSynthesize = async () => {
    if (!sections.length) {
      return;
    }

    const textList = sections
      .map((section) => section.body.trim())
      .filter((body) => body.length > 0);

    if (!textList.length) {
      setBatchError("音声化できる文章がありません。");
      return;
    }

    setIsBatching(true);
    setBatchError(null);
    setBatchZipUrl(null);
    try {
      const { zipUrl } = await batchSynthesizeToZip(textList);
      setBatchZipUrl(zipUrl);
      setBatchError(null);
    } catch (error) {
      setBatchZipUrl(null);
      setBatchError(getErrorMessage(error));
    } finally {
      setIsBatching(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setTranscribedAudioUrl(undefined);
    setSections([]);
    setLastUploadedFileName(null);
    setTranscribeError(null);
    setGenerateError(null);
    setBatchError(null);
    setBatchZipUrl(null);
    setTranscribeStatusLabel(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadScript = () => {
    try {
      downloadScriptAsText(
        sections.map((section) => ({
          title: section.title,
          body: section.body
        }))
      );
    } catch (error) {
      setBatchError(getErrorMessage(error));
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          台本作成ワークスペース
        </h1>
        <p className="text-sm text-slate-600 md:text-base">
          動画から文字起こし・台本生成・音声合成までを一気通貫で行えます。
        </p>
        {(transcript || sections.length > 0) && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              保存済みの結果をリセット
            </button>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <UploadCard
          onUpload={handleUpload}
          isLoading={isTranscribing}
          error={transcribeError}
          lastUploadedFileName={lastUploadedFileName}
          progress={uploadProgress}
          statusLabel={transcribeStatusLabel}
        />
        <ScriptGeneratorCard
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          disabled={!transcript || isTranscribing}
          error={generateError}
        />
      </section>

      <TranscriptCard
        transcript={transcript}
        audioUrl={transcribedAudioUrl}
      />

      <ScriptSectionList
        sections={sections}
        onSynthesize={handleSynthesize}
        onBatchSynthesize={handleBatchSynthesize}
        isBatching={isBatching}
        batchError={batchError}
        batchZipUrl={batchZipUrl}
        onDownloadScript={sections.length ? handleDownloadScript : undefined}
      />
    </main>
  );
};
