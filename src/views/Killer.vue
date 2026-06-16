<template>
    <div>
        <div id="perkSlotContainerInner">
            <perk-slot @reRollRequested="randomize"
                       ref="perkslot0"
                       :slotIndex="0"
                       type="Kill"
                       :elementLength="elementLength"
                       :colorized="color"
                       :lang="lang"
                       :perkData="killerPerkNames"
                       v-if="renderSlot"
            />
            <perk-slot @reRollRequested="randomize"
                       ref="perkslot1"
                       :slotIndex="1"
                       type="Kill"
                       :elementLength="elementLength"
                       :colorized="color"
                       :lang="lang"
                       :perkData="killerPerkNames"
                       v-if="renderSlot"
            />
            <perk-slot @reRollRequested="randomize"
                       ref="perkslot2"
                       :slotIndex="2"
                       type="Kill"
                       :elementLength="elementLength"
                       :colorized="color"
                       :lang="lang"
                       :perkData="killerPerkNames"
                       v-if="renderSlot"
            />
            <perk-slot @reRollRequested="randomize"
                       ref="perkslot3"
                       :slotIndex="3"
                       type="Kill"
                       :elementLength="elementLength"
                       :colorized="color"
                       :lang="lang"
                       :perkData="killerPerkNames"
                       v-if="renderSlot"
            />
        </div>
        <div v-if="hintVisible" class="hint-text">
            <img src="/img/icon_shortinfo.png" alt="Survivor" class="info-icon">
            <span v-html="$t('snippets.startPerkRoll')"></span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import PerkSlot from '../components/PerkSlot.vue'
import rand from '@/lib/randomize'
import vp from '@/lib/viewport'
import type { Perk } from '@/types'

type PerkSlotInstance = InstanceType<typeof PerkSlot>

