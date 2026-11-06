/**
 * Icons der App (Lucide, Design-System v2: Outline, 24-px-Raster, stroke-width 1.75).
 *
 * Schlüssel sind die Lucide-Namen in kebab-case. Anders als im Bildkonverter gibt es
 * keine Font-Awesome-Aliase: Neubau, keine Altdaten. Neue Icons hier eintragen;
 * tests/unit/ui/AppIcon.spec.ts prüft, dass jeder Eintrag eine Komponente ist.
 */
import type { Component } from 'vue';
import {
  Check,
  CircleAlert,
  CircleHelp,
  Crop,
  Download,
  FlipHorizontal2,
  FlipVertical2,
  Grid3x3,
  ImageUp,
  Info,
  Languages,
  LoaderCircle,
  Maximize2,
  Moon,
  Move,
  Ratio,
  Redo2,
  RotateCcw,
  RotateCw,
  RotateCcwSquare,
  Sun,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from 'lucide-vue-next';

export const iconMap = {
  check: Check,
  'circle-alert': CircleAlert,
  'circle-help': CircleHelp,
  crop: Crop,
  download: Download,
  'flip-horizontal-2': FlipHorizontal2,
  'flip-vertical-2': FlipVertical2,
  'grid-3x3': Grid3x3,
  'image-up': ImageUp,
  info: Info,
  languages: Languages,
  'loader-circle': LoaderCircle,
  'maximize-2': Maximize2,
  moon: Moon,
  move: Move,
  ratio: Ratio,
  'redo-2': Redo2,
  'rotate-ccw': RotateCcw,
  'rotate-ccw-square': RotateCcwSquare,
  'rotate-cw': RotateCw,
  sun: Sun,
  'triangle-alert': TriangleAlert,
  'undo-2': Undo2,
  upload: Upload,
  x: X,
} satisfies Record<string, Component>;

export type IconName = keyof typeof iconMap;
