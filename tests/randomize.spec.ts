import { describe, it, expect, vi, afterEach } from 'vitest'
import rand from '../src/lib/randomize'
import type { Perk } from '../src/types'

// pool of ten perks, indices matching array keys like the views build them
function makePool (count = 10): Perk[] {
  return Array.from({ length: count }, (_, i) => ({ index: i, name: `perk${i}` }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getRandomData', () => {
  it('draws unique perks from the full pool when no limit is set', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const pool = makePool()
    const result = rand.getRandomData(4, [], pool, [])
    // with random pinned to 0 the Fisher-Yates style draw is deterministic
    expect(result.map(p => p.index)).toEqual([7, 8, 9, 0])
    expect(new Set(result).size).toBe(4)
  })

  it('only draws from the perks named in limitIds when 4 or more are given', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const pool = makePool()
    const result = rand.getRandomData(4, ['2', '3', '4', '5'], pool, [])
    expect(result.map(p => p.index).sort()).toEqual([2, 3, 4, 5])
  })

  it('falls back to the full pool when fewer than 4 limitIds are given', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const pool = makePool()
    const result = rand.getRandomData(4, ['2', '3'], pool, [])
    // indices 7/8/9/0 are outside the limit list, proving the fallback
    expect(result.map(p => p.index)).toEqual([7, 8, 9, 0])
  })

  it('throws a RangeError when more perks are requested than available', () => {
    const pool = makePool()
    expect(() => rand.getRandomData(5, ['1', '2', '3', '4'], pool, [])).toThrow(RangeError)
  })

  it('gives up after 100 retries instead of looping forever', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const pool = makePool()
    // last roll equals the only result the pinned RNG can produce,
    // so equalized() rejects every retry until the give-up cap
    const lastRoll = [pool[7], pool[8], pool[9], pool[0]]
    const result = rand.getRandomData(4, [], pool, lastRoll)
    expect(result.map(p => p.index)).toEqual([7, 8, 9, 0])
    expect(spy.mock.calls.length).toBe(400) // 100 tries x 4 draws
  })
})

describe('equalized', () => {
  // NOTE: these tests pin the historical behavior, quirks included —
  // the function returns the array itself (truthy) in pass-through cases
  // and callers only ever check truthiness

  it('passes any roll through when there is no previous roll', () => {
    const pool = makePool()
    const cur = [pool[1]]
    expect(rand.equalized(cur, [], 10)).toBe(cur)
  })

  it('rejects a roll that repeats a perk from the previous roll', () => {
    const pool = makePool()
    expect(rand.equalized([pool[4]], [pool[4]], 10)).toBe(false)
  })

  it('rejects perks closer than a third of the wheel to the previous roll', () => {
    const pool = makePool()
    // minDist = floor((10 - 1) / 3) = 3; distance 1 is too close
    expect(rand.equalized([pool[5]], [pool[4]], 10)).toBe(false)
  })

  it('accepts perks far enough from the previous roll', () => {
    const pool = makePool()
    expect(rand.equalized([pool[9]], [pool[1]], 10)).toBe(true)
  })
})
