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
