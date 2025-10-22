export type ScriptSection = {
  id: string;
  title: string;
  body: string;
  audioUrl?: string;
  isSynthesizing?: boolean;
  error?: string | null;
};
