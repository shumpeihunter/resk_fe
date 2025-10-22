const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

type ApiErrorPayload = {
  error?: string;
};

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const parseJson = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

const ensureOk = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const payload = (await parseJson(response)) as ApiErrorPayload | null;
  const message =
    (payload && payload.error) ||
    `サーバーエラーが発生しました (HTTP ${response.status})`;
  throw new ApiError(message, response.status);
};

export type TranscriptionResult = {
  audioUrl: string;
  transcript: string;
};

type UploadProgressHandler = (percent: number | null) => void;

type TranscribeOptions = {
  onUploadProgress?: UploadProgressHandler;
};

export const transcribeVideo = (
  file: File,
  options?: TranscribeOptions
): Promise<TranscriptionResult> =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/transcribe`);
    xhr.responseType = "json";

    const handleError = (message: string, status?: number) => {
      reject(new ApiError(message, status));
    };

    xhr.upload.onprogress = (event) => {
      if (!options?.onUploadProgress) {
        return;
      }
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(
          100,
          Math.max(0, (event.loaded / event.total) * 100)
        );
        options.onUploadProgress(percent);
      } else {
        options.onUploadProgress(null);
      }
    };

    xhr.onerror = () => {
      handleError("ネットワークエラーが発生しました。");
    };

    xhr.onload = () => {
      const status = xhr.status;
      const rawResponse = xhr.response;
      const data =
        rawResponse && typeof rawResponse === "object"
          ? (rawResponse as Record<string, unknown>)
          : null;

      if (status >= 200 && status < 300) {
        options?.onUploadProgress?.(100);

        if (data) {
          const audioUrl = data["audio_url"];
          const transcriptText = data["transcript"];
          if (
            typeof audioUrl === "string" &&
            typeof transcriptText === "string"
          ) {
            resolve({
              audioUrl,
              transcript: transcriptText
            });
            return;
          }
        }

        handleError("サーバーから予期しないレスポンスを受信しました。", status);
        return;
      }

      const rawError = data ? data["error"] : null;
      const message =
        typeof rawError === "string"
          ? rawError
          : `サーバーエラーが発生しました (HTTP ${status})`;
      handleError(message, status);
    };

    xhr.send(formData);
  });

export type ScriptGenerationResult = {
  response: string;
};

export const generateScript = async (
  prompt: string
): Promise<ScriptGenerationResult> => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  return ensureOk<ScriptGenerationResult>(response);
};

export type TextToSpeechResult = {
  audioUrl: string;
};

export const synthesizeSpeech = async (
  text: string
): Promise<TextToSpeechResult> => {
  const response = await fetch(`${API_BASE_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await ensureOk<{ audio_url: string }>(response);

  return {
    audioUrl: data.audio_url
  };
};

export type BatchTtsResult = {
  zipUrl: string;
};

export const batchSynthesizeToZip = async (
  textList: string[]
): Promise<BatchTtsResult> => {
  const response = await fetch(`${API_BASE_URL}/batch_tts_to_zip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text_list: textList })
  });

  const data = await ensureOk<{ zip_url: string }>(response);

  return {
    zipUrl: data.zip_url
  };
};

export { ApiError };
