import type * as React from "react";

/**
 * Modal Gallery — a review surface that mounts every dialog, drawer and wizard
 * in the app with representative mock props, so the whole modal layer can be
 * checked in one place instead of clicking through 20 pages.
 */

export type ModalKind = "modal" | "confirm" | "wizard" | "drawer" | "progress";

export interface ModalEntry {
  /** Stable slug — also the deep link (`/dev/modals#<id>`). */
  id: string;
  /** Component name as written in the source. */
  name: string;
  /** Product area, e.g. "Site · NVR". */
  module: string;
  /** Source file, relative to the repo root. */
  file: string;
  kind: ModalKind;
  /** How an operator reaches this in the real app. */
  trigger: string;
  /** Anything worth knowing while reviewing — variant, state, empty case. */
  note?: string;
  /** Mounts the component. Called only while the entry is the active one. */
  render: (close: () => void) => React.ReactNode;
}
