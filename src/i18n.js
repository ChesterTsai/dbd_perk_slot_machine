import { createI18n } from 'vue-i18n'

function loadLocaleMessages () {
  const locales = import.meta.glob('./locales/*.json', { eager: true })
  const messages = {}
  for (const path in locales) {
    const matched = path.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      messages[matched[1]] = locales[path].default
    }
  }
  return messages
}

export default createI18n({
  // legacy mode keeps the Options API surface (this.$t, this.$i18n.locale)
  legacy: true,
  locale: 'en',
  fallbackLocale: 'en',
  // vue-i18n 8 didn't warn about HTML in messages; the hint text uses <br>
  warnHtmlMessage: false,
  messages: loadLocaleMessages()
})
