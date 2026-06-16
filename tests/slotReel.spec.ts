import { describe, it, expect } from 'vitest'
import { lerp, backout, symbolY, targetPosition, fitFontSize } from '../src/lib/slotReel'
import type { FontMeasureContext } from '../src/lib/slotReel'

describe('lerp', () => {
  it('returns the start value at t=0 and the end value at t=1', () => {
    expect(lerp(2, 10, 0)).toBe(2)
    expect(lerp(2, 10, 1)).toBe(10)
  })

  it('interpolates linearly in between', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(-4, 4, 0.25)).toBe(-2)
  })
})

describe('backout easing (ported from Pixi)', () => {
  const ease = backout(0.6)

  it('starts at 0 and ends exactly at 1', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('overshoots past 1 near the end, giving the settle-back feel', () => {
    expect(ease(0.9)).toBeGreaterThan(1)
    expect(ease(0.9)).toBeCloseTo(1.0044, 4)
  })

  it('stays monotonically below the overshoot peak at the very end', () => {
    expect(ease(0.99)).toBeGreaterThan(1)
    expect(ease(0.99)).toBeLessThan(ease(0.9))
  })
})

describe('symbolY reel layout', () => {
  it('places symbol j at its wheel position scaled by cell size', () => {
    // y = (position + j) % count * size - size
    expect(symbolY(0, 0, 10, 100)).toBe(-100)
    expect(symbolY(0, 1, 10, 100)).toBe(0)
    expect(symbolY(0, 2, 10, 100)).toBe(100)
  })

  it('wraps around the symbol count', () => {
    expect(symbolY(9, 1, 10, 100)).toBe(-100)
    expect(symbolY(9.5, 3, 10, 100)).toBe(150)
  })
})

describe('targetPosition', () => {
  it('lands the target symbol in the visible cell', () => {
    // position = (count + 1) - targetIndex, ported verbatim
    expect(targetPosition(139, 5)).toBe(135)
    expect(targetPosition(139, 0)).toBe(140)
  })
})

describe('fitFontSize', () => {
  // stub measuring context: width grows with font size and text length
  function ctxStub (): FontMeasureContext {
    return {
      font: '',
      measureText (text: string) {
        const size = parseFloat(this.font.replace('bold ', ''))
        return { width: size * text.length * 0.5 }
      }
    }
  }

  it('keeps the start size when the text already fits', () => {
    // 16px * 4 chars * 0.5 = 32 <= 100
    expect(fitFontSize(ctxStub(), 'abcd', 100, 1)).toBe(16)
  })

  it('shrinks the font until the text fits', () => {
    // needs size * 20 * 0.5 <= 100  =>  size <= 10
    expect(fitFontSize(ctxStub(), 'a'.repeat(20), 100, 1)).toBe(10)
  })

  it('bottoms out at 1 for text that can never fit', () => {
    expect(fitFontSize(ctxStub(), 'a'.repeat(1000), 10, 1)).toBe(1)
  })

  it('applies the canvas scale factor when measuring', () => {
    // at sizeScale 2: size * 2 * 20 * 0.5 <= 100  =>  size <= 5
    expect(fitFontSize(ctxStub(), 'a'.repeat(20), 100, 2)).toBe(5)
  })
})
