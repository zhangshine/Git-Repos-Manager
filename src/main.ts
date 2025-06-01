import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Import the router
import './styles/main.css';

// Vuetify will be integrated in a later step, preparing its place
import vuetify from './plugins/vuetify';

const app = createApp(App);

app.use(router); // Use the router

app.use(vuetify); // Vuetify will be enabled after its setup

app.mount('#app');

// Service worker registration code
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