export default defineComponent({
  name: 'Killer',
  components: {
    PerkSlot
  },
  props: {
    lang: {
      type: String,
      required: true
    },
    color: {
      type: Boolean,
      default: false,
      required: false
    },
    sids: {
      type: Array as PropType<string[]>,
      default: function () {
        return []
      },
      required: false
    },
    kids: {
      type: Array as PropType<string[]>,
      default: function () {
        return []
      },
      required: false
    },
    killerPerkNames: {
      type: Array as PropType<string[]>,
      required: true
    }
  },
  data: function () {
    const killersRaw = this.killerPerkNames
    const killers: Perk[] = []
    // make sure array keys match the ids in file name. TODO maybe make sure no key is reassigned because of naming issues
    for (let i = 0, kLen = killersRaw.length; i < kLen; i++) {
      const perkFileName = killersRaw[i]
      const key = Number(perkFileName.replace(/\D+$/g, ''))
      killers[key] = {
        index: key,
        name: perkFileName
      }
    }
    return {
      perkData: killers,
      hintVisible: true,
      lastRoll: [] as Perk[],
      initialElLen: null as number | null,
      renderSlot: true
    }
  },
  computed: {
    elementLength () {
      return this.initialElLen || vp.getElementLength()
    }
  },
  methods: {
    randomize: function (slotIndex?: number, ev?: PointerEvent) {
      // if shift is pressed, only randomize the perk that was clicked
      if (ev && ev.shiftKey && (this.kids.length > 4 || this.kids.length === 0)) {
        let randomSingle = rand.getRandomData(1, this.kids, this.perkData, this.lastRoll)
        let counter = 0
        // while the perk is in the last roll, get a new random perk, give up after 10 tries
        while (this.lastRoll.map((e, i) => e.name === randomSingle[0].name ? i : '').filter(String).length > 0) {
          if (counter > 10) return
          randomSingle = rand.getRandomData(1, this.kids, this.perkData, this.lastRoll)
          counter++
        }
        // update the lastroll with the new perk, using the slot index emitted by the component
        this.lastRoll[slotIndex as number] = randomSingle[0]
        // actually roll the slot to the new perk
        ;(this.$refs['perkslot' + slotIndex] as PerkSlotInstance).rollWheel(randomSingle[0], this.$t(`perks.killer.desc.${randomSingle[0].name}`))
        return
      }
      if (!this.lastRoll) this.lastRoll = [this.perkData[0], this.perkData[0], this.perkData[0], this.perkData[0]]
      const random = rand.getRandomData(4, this.kids, this.perkData, this.lastRoll)
      this.hintVisible = false

      this.lastRoll = random
      ;(this.$refs.perkslot0 as PerkSlotInstance).rollWheel(random[0], this.$t(`perks.killer.desc.${random[0].name}`))
      ;(this.$refs.perkslot1 as PerkSlotInstance).rollWheel(random[1], this.$t(`perks.killer.desc.${random[1].name}`))
      ;(this.$refs.perkslot2 as PerkSlotInstance).rollWheel(random[2], this.$t(`perks.killer.desc.${random[2].name}`))
      ;(this.$refs.perkslot3 as PerkSlotInstance).rollWheel(random[3], this.$t(`perks.killer.desc.${random[3].name}`))
    }
  },
  mounted: function () {
    // Hacky way to re-calculate width and re-render slots after page load
    // Neccessary because transparent scroll bars on mobile are included in innerWidth,
    // causing the perk slots to be rendered to big and not two side-by-side on mobile devices

    // Get the floating point value of the available render space
    const docWidth = (document.getElementById('perkSlotContainerInner') as HTMLElement).getBoundingClientRect().width

    // Check if all four slots fit side-by side
    if (vp.getElementLength() * 4 > docWidth && screen.availHeight > screen.availWidth) { // we are in portrait mode, create 2x2
      this.initialElLen = Math.floor(docWidth / 2)
      this.renderSlot = false
      this.$nextTick(() => {
        this.renderSlot = true
      })
    } else if (vp.getElementLength() * 4 > docWidth && screen.availHeight < screen.availWidth) { // we are in landscape, create 4x1
      this.initialElLen = Math.floor(docWidth / 4)
      this.renderSlot = false
      this.$nextTick(() => {
        this.renderSlot = true
      })
    }
    if (this.$route.query.streammode === '1') {
      const hints = document.getElementsByClassName('hint-text')
      if (hints.length > 0) {
        hints[0].setAttribute('style', 'display:none;')
      }
      const containers = document.getElementsByClassName('container')
      if (containers.length > 1) {
        containers[1].setAttribute('style', 'padding:0;max-width:none;')
      }
      const headers = document.getElementsByClassName('header')
      if (headers.length > 0) {
        headers[0].setAttribute('style', 'display:none;')
      }
      const corners = document.getElementsByClassName('github-corner')
      if (corners.length > 0) {
        corners[0].setAttribute('style', 'display:none;')
      }
    } else {
      document.getElementsByTagName('body')[0].removeAttribute('style')
    }
    const obs = this.$route.query.obs
    const as = parseInt(this.$route.query.autostart as string)
    if (!isNaN(as) && as > 0 && obs !== '1') {
      window.setTimeout(() => {
        this.randomize()
      }, as)
    }
    if (obs === '1' && window.obsstudio) {
      const delayedRand = (visible: boolean) => {
        if (!visible) return
        window.setTimeout(() => {
          this.randomize()
        }, !isNaN(as) && as > 0 ? as : 1000)
      }
      if (window.obsstudio.linuxbrowser || Number(window.obsstudio.pluginVersion.slice(0, 4)) > 1.29) {
        window.obsstudio.onActiveChange = delayedRand
      } else {
        window.obsstudio.onVisibilityChange = delayedRand
      }
    }
    window.addEventListener('orientationchange', function () {
      const o = window.orientation
      if (o === 90 || o === -90 || o === 0) {
        window.location.reload()
      }
    })
  }
})
</script>
