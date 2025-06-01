// src/plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // Ensure MDI icons are imported

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // Ensure this is set for MDI icons
  },
})

export default vuetify
