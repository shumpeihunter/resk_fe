export const downloadScriptAsText = (
  sections: { title: string; body: string }[],
  filename = "script.txt"
) => {
  if (!sections.length) {
    throw new Error("ダウンロードできる台本がありません。");
  }

  const content = sections
    .map(
      (section, index) =>
        `# 第${index + 1}章 ${section.title}\n${section.body.trim()}`
    )
    .join("\n\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};
