# Global CSS architecture

`app/globals.css` is the single global stylesheet entrypoint. It keeps Tailwind first, then imports the extracted files in the same order as the former monolithic stylesheet. The order is intentional: later imports retain the original cascade, including fachlich eingebettete breakpoint rules and reduced-motion overrides.

Import order:

1. `tokens.css`
2. `base.css`
3. `m3-hosts.css`
4. `library-shell.css`
5. `utilities.css`
6. `filters.css`
7. `library-list.css`
8. `dialogs.css`
9. `editor.css`
10. `settings.css`
11. `overlays.css`
12. `motion.css`
13. `motion-reduced.css`

Responsive rules stay beside the owning domain rules in these files. A
breakpoint block is split only where the original cascade crossed a domain
boundary. `motion-reduced.css` remains last so its reduced-motion overrides
continue to win.

The layering values are unchanged. The effective z-index hierarchy is:

- `m3-top-app-bar`: `20`
- `.library-tools`: `10`
- `.mobile-add-fab`: `45`
- `m3-snackbar`: `80`
- editor sticky tabs and mobile navigation: `3`
- settings mobile back navigation: `2`
