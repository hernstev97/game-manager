export const ADAPTIVE_DIALOG_STYLE = `
.dialog:not([open]) {
  display: none !important;
}

.dialog[open] {
  transform-origin: center;
  animation: ggrid-dialog-enter var(--motion-duration-long, 420ms)
    var(--motion-easing-decelerate, cubic-bezier(.05, .7, .1, 1)) both;
}

.dialog[open]::backdrop {
  animation: ggrid-backdrop-enter var(--motion-duration-medium, 300ms)
    var(--motion-easing-standard, cubic-bezier(.2, 0, 0, 1)) both;
}

:host(.adaptive-fullscreen) .icon-slot,
:host(.adaptive-editor) .icon-slot {
  display: none;
}

:host(.adaptive-editor) .dialog[open] {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-width: min(664px, calc(100vw - 24px));
  width: min(664px, calc(100vw - 24px));
  background-color: var(--md-sys-color-surface-container, #f2ecf4);
  overflow: hidden;
}

:host(.adaptive-editor) .dialog[open] .headline {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}

:host(.adaptive-editor) .dialog[open] .content,
:host(.adaptive-editor) .dialog[open] .content > slot {
  display: contents;
}

:host(.adaptive-editor) .dialog[open] .actions {
  grid-column: 2;
  grid-row: 3;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}

@media (max-width: 599px) {
  :host(.adaptive-fullscreen) .dialog[open],
  :host(.adaptive-editor) .dialog[open] {
    box-sizing: border-box;
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    border-radius: 0;
    grid-template-columns: 56px minmax(0, 1fr);
    grid-template-rows: calc(56px + env(safe-area-inset-top)) minmax(0, 1fr) auto;
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
    transform-origin: right center;
    animation-name: ggrid-fullscreen-enter;
  }

  :host(.adaptive-fullscreen) .dialog[open] {
    display: grid;
  }

  :host(.adaptive-fullscreen) .dialog[open] .icon-slot,
  :host(.adaptive-editor) .dialog[open] .icon-slot {
    box-sizing: border-box;
    display: flex !important;
    grid-column: 1;
    grid-row: 1;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: env(safe-area-inset-top) 4px 0;
    color: var(--md-sys-color-on-surface, #1d1b20);
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
  }

  :host(.adaptive-fullscreen) .dialog[open] .headline,
  :host(.adaptive-editor) .dialog[open] .headline {
    box-sizing: border-box;
    grid-column: 2;
    grid-row: 1;
    align-self: stretch;
    min-width: 0;
    margin: 0;
    padding: calc(12px + env(safe-area-inset-top)) 16px 12px 0;
    overflow: hidden;
    color: var(--md-sys-color-on-surface, #1d1b20);
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 2rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host(.adaptive-fullscreen) .dialog[open] .content {
    grid-column: 1 / -1;
    grid-row: 2;
    min-height: 0;
    padding: 12px 16px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  :host(.adaptive-fullscreen) .dialog[open] .actions,
  :host(.adaptive-editor) .dialog[open] .actions {
    grid-column: 1 / -1;
    grid-row: 3;
    min-width: 0;
    padding: 10px 16px max(12px, env(safe-area-inset-bottom));
    flex-wrap: wrap;
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4cf);
  }

  :host(.adaptive-sheet) .dialog[open] {
    width: 100vw;
    max-width: none;
    max-height: min(88dvh, 760px);
    margin: auto 0 0;
    border-radius: 28px 28px 0 0;
    transform-origin: center bottom;
    animation-name: ggrid-sheet-enter;
  }

  :host(.adaptive-sheet) .dialog[open] .headline {
    padding: 20px 20px 12px;
    text-align: left;
  }

  :host(.adaptive-sheet) .dialog[open] .content {
    min-height: 0;
    padding: 0 16px 20px;
    overscroll-behavior: contain;
  }

  :host(.adaptive-sheet) .dialog[open] .actions {
    padding: 10px 16px max(12px, env(safe-area-inset-bottom));
    flex-wrap: wrap;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4cf);
  }
}

@media (min-width: 600px) {
  :host(.adaptive-side) .dialog[open] {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: min(400px, calc(100vw - 56px));
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0 0 0 auto;
    border-radius: var(--md-sys-shape-corner-large, 16px) 0 0 var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-low, #f8f2fa);
    transform-origin: right center;
    animation-name: ggrid-side-enter;
  }

  :host(.adaptive-side) .dialog[open] .headline {
    padding: 24px 24px 16px;
    text-align: left;
  }

  :host(.adaptive-side) .dialog[open] .content {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0 24px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  :host(.adaptive-side) .dialog[open] .actions {
    padding: 16px 24px 24px;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4cf);
  }
}

@keyframes ggrid-side-enter {
  from {
    opacity: .8;
    transform: translateX(var(--motion-sheet-distance, 48px));
  }
}

@keyframes ggrid-dialog-enter {
  from {
    opacity: 0;
    filter: blur(var(--motion-enter-blur, 0px));
    transform: translateY(var(--motion-enter-distance, 12px))
      scale(var(--motion-enter-scale, .96));
  }
}

@keyframes ggrid-fullscreen-enter {
  from {
    opacity: .72;
    filter: blur(var(--motion-enter-blur, 0px));
    transform: translateX(var(--motion-fullscreen-distance, 24px));
  }
}

@keyframes ggrid-sheet-enter {
  from {
    opacity: .8;
    transform: translateY(var(--motion-sheet-distance, 48px))
      scale(var(--motion-enter-scale, .97));
  }
}

@keyframes ggrid-backdrop-enter {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .dialog[open],
  .dialog[open]::backdrop {
    animation: none;
  }
}
`;

export const MENU_MOTION_STYLE = `
:host([open]) .surface {
  animation: ggrid-menu-enter var(--motion-duration-medium, 280ms)
    var(--motion-easing-decelerate, cubic-bezier(.05, .7, .1, 1)) both;
}

@keyframes ggrid-menu-enter {
  from {
    opacity: 0;
    filter: blur(var(--motion-enter-blur, 0px));
    transform: translateY(calc(var(--motion-enter-distance, 8px) * -.45))
      scale(var(--motion-enter-scale, .96));
  }
}

@media (prefers-reduced-motion: reduce) {
  :host([open]) .surface { animation: none; }
}
`;

export const RESPONSIVE_TABS_STYLE = `
@media (max-width: 599px) {
  :host(.mobile-scrollable) {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  :host(.mobile-scrollable)::-webkit-scrollbar {
    display: none;
  }

  :host(.mobile-scrollable) .tabs-container {
    width: max-content;
    min-width: 100%;
  }

  :host(.mobile-scrollable) ::slotted(m3-tab) {
    flex: 0 0 auto;
    min-width: max-content;
  }
}
`;

export function installShadowStyle(host: HTMLElement | null, key: string, css: string) {
  const root = host?.shadowRoot;
  if (!root) return;
  let style = root.querySelector<HTMLStyleElement>(`style[data-ggrid-${key}]`);
  if (!style) {
    style = document.createElement("style");
    style.dataset[`ggrid${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`] = "";
    root.appendChild(style);
  }
  style.textContent = css;
}
