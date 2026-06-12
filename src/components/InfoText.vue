<template>
    <div class="info-text">
        <div class="paragraph">
            <h2>{{ $t("about.header") }}</h2>
            <i18n-t tag="p" keypath="about.description">
                <template #url>
                    <a href="https://deadbydaylight.com/">Dead by Daylight</a>
                </template>
            </i18n-t>
        </div>
        <div class="paragraph yt">
            <iframe class="video" :src="$t('about.videoUrl')"
                    frameborder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>
        </div>
        <div class="paragraph">
            <h2>{{ $t("howItWorks.header") }}</h2>
            <p>{{ $t("howItWorks.description") }}</p>
            <h3>{{ $t("howItWorks.missingPerks.header") }}</h3>
            <p>{{ $t("howItWorks.missingPerks.description") }}</p>
        </div>
        <div class="paragraph">
            <h2>{{ $t("streaming.header") }}</h2>
            <p>{{ $t("streaming.description") }}</p>
            <i18n-t tag="p" keypath="streaming.options.description">
                <template #transparent>
                    <code>{{ $t("streaming.options.transparent") }}</code>
                </template>
                <template #autostart>
                    <code>{{ $t("streaming.options.autostart") }}</code>
                </template>
            </i18n-t>
        </div>
        <div class="paragraph">
            <h2>{{ $t("attribution.coloredicons.header") }}</h2>
            <i18n-t tag="p" keypath="attribution.coloredicons.description">
                    <template #profile>
                        <a href="https://steamcommunity.com/id/EvaZioN67/">EvaZioN</a>
                    </template>
                    <template #group>
                        <a href="https://steamcommunity.com/groups/Nebula_Perks">{{ $t("attribution.coloredicons.groupText") }}</a>
                    </template>
                </i18n-t>
        </div>
        <div class="paragraph">
            <h2>{{ $t("team.header") }}</h2>
            <p>{{ $t("team.description") }}</p>
            <ul>
                <li>
                    3stadt
                    [
                    <a href="https://steamcommunity.com/id/dreistadt">Steam</a> |
                    ]
                </li>
                <li>
                    moe_nana
                    [
                    <a href="https://steamcommunity.com/id/moe_nana">Steam</a> |
                    <a href="https://twitter.com/leichteckig">Twitter</a>
                    ]
                </li>
                <li>
                    Tobbe [<a href="https://github.com/tobiasberge">GitHub</a>]
                </li>
            </ul>
        </div>
        <div class="paragraph">
            <h2>{{ $t("attribution.header") }}</h2>
            <p>{{ $t("attribution.description") }}</p>
            <ul>
                <i18n-t tag="li" keypath="attribution.wiki.description">
                    <template #wikiUrl>
                        <a :href="$t('attribution.wiki.wikiUrl')">{{ $t('attribution.wiki.wikiUrlText') }}</a>
                    </template>
                    <template #licenseUrl>
                        <a :href="$t('attribution.wiki.licenseUrl')">{{ $t('attribution.wiki.licenseUrl') }}</a>
                    </template>
                </i18n-t>
                <!-- <i18n tag="li" path="attribution.rocketleaguecat.description">
                    <a href="https://imgur.com/gallery/8i5gR" place="bgImage">{{ $t("attribution.rocketleaguecat.bgImageText") }}</a>
                    <a place="profile" href="https://imgur.com/user/rocketleaguecat">rocketleaguecat</a>
                </i18n> -->
                <i18n-t tag="li" keypath="attribution.bhvr.description">
                    <template #bhvr>
                        <a href="https://www.bhvr.com/">BHVR</a>
                    </template>
                    <template #dbd>
                        <a href="https://deadbydaylight.com">Dead by Daylight</a>
                    </template>
                </i18n-t>
                <i18n-t tag="li" keypath="attribution.freepik.description">
                    <template #freepik>
                        <a href="https://www.freepik.com/" title="Freepik">Freepik</a>
                    </template>
                    <template #flaticon>
                        <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>
                    </template>
                    <template #licenseUrl>
                        <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>
                    </template>
                </i18n-t>
                <i18n-t tag="li" keypath="attribution.translation.description" v-if="$t('attribution.translation.description') !== 'attribution.translation.description'">
                  <template #profile>
                      <a :href="$t('attribution.translation.profileUrl')" :title="$t('attribution.translation.translator')">{{ $t("attribution.translation.translator") }}</a>
                  </template>
                </i18n-t>
            </ul>
        </div>
        <div class="paragraph">
            <h2>{{ $t("disclaimer.header") }}</h2>
            <i18n-t tag="p" keypath="disclaimer.description">
                <template #email>
                    <span class="e-mail" data-user="mspd" data-website="moc.tdats3"></span>
                </template>
                <template #statcounter>
                    <a href="https://statcounter.com/">statcounter</a>
                </template>
            </i18n-t>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InfoText',

  props: {
    value: {
      type: String,
      required: false,
      default: undefined
    }
  }
})
</script>

<style lang="scss" scoped>
    .e-mail:before {
        content: attr(data-website) "\0040" attr(data-user);
        unicode-bidi: bidi-override;
        direction: rtl;
    }
</style>

<style lang="scss">
    @import "../design/main";
    @import "../design/typography";

    .paragraph {
        padding: 10px;

        a {
            color: $color-primary;
            text-decoration: none;
        }

        h3 {
            margin-top: 10px
        }

        a:hover {
            text-decoration: underline;
        }

        a:active {
            color: black;
        }

        a:visited {
            color: darkgrey;
        }

        &.yt {
            iframe {
                display: block;
                margin: 0 auto;
            }
        }
    }

    li {
        margin-left: 20px;
    }

    .video {
        width: 560px;
        height: 315px;

        @media screen and (max-width: 650px) {
            width: 100%;
            height: 100%;
        }
    }

</style>
