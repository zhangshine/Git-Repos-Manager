// src/options/main.ts
import { createApp } from 'vue';
import Options from './Options.vue';
import vuetify from '../main'; // Import the Vuetify instance
import 'vuetify/styles'; // Import Vuetify styles
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons
import 'material-design-icons-iconfont/dist/material-design-icons.css'; // Import Material Design Icons

createApp(Options).use(vuetify).mount('#app-options');
