<template>
  <v-container style="max-width: 500px;">
    <h2 class="pb-2">Repo Groupie Options</h2>
    <v-divider></v-divider>

    <v-text-field
      v-model="localGithubToken"
      label="GitHub Personal Access Token"
      type="password"
      placeholder="Enter your GitHub PAT"
      hint="Ensure your token has the 'repo' scope to read repository data."
      persistent-hint
      class="mt-4 mb-2"
    ></v-text-field>

    <v-btn color="primary" @click="handleSaveToken" class="mr-2">Save Token</v-btn>
    <v-btn @click="handleClearToken" v-if="store.githubToken.value">Clear Token</v-btn>

    <v-alert v-if="statusMessage" :type="isError ? 'error' : 'success'" density="compact" class="mt-3">{{ statusMessage }}</v-alert>

    <v-divider class="mt-4 mb-3"></v-divider>
    <h5>Connected Accounts</h5>
    <v-table class="mt-4">
      <thead>
        <tr>
          <th class="text-left">Platform</th>
          <th class="text-left">Status</th>
          <th class="text-left">Token Display</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in accounts" :key="account.platform">
          <td>{{ account.platform }}</td>
          <td>{{ account.status }}</td>
          <td>
            <span v-if="account.tokenExists" style="color: green;">********</span>
            <span v-else>N/A</span>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from '../store'; // Adjusted path

const store = useStore();
const localGithubToken = ref(''); // Local ref for the input field
const statusMessage = ref('');
const isError = ref(false);

const accounts = ref([
  {
    platform: 'GitHub',
    get status() { return store.githubToken.value ? 'Token stored' : 'Not configured'; },
    get tokenExists() { return !!store.githubToken.value; }
  },
  { platform: 'GitLab', status: 'Not configured', tokenExists: false },
  { platform: 'Bitbucket', status: 'Not configured', tokenExists: false }
]);

onMounted(() => {
  // Initialize localGithubToken from store if token exists,
  // but typically users would type it in.
  // If store.githubToken has a value, it means it was loaded from chrome.storage.
  // We don't want to display the actual token in the input field for security if it's already saved.
  // So, localGithubToken is primarily for new input.
});

// Watch for changes in the store's token (e.g., if cleared/loaded elsewhere)
// and update UI accordingly (though direct input is primary here)
watch(store.githubToken, (newToken) => {
  // if (!newToken) localGithubToken.value = ''; // Optionally clear input if token is removed globally
});

const handleSaveToken = async () => {
  if (!localGithubToken.value.trim()) {
    statusMessage.value = 'Token cannot be empty.';
    isError.value = true;
    return;
  }
  try {
    await store.saveGithubToken(localGithubToken.value);
    statusMessage.value = 'GitHub token saved successfully!';
    isError.value = false;
    localGithubToken.value = ''; // Clear input after saving
  } catch (e: any) {
    console.error('Error saving token:', e);
    statusMessage.value = `Error saving token: ${e.message || 'Unknown error'}`;
    isError.value = true;
  }
};

const handleClearToken = async () => {
  try {
    await store.clearGithubToken();
    localGithubToken.value = ''; // Clear input field as well
    statusMessage.value = 'GitHub token cleared.';
    isError.value = false;
  } catch (e: any) {
    console.error('Error clearing token:', e);
    statusMessage.value = `Error clearing token: ${e.message || 'Unknown error'}`;
    isError.value = true;
  }
};
</script>

<style scoped>
/* Specific styles can remain if needed, but Vuetify handles most common cases. */
/* For example, if .container had very specific padding/margin not covered by v-container default */
</style>
