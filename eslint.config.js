import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['dist/**', 'node_modules/**', 'public/**']
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    rules: {
      // the view components keep their historical single-word names (Killer,
      // Survivor, Home) because they mirror the public URLs
      'vue/multi-word-component-names': 'off'
    }
  }
)
