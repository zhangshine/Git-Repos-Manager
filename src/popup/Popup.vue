<template>
  <div class="container p-3 popup-container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">My Repositories</h4>
      <button class="btn btn-sm btn-info" @click="refreshRepos" :disabled="store.isLoading.value" title="Refresh Repositories">
        <span v-if="store.isLoading.value" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span v-else>&#x21bb;</span> <!-- Refresh symbol -->
      </button>
    </div>

    <!-- Loading and Error States -->
    <div v-if="store.isLoading.value && store.repositories.value.length === 0" class="text-center mt-4">
      <div class="spinner-border spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
      <p>Loading repositories...</p>
    </div>
    <div v-if="!store.isLoading.value && store.error.value" class="alert alert-danger">
      {{ store.error.value }}
      <p>Visit <a href="#" @click.prevent="openOptionsPage">options</a> to check configuration.</p>
    </div>

    <!-- Group Management -->
    <div class="mb-3">
      <div class="input-group input-group-sm mb-2">
        <input type="text" class="form-control" v-model="newGroupName" placeholder="New group name" @keyup.enter="handleCreateGroup">
        <button class="btn btn-outline-success" @click="handleCreateGroup" :disabled="!newGroupName.trim()">Add Group</button>
      </div>
      <p v-if="groupError" class="text-danger small">{{ groupError }}</p>
    </div>

    <!-- Display Repositories by Group -->
    <div v-if="!store.isLoading.value && !store.error.value && store.repositories.value.length > 0">
      <!-- Grouped Repositories -->
      <div v-for="(groupRepos, groupName) in store.repositoriesByGroup.value.grouped" :key="groupName" class="mb-3">
        <h5 class="d-flex justify-content-between align-items-center group-header">
          <span>{{ groupName }}</span>
          <button class="btn btn-xs btn-outline-danger" @click="confirmDeleteGroup(getGroupIdByName(groupName))">&times;</button>
        </h5>
        <ul class="list-group list-group-sm">
          <li v-for="repo in groupRepos" :key="repo.id" class="list-group-item d-flex justify-content-between align-items-center">
            <a :href="repo.url" target="_blank" :title="repo.description || repo.name" class="repo-link">
              {{ repo.owner }}/{{ repo.name }} ({{ repo.source }})
            </a>
            <div>
              <button class="btn btn-xs btn-outline-secondary" @click="assignToGroupPrompt(repo)">+/-</button>
            </div>
          </li>
          <li v-if="groupRepos.length === 0" class="list-group-item text-muted small">No repositories in this group.</li>
        </ul>
      </div>

      <!-- Ungrouped Repositories -->
      <div v-if="store.repositoriesByGroup.value.ungrouped.length > 0" class="mb-3">
        <h5 class="group-header">Ungrouped</h5>
        <ul class="list-group list-group-sm">
          <li v-for="repo in store.repositoriesByGroup.value.ungrouped" :key="repo.id" class="list-group-item d-flex justify-content-between align-items-center">
            <a :href="repo.url" target="_blank" :title="repo.description || repo.name" class="repo-link">
              {{ repo.owner }}/{{ repo.name }} ({{ repo.source }})
            </a>
            <div>
              <button class="btn btn-xs btn-outline-secondary" @click="assignToGroupPrompt(repo)">+/-</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="!store.isLoading.value && !store.error.value && store.repositories.value.length === 0 && store.isAuthenticated.value" class="text-center mt-4">
      <p>No repositories found. Try refreshing.</p>
    </div>
    <div v-if="!store.isAuthenticated.value && !store.isLoading.value" class="text-center mt-4">
        <p>Please <a href="#" @click.prevent="openOptionsPage">configure your API token(s)</a> to see repositories.</p>
    </div>

    <hr class="my-2">
    <button class="btn btn-sm btn-outline-secondary w-100" @click="openOptionsPage">
      Settings
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useStore } from '../store';
import type { Repository, RepoGroup } from '../store'; // Assuming RepoGroup is exported from store or defined locally

const store = useStore();
const newGroupName = ref('');
const groupError = ref<string | null>(null);

const openOptionsPage = () => chrome.runtime.openOptionsPage();
const refreshRepos = () => store.fetchRepositories();

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) return;
  groupError.value = null;
  try {
    await store.addGroup(newGroupName.value);
    newGroupName.value = '';
  } catch (e: any) {
    groupError.value = e.message;
  }
};

const getGroupIdByName = (name: string): string | undefined => {
    const group = store.groups.value.find(g => g.name === name);
    return group?.id;
};

const confirmDeleteGroup = async (groupId?: string) => {
  if (!groupId) return;
  const group = store.groups.value.find(g => g.id === groupId);
  if (group && confirm(`Are you sure you want to delete the group "${group.name}"? Repositories will become ungrouped.`)) {
    try {
      await store.deleteGroup(groupId);
    } catch (e: any) {
      groupError.value = `Error deleting group: ${e.message}`;
    }
  }
};

const assignToGroupPrompt = async (repo: Repository) => {
  // Find current group of repo
  let currentGroupId: string | null = null;
  for (const group of store.groups.value) {
      if (group.repoIds.includes(repo.id)) {
          currentGroupId = group.id;
          break;
      }
  }

  const groupOptions = store.groups.value.map(g => `"${g.name}" (ID: ${g.id.substring(0,4)})`).join(', ') || 'No groups available.';
  const newGroupIdOrName = prompt(
    `Assign "${repo.name}" to group:\nAvailable groups: ${groupOptions}\nEnter group name or ID. Leave empty to ungroup.`,
    currentGroupId ? store.groups.value.find(g=>g.id === currentGroupId)?.name || '' : ''
  );

  if (newGroupIdOrName === null) return; // User cancelled

  try {
    // First, remove from current group if any
    if (currentGroupId) {
        await store.removeRepoFromGroup(currentGroupId, repo.id);
    }

    // If a new group name/id is provided, add to it
    if (newGroupIdOrName.trim() !== '') {
        let targetGroup = store.groups.value.find(g => g.id === newGroupIdOrName.trim() || g.name.toLowerCase() === newGroupIdOrName.trim().toLowerCase());
        if (targetGroup) {
            await store.addRepoToGroup(targetGroup.id, repo.id);
        } else {
            groupError.value = `Group "${newGroupIdOrName}" not found.`;
        }
    }
  } catch (e: any) {
    groupError.value = `Error assigning repository: ${e.message}`;
  }
};

onMounted(async () => {
  // Store now auto-loads tokens and groups.
  // Fetch repositories if authenticated.
  if (store.isAuthenticated.value) {
    if (store.repositories.value.length === 0) { // Fetch only if not already populated
        await store.fetchRepositories();
    }
  }
});
</script>

<style scoped>
.popup-container {
  width: 400px; /* Increased width */
  min-height: 300px;
  max-height: 500px; /* Max height before scroll */
  overflow-y: auto;
}
.w-100 { width: 100%; }
.my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
.repo-link {
  text-decoration: none;
  color: inherit;
  flex-grow: 1;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.repo-link:hover { text-decoration: underline; }
.btn-xs { /* For smaller buttons */
  padding: .1rem .25rem;
  font-size: .75rem;
  line-height: 1.5;
}
.group-header {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.3rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #eee;
}
.list-group-sm .list-group-item {
    padding: .3rem .5rem; /* Smaller list items */
    font-size: 0.85rem;
}
</style>
