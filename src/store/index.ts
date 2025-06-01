import { ref, computed, readonly, watch } from 'vue'; // Added watch
import type { Repository } from '../services/apiService';
import { GithubService } from '../services/githubService';
import { GitlabService } from '../services/gitlabService'; // For future use
import { BitbucketService } from '../services/bitbucketService'; // For future use
import { ApiError } from '../services/apiService';

// --- State ---
const githubToken = ref<string | null>(null);
// Add refs for GitLab and Bitbucket tokens later
// const gitlabToken = ref<string | null>(null);
// const bitbucketToken = ref<string | null>(null);

const repositories = ref<Repository[]>([]);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

export interface RepoGroup {
  id: string; // e.g., timestamp or UUID
  name: string;
  repoIds: (string | number)[]; // Store repository IDs
}
const groups = ref<RepoGroup[]>([]);

// --- Getters (Computed properties) ---
const isAuthenticated = computed(() => !!githubToken.value); // Expand for other services

const repositoriesByGroup = computed(() => {
  const grouped: { [key: string]: Repository[] } = {};
  const ungrouped: Repository[] = [];
  const allRepoIdsInGroups = new Set<string|number>();

  groups.value.forEach(group => {
    grouped[group.name] = [];
    group.repoIds.forEach(repoId => {
      allRepoIdsInGroups.add(repoId);
      const repo = repositories.value.find(r => r.id === repoId);
      if (repo) {
        grouped[group.name].push(repo);
      }
    });
  });

  repositories.value.forEach(repo => {
    if (!allRepoIdsInGroups.has(repo.id)) {
      ungrouped.push(repo);
    }
  });

  return { grouped, ungrouped };
});


// --- Actions (Functions to modify state) ---

// Function to load tokens from chrome.storage.local
async function loadTokens() {
  try {
    const result = await chrome.storage.local.get(['githubToken' /*, 'gitlabToken', 'bitbucketToken' */]);
    if (result.githubToken) {
      githubToken.value = result.githubToken;
    }
    // Load other tokens similarly
  } catch (e) {
    console.error('Error loading tokens from storage:', e);
    error.value = 'Could not load token configuration.';
  }
}


async function loadGroups() {
  try {
    const result = await chrome.storage.local.get(['repositoryGroups']);
    if (result.repositoryGroups) {
      groups.value = result.repositoryGroups;
    }
  } catch (e) {
    console.error('Error loading groups from storage:', e);
    // Optionally set an error state for groups
  }
}

async function saveGroups() {
  try {
    await chrome.storage.local.set({ repositoryGroups: groups.value });
  } catch (e) {
    console.error('Error saving groups to storage:', e);
    // Optionally set an error state for groups
  }
}

async function addGroup(name: string) {
  if (!name.trim()) throw new Error('Group name cannot be empty.');
  const existingGroup = groups.value.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
  if (existingGroup) throw new Error(`Group '${name}' already exists.`);

  const newGroup: RepoGroup = {
    id: Date.now().toString(), // Simple unique ID
    name: name.trim(),
    repoIds: [],
  };
  groups.value.push(newGroup);
  await saveGroups();
}

async function deleteGroup(groupId: string) {
  groups.value = groups.value.filter(g => g.id !== groupId);
  await saveGroups();
}

async function addRepoToGroup(groupId: string, repoId: string | number) {
  const group = groups.value.find(g => g.id === groupId);
  if (group && !group.repoIds.includes(repoId)) {
    // Remove from other groups first to ensure a repo is in at most one group
    groups.value.forEach(g => {
        if (g.id !== groupId) {
            g.repoIds = g.repoIds.filter(id => id !== repoId);
        }
    });
    group.repoIds.push(repoId);
    await saveGroups();
  }
}

async function removeRepoFromGroup(groupId: string, repoId: string | number) {
  const group = groups.value.find(g => g.id === groupId);
  if (group) {
    group.repoIds = group.repoIds.filter(id => id !== repoId);
    await saveGroups();
  }
}

// Watch for changes in groups and save them.
// This provides a more robust way to persist group changes automatically.
// However, explicit saveGroups() after mutations is also fine and might be clearer.
// For now, explicit saveGroups() is used. If auto-save is preferred:
// watch(groups, saveGroups, { deep: true });

// Function to save GitHub token
async function saveGithubToken(token: string) {
  if (!token.trim()) {
    throw new Error('Token cannot be empty.');
  }
  await chrome.storage.local.set({ githubToken: token });
  githubToken.value = token;
}

// Function to clear GitHub token
async function clearGithubToken() {
  await chrome.storage.local.remove('githubToken');
  githubToken.value = null;
}

// Function to fetch repositories
// For now, focuses on GitHub. Will be expanded for other services.
async function fetchRepositories() {
  if (!githubToken.value) {
    error.value = 'GitHub token is not set. Please configure it in options.';
    repositories.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    const githubService = new GithubService();
    const githubRepos = await githubService.getRepositories(githubToken.value);
    // In future, fetch from GitLab and Bitbucket and combine
    repositories.value = [...githubRepos];
  } catch (e: any) {
    console.error('Failed to fetch repositories:', e);
    if (e instanceof ApiError) {
      error.value = `API Error: ${e.message}`;
    } else {
      error.value = 'An unexpected error occurred while fetching repositories.';
    }
    repositories.value = []; // Clear on error
  } finally {
    isLoading.value = false;
  }
}

// Initialize by loading tokens when the store module is first imported.
// This makes tokens available as soon as the app (popup/options) starts.
loadTokens(); // already called
loadGroups(); // Load groups when store initializes

// --- Export Store Functionality ---
// It's common to export refs directly or wrapped in a function/object.
// Using readonly for state that shouldn't be mutated directly from components.
export function useStore() {
  return {
    // State
    githubToken: readonly(githubToken),
    repositories: readonly(repositories),
    isLoading: readonly(isLoading),
    error: readonly(error),
    groups: readonly(groups), // Expose groups

    // Getters
    isAuthenticated,
    repositoriesByGroup, // Expose new getter

    // Actions
    loadTokens,
    saveGithubToken,
    clearGithubToken,
    fetchRepositories,
    addGroup, // Expose group actions
    deleteGroup,
    addRepoToGroup,
    removeRepoFromGroup,
    // loadGroups, // No need to expose if auto-loaded
    // saveGroups, // Internal use mostly
  };
}

export type { Repository } from '../services/apiService';
