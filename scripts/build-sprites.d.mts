// hand-written declarations for build-sprites.mjs so tests get types
import type { AtlasJson } from '../src/types'

export const SOURCE_SIZE: number
export const CSS_SIZE: number
export const COLUMNS: number
export const GUTTER: number

export function parseIconName (filename: string): { index: number, name: string } | null
export function gridLayout (index: number, cell: number, opts?: { columns?: number, gutter?: number }): { x: number, y: number }
export function sheetSize (count: number, cell: number, opts?: { columns?: number, gutter?: number }): { w: number, h: number }
export function buildAtlasJson (names: string[], image: string): AtlasJson
export function buildCss (names: string[], spriteClass: string, image: string): string
export function scanIcons (dir: string): Promise<string[]>
export function main (): Promise<void>
