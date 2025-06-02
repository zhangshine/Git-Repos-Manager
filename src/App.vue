<template>
  <v-app>
    <v-app-bar app dense color="primary" dark>
      <v-toolbar-title>Repo Manager</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/">Home</v-btn>
      <v-btn text to="/options">Settings</v-btn>
    </v-app-bar>
    <v-main>
      <div id="app-container">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// No specific script needed for just router-view
</script>

<style>
/* Styles for #app-container can be kept or adjusted */
#app-container {
  padding: 10px;
}
</style>
