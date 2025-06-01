// src/popup/main.ts
import { createApp } from 'vue';
import Popup from './Popup.vue';
import vuetify from '../main'; // Import the Vuetify instance
import 'vuetify/styles'; // Import Vuetify styles
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons
import 'material-design-icons-iconfont/dist/material-design-icons.css'; // Import Material Design Icons

createApp(Popup).use(vuetify).mount('#app-popup');
