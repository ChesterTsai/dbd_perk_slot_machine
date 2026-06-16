import type { Perk } from '../types'

export default {
  getRandomData (nOrg: number, limitIds: string[] | undefined, perkData: Perk[], lastRoll: Perk[], recursion?: number): Perk[] {
    let avPerks: number[] = []
    let avPerkData: Perk[] = []
    let n = nOrg
    if (!recursion) recursion = 0
    if (limitIds) {
      avPerks = limitIds.map(function (item) {
        return parseInt(item, 10)
      })
    }
    const avLen = avPerks.length
    if (avLen >= 4) {
      for (let i = 0, pLen = perkData.length; i < pLen; i++) {
        if (perkData[i].index === i && avPerks.indexOf(i) >= 0) avPerkData.push(perkData[i])
        if (avPerkData.length === avLen) break
      }
    }

    avPerkData = avPerkData.length >= 4 ? avPerkData : perkData

    const result = new Array<Perk>(n)
    let len = avPerkData.length
    const taken = new Array<number>(len)
    // https://stackoverflow.com/a/19270021
    if (n > len) {
      throw new RangeError('getRandom: more elements taken than available')
    }

    while (n--) {
      const x = Math.floor(Math.random() * len)
      result[n] = avPerkData[x in taken ? taken[x] : x]
      taken[x] = --len in taken ? taken[len] : len
    }

    // make sure the new perks are at least 1/3 away from last roll for aesthetic reasons
    if (!this.equalized(result, lastRoll, perkData.length)) {
      recursion++
      if (recursion >= 100) return result // give up after 100 tries. Luck is not on your side today
      return this.getRandomData(nOrg, limitIds, perkData, lastRoll, recursion)
    }
    return result
  },
  equalized (curRoll: Perk[], prevRoll: Perk[], maxLen: number): Perk[] | boolean {
    // NOTE: `curRoll >= maxLen / 3` compares an array to a number; that is a
    // pre-TS quirk kept as-is because callers only check truthiness
    if (prevRoll.length === 0 || curRoll.length === 0 || (curRoll as unknown as number) >= maxLen / 3) return curRoll
    const minDist = Math.floor((maxLen - 1) / 3)
    for (let i = 0; i < curRoll.length; i++) {
      if (curRoll.includes(prevRoll[i]) || Math.abs(curRoll[i].index - prevRoll[i].index) < minDist) {
        return false
      }
    }
    return true
  }
}
