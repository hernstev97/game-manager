"use client";

import type { ReactNode } from "react";
import { IconExpandMore } from "@/components/m3/icons";

/** Editor section; `collapsible` sections start closed (progressive disclosure). */
export function EditorSection({
  id,
  title,
  summary,
  collapsible = false,
  children,
}: {
  id: string;
  title: string;
  summary?: string;
  collapsible?: boolean;
  children: ReactNode;
}) {
  if (collapsible) {
    return (
      <details id={id} className="editor-section is-collapsible">
        <summary className="editor-section-summary">
          <span className="editor-section-heading">
            <span className="editor-section-title">{title}</span>
            {summary ? <span className="editor-section-hint">{summary}</span> : null}
          </span>
          <IconExpandMore className="editor-section-chevron" />
        </summary>
        <div className="editor-section-body">{children}</div>
      </details>
    );
  }
  return (
    <section id={id} className="editor-section" aria-label={title}>
      <h3 className="editor-section-title">{title}</h3>
      <div className="editor-section-body">{children}</div>
    </section>
  );
}
