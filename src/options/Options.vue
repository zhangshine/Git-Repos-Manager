<template>
  <div class="container p-4" style="width: 500px;">
    <h2>Repo Groupie Options</h2>
    <hr />

    <div class="mb-3">
      <label for="githubTokenInput" class="form-label">GitHub Personal Access Token</label>
      <input
        type="password"
        class="form-control"
        id="githubTokenInput"
        v-model="localGithubToken"
        placeholder="Enter your GitHub PAT"
      />
      <div class="form-text">
        Ensure your token has the 'repo' scope to read repository data.
      </div>
    </div>

    <button class="btn btn-primary mr-2" @click="handleSaveToken">Save Token</button>
    <button class="btn btn-secondary" @click="handleClearToken" v-if="store.githubToken.value">Clear Token</button>
    <p v-if="statusMessage" class="mt-2" :class="{'text-success': !isError, 'text-danger': isError}">{{ statusMessage }}</p>

    <hr class="mt-4 mb-3" />
    <h5>Connected Accounts (Status from Store)</h5>
    <p>GitHub: {{ store.githubToken.value ? 'Token stored' : 'Not configured' }}</p>
    <p>GitLab: Not configured</p>
    <p>Bitbucket: Not configured</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from '../store'; // Adjusted path

const store = useStore();
const localGithubToken = ref(''); // Local ref for the input field
const statusMessage = ref('');
const isError = ref(false);

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
.container {
  max-width: 600px;
}
.mr-2 {
  margin-right: 0.5rem;
}
</style>
