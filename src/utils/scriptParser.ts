export type ParsedScriptSection = {
  title: string;
  body: string;
};

const sanitizeLine = (line: string) =>
  line.replace(/^[*-]\s*/, "").replace(/^\d+\.\s*/, "");

export const parseScriptMarkdown = (
  markdown: string
): ParsedScriptSection[] => {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      continue;
    }

    if (/^#+\s/.test(line)) {
      const title = line.replace(/^#+\s*/, "").trim();
      current = { title, lines: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(sanitizeLine(line.trim()));
    }
  }

  return sections
    .map((section) => ({
      title: section.title,
      body: section.lines.join("\n").trim()
    }))
    .filter((section) => section.title && section.body);
};
