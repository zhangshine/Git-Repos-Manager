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

// Function to load tokens from localStorage
function loadTokens() {
  try {
    const storedGithubToken = localStorage.getItem('githubToken');
    if (storedGithubToken) {
      githubToken.value = storedGithubToken;
    }
    // Load other tokens similarly
  } catch (e) {
    console.error('Error loading tokens from localStorage:', e);
    error.value = 'Could not load token configuration.';
  }
}

function loadGroups() {
  try {
    const storedGroups = localStorage.getItem('repositoryGroups');
    if (storedGroups) {
      const parsedGroups = JSON.parse(storedGroups);
      if (Array.isArray(parsedGroups)) {
        groups.value = parsedGroups;
      } else {
        groups.value = [];
        console.warn('Loaded "repositoryGroups" from localStorage, but it was not an array. Initializing to empty array. Value was:', parsedGroups);
      }
    } else {
      groups.value = []; // Initialize if nothing in storage
    }
  } catch (e) {
    console.error('Error loading groups from localStorage:', e);
    groups.value = []; // Also ensure groups is an array in case of an error during storage access or parsing
  }
}

function saveGroups() {
  try {
    localStorage.setItem('repositoryGroups', JSON.stringify(groups.value));
  } catch (e) {
    console.error('Error saving groups to localStorage:', e);
    // Optionally set an error state for groups
  }
}

// Modified to be synchronous as saveGroups is now sync
function addGroup(name: string) {
  if (!name.trim()) throw new Error('Group name cannot be empty.');
  const existingGroup = groups.value.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
  if (existingGroup) throw new Error(`Group '${name}' already exists.`);

  const newGroup: RepoGroup = {
    id: Date.now().toString(), // Simple unique ID
    name: name.trim(),
    repoIds: [],
  };
  groups.value.push(newGroup);
  saveGroups(); // Now synchronous
}

// Modified to be synchronous
function deleteGroup(groupId: string) {
  groups.value = groups.value.filter(g => g.id !== groupId);
  saveGroups(); // Now synchronous
}

// Modified to be synchronous
function addRepoToGroup(groupId: string, repoId: string | number) {
  const group = groups.value.find(g => g.id === groupId);
  if (group && !group.repoIds.includes(repoId)) {
    // Remove from other groups first to ensure a repo is in at most one group
    groups.value.forEach(g => {
        if (g.id !== groupId) {
            g.repoIds = g.repoIds.filter(id => id !== repoId);
        }
    });
    group.repoIds.push(repoId);
    saveGroups(); // Now synchronous
  }
}

// Modified to be synchronous
function removeRepoFromGroup(groupId: string, repoId: string | number) {
  const group = groups.value.find(g => g.id === groupId);
  if (group) {
    group.repoIds = group.repoIds.filter(id => id !== repoId);
    saveGroups(); // Now synchronous
  }
}

// Watch for changes in groups and save them.
// This provides a more robust way to persist group changes automatically.
// For now, explicit saveGroups() is used. If auto-save is preferred:
// watch(groups, saveGroups, { deep: true });

// Function to save GitHub token (now synchronous for localStorage)
function saveGithubToken(token: string) {
  if (!token.trim()) {
    throw new Error('Token cannot be empty.');
  }
  try {
    localStorage.setItem('githubToken', token);
    githubToken.value = token;
  } catch (e) {
    console.error('Error saving GitHub token to localStorage:', e);
    throw new Error('Failed to save token to local storage.'); // Re-throw or handle as appropriate
  }
}

// Function to clear GitHub token (now synchronous for localStorage)
function clearGithubToken() {
  try {
    localStorage.removeItem('githubToken');
    githubToken.value = null;
  } catch (e) {
    console.error('Error removing GitHub token from localStorage:', e);
    throw new Error('Failed to clear token from local storage.'); // Re-throw or handle
  }
}

// Function to fetch repositories (remains async as it deals with external APIs)
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
  function getRepoGroupId(repoId: string | number): string | null {
    for (const group of groups.value) {
      if (group.repoIds.includes(repoId)) {
        return group.id;
      }
    }
    return null;
  }

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
    getRepoGroupId, // Add this line
    // loadGroups, // No need to expose if auto-loaded
    // saveGroups, // Internal use mostly
  };
}

export type { Repository } from '../services/apiService';
