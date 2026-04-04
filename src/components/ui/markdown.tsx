"use client";

import ReactMarkdown from "react-markdown";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-horizon">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
