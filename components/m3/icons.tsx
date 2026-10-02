import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Glyph({ path, ...props }: IconProps & { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true" {...props}>
      <path fill="currentColor" d={path} />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Glyph
      path="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
      {...props}
    />
  );
}

export function IconClose(props: IconProps) {
  return (
    <Glyph path="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" {...props} />
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Glyph path="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" {...props} />
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Glyph path="M5 20h14v-2H5zm7-18-7 7h4v6h6V9h4z" {...props} />
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Glyph
      path="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.6.23-1.16.54-1.67.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.4 1.07.72 1.67.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.49-.42l.36-2.54c.6-.22 1.16-.54 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2"
      {...props}
    />
  );
}

export function IconMore(props: IconProps) {
  return <Glyph path="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2" {...props} />;
}

export function IconTune(props: IconProps) {
  return <Glyph path="M3 17v2h6v-2zm0-12v2h10V5zm10 16v-2h8v-2h-8v-2h-2v6zM7 9v2H3v2h4v2h2V9zm14 4v-2H11v2zm-6-4h2V7h4V5h-4V3h-2z" {...props} />;
}

export function IconAdd(props: IconProps) {
  return <Glyph path="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" {...props} />;
}

export function IconArrowUp(props: IconProps) {
  return <Glyph path="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" {...props} />;
}

export function IconArrowDown(props: IconProps) {
  return <Glyph path="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" {...props} />;
}

export function IconChevronLeft(props: IconProps) {
  return <Glyph path="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" {...props} />;
}

export function IconChevronRight(props: IconProps) {
  return <Glyph path="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" {...props} />;
}

export function IconCheck(props: IconProps) {
  return <Glyph path="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" {...props} />;
}

export function IconGrip(props: IconProps) {
  return (
    <Glyph
      path="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"
      {...props}
    />
  );
}

export function IconLibrary(props: IconProps) {
  return <Glyph path="M21.58 16.09 20.49 8.43A3.01 3.01 0 0 0 17.53 5H6.47a3.01 3.01 0 0 0-2.96 3.43l-1.09 7.66A2.55 2.55 0 0 0 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91M11 11H9v2H8v-2H6v-1h2V8h1v2h2zm4-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2m2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2" {...props} />;
}

export function IconQueue(props: IconProps) {
  return <Glyph path="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1v8l6-4z" {...props} />;
}

export function IconTrophy(props: IconProps) {
  return <Glyph path="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2M5 8V7h2v3.82C5.84 10.4 5 9.3 5 8m14 0c0 1.3-.84 2.4-2 2.82V7h2z" {...props} />;
}

export function IconChecklist(props: IconProps) {
  return <Glyph path="M22 7h-9v2h9zm0 8h-9v2h9zM5.54 11 2 7.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41zm0 8L2 15.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41z" {...props} />;
}

export function IconViewList(props: IconProps) {
  return <Glyph path="M3 14h4v-4H3zm0 5h4v-4H3zM3 9h4V5H3zm5 5h13v-4H8zm0 5h13v-4H8zM8 5v4h13V5z" {...props} />;
}

export function IconViewCompact(props: IconProps) {
  return <Glyph path="M4 15h16v-2H4zm0 4h16v-2H4zm0-8h16V9H4zm0-6v2h16V5z" {...props} />;
}

export function IconViewGrid(props: IconProps) {
  return <Glyph path="M3 3v8h8V3zm6 6H5V5h4zm-6 4v8h8v-8zm6 6H5v-4h4zm4-16v8h8V3zm6 6h-4V5h4zm-6 4v8h8v-8zm6 6h-4v-4h4z" {...props} />;
}

export function IconSort(props: IconProps) {
  return <Glyph path="M3 18h6v-2H3zM3 6v2h18V6zm0 7h12v-2H3z" {...props} />;
}

export function IconDelete(props: IconProps) {
  return <Glyph path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z" {...props} />;
}

export function IconEdit(props: IconProps) {
  return <Glyph path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z" {...props} />;
}

export function IconStar(props: IconProps) {
  return <Glyph path="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" {...props} />;
}

export function IconHelp(props: IconProps) {
  return <Glyph path="M11 18h2v-2h-2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4" {...props} />;
}

export function IconPalette(props: IconProps) {
  return <Glyph path="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8m-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" {...props} />;
}

export function IconLink(props: IconProps) {
  return <Glyph path="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5" {...props} />;
}

export function IconBackup(props: IconProps) {
  return <Glyph path="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A6 6 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96M14 13v4h-4v-4H7l5-5 5 5z" {...props} />;
}

export function IconSync(props: IconProps) {
  return <Glyph path="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8m0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4z" {...props} />;
}

export function IconError(props: IconProps) {
  return <Glyph path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2zm0-4h-2V7h2z" {...props} />;
}

export function IconExpandMore(props: IconProps) {
  return <Glyph path="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" {...props} />;
}

export function IconUndo(props: IconProps) {
  return <Glyph path="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8" {...props} />;
}

export function IconKeyboard(props: IconProps) {
  return <Glyph path="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m-9 3h2v2h-2zm0 3h2v2h-2zM8 8h2v2H8zm0 3h2v2H8zm-1 2H5v-2h2zm0-3H5V8h2zm9 7H8v-2h8zm0-4h-2v-2h2zm0-3h-2V8h2zm3 3h-2v-2h2zm0-3h-2V8h2z" {...props} />;
}
