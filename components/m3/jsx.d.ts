import type { DetailedHTMLProps, HTMLAttributes } from "react";

type HostProps<P = object> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & P;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "m3-badge": HostProps<{ label?: string }>;
      "m3-button": HostProps<{
        variant?: "filled" | "elevated" | "tonal" | "outlined" | "text";
        size?: "extra-small" | "small" | "medium" | "large" | "extra-large";
        shape?: "round" | "square";
        padding?: "default" | "small";
        disabled?: boolean;
        loading?: boolean;
        fullWidth?: boolean;
        iconOnly?: boolean;
        type?: "button" | "submit" | "reset";
        name?: string | null;
        value?: string | null;
      }>;
      "m3-card": HostProps<{
        variant?: "elevated" | "filled" | "outlined";
        clickable?: boolean;
        disabled?: boolean;
        dragged?: boolean;
        width?: "auto" | "full" | "fixed";
      }>;
      "m3-checkbox": HostProps<{
        checked?: boolean;
        disabled?: boolean;
        indeterminate?: boolean;
        name?: string | null;
        value?: string | null;
        required?: boolean;
      }>;
      "m3-chip": HostProps<{
        variant?: "assist" | "filter" | "input" | "suggestion";
        selected?: boolean;
        disabled?: boolean;
        elevated?: boolean;
        removable?: boolean;
      }>;
      "m3-dialog": HostProps<{
        open?: boolean;
        headline?: string;
        closeOnScrim?: boolean;
        closeOnEscape?: boolean;
      }>;
      "m3-divider": HostProps<{
        variant?: "full-width" | "inset" | "middle";
        orientation?: "horizontal" | "vertical";
        thickness?: "1" | "2" | "4" | number;
      }>;
      "m3-icon-button": HostProps<{
        variant?: "standard" | "filled" | "tonal" | "outlined";
        size?: "small" | "medium" | "large";
        disabled?: boolean;
        selected?: boolean;
        toggle?: boolean;
        type?: "button" | "submit" | "reset";
      }>;
      "m3-list": HostProps<{ staggered?: boolean }>;
      "m3-list-item": HostProps<{
        lines?: "1" | "2" | "3";
        selected?: boolean;
        disabled?: boolean;
        clickable?: boolean;
        shape?: "default" | "rounded" | "full";
        value?: string | null;
      }>;
      "m3-menu": HostProps<{
        open?: boolean;
        placement?:
          | "bottom-start"
          | "bottom-center"
          | "bottom-end"
          | "top-start"
          | "top-center"
          | "top-end"
          | "right-start"
          | "right-center"
          | "right-end"
          | "left-start"
          | "left-center"
          | "left-end";
        offset?: number;
      }>;
      "m3-menu-item": HostProps<{ value?: string; disabled?: boolean }>;
      "m3-radio-button": HostProps<{
        checked?: boolean;
        disabled?: boolean;
        required?: boolean;
        name?: string | null;
        value?: string | null;
        size?: "small" | "medium" | "large";
      }>;
      "m3-search-bar": HostProps<{
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        name?: string | null;
        required?: boolean;
      }>;
      "m3-slider": HostProps<{
        min?: number;
        max?: number;
        value?: number;
        step?: number;
        disabled?: boolean;
        name?: string | null;
      }>;
      "m3-snackbar": HostProps<{
        message?: string;
        open?: boolean;
        duration?: number;
        lines?: "1" | "2";
        live?: "polite" | "assertive";
      }>;
      "m3-split-button": HostProps<{
        variant?: "filled" | "outlined" | "tonal" | "elevated";
        open?: boolean;
        disabled?: boolean;
        menuLabel?: string;
      }>;
      "m3-switch": HostProps<{
        checked?: boolean;
        disabled?: boolean;
        name?: string | null;
        value?: string | null;
        required?: boolean;
      }>;
      "m3-tabs": HostProps<{
        activeTab?: number;
        orientation?: "horizontal" | "vertical";
        activation?: "automatic" | "manual";
      }>;
      "m3-tab": HostProps<{ panel?: string; value?: string; disabled?: boolean }>;
      "m3-text-field": HostProps<{
        variant?: "filled" | "outlined";
        type?: string;
        label?: string;
        value?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        name?: string | null;
        helperText?: string;
        error?: boolean;
        errorText?: string;
        showCounter?: boolean;
        autocomplete?: string | null;
      }>;
      "m3-tooltip": HostProps<{
        text?: string;
        variant?: "plain" | "rich";
        placement?: "top" | "bottom" | "left" | "right";
        delay?: number;
      }>;
      "m3-top-app-bar": HostProps<{
        variant?: "small" | "center-aligned" | "medium" | "large";
        elevated?: boolean;
        headline?: string;
        scrollBehavior?: "none" | "hide" | "shrink";
      }>;
    }
  }
}

export {};
