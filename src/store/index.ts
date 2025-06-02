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
const searchQuery = ref<string>(''); // Added for search

export interface RepoGroup {
  id: string; // e.g., timestamp or UUID
  name: string;
  repoIds: (string | number)[]; // Store repository IDs
}
const groups = ref<RepoGroup[]>([]);

// --- Getters (Computed properties) ---
const isAuthenticated = computed(() => !!githubToken.value); // Expand for other services

const repositoriesByGroup = computed(() => {
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  const allRepoIdsInGroups = new Set<string|number>();

  groups.value.forEach(group => {
    group.repoIds.forEach(repoId => {
      allRepoIdsInGroups.add(repoId);
    });
  });

  if (!lowerCaseQuery) {
    // Original logic when no search query
    const grouped: { [key: string]: Repository[] } = {};
    const ungrouped: Repository[] = [];
    // const allRepoIdsInGroups = new Set<string|number>(); // This line is removed

    groups.value.forEach(group => {
      grouped[group.name] = [];
      group.repoIds.forEach(repoId => {
        // allRepoIdsInGroups.add(repoId); // This line is removed
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
  }

  // Logic with search query
  // const filteredGrouped: { [key: string]: Repository[] } = {}; // This logic block is replaced by "Refined approach"
  // const filteredUngrouped: Repository[] = [];
  // const addedRepoIds = new Set<string|number>();

  // Filter groups and their repositories
  // groups.value.forEach(group => { // This logic block is replaced by "Refined approach"

  // This entire block related to filteredGrouped, filteredUngrouped, addedRepoIds,
  // and the first pass of groups.value.forEach is part of the older search logic
  // that was already superseded by the "Refined approach" block below.
  // The key is that allRepoIdsInGroups is now populated *before* this `if/else`.

  // The "Refined approach" below should correctly use the pre-populated allRepoIdsInGroups.
  // We are mainly concerned with moving the allRepoIdsInGroups population.
  // The search logic itself (refined approach) should remain as is, but will now benefit
  // from the globally populated allRepoIdsInGroups.

  // The original tool description asked to ensure existing logic functions correctly.
  // The `if (!lowerCaseQuery)` block is modified above.
  // The `else` block (search query) already has its own refined logic.
  // We need to ensure that the `allRepoIdsInGroups` used in the "Refined approach"
  // is the one we populated at the top of the computed property.

  // Let's ensure the "Refined approach" part correctly picks up the new allRepoIdsInGroups.
  // The line `const isOriginallyUngrouped = !groups.value.some(g => g.repoIds.includes(repo.id));`
  // in the refined approach is actually more accurate for determining "originally ungrouped"
  // than relying on an `allRepoIdsInGroups` populated only during the no-search case.
  // However, the subtask is specifically to populate `allRepoIdsInGroups` for all repos in groups,
  // irrespective of search. This set *is* used in the `if (!lowerCaseQuery)` block.
  // And it is also used in one place in the original search logic before the "Refined approach":
  // `repositories.value.forEach(repo => { if (!allRepoIdsInGroups.has(repo.id)) { ... } });`
  // This specific line *will* be affected by the change and use the new `allRepoIdsInGroups`.

  // Refined approach:
  const finalFilteredGrouped: { [key: string]: Repository[] } = {};
  const finalFilteredUngrouped: Repository[] = [];
  const processedRepoIds = new Set<string|number>(); // Tracks repos included in any part of the result

  // Process groups first
  groups.value.forEach(group => {
    const groupNameMatch = group.name.toLowerCase().includes(lowerCaseQuery);
    let reposToAddForThisGroup: Repository[] = [];

    group.repoIds.forEach(repoId => {
      const repo = repositories.value.find(r => r.id === repoId);
      if (repo) {
        const repoMatch =
          repo.name.toLowerCase().includes(lowerCaseQuery) ||
          repo.owner.toLowerCase().includes(lowerCaseQuery) ||
          (repo.source && repo.source.toLowerCase().includes(lowerCaseQuery));

        if (groupNameMatch || repoMatch) { // If group name matches, or repo itself matches
          if (!processedRepoIds.has(repo.id)) {
             reposToAddForThisGroup.push(repo);
             processedRepoIds.add(repo.id);
          }
        }
      }
    });
    if (reposToAddForThisGroup.length > 0) {
      finalFilteredGrouped[group.name] = reposToAddForThisGroup;
    }
  });

  // Process all repositories to find matches that are not yet included or are ungrouped
  repositories.value.forEach(repo => {
    if (!processedRepoIds.has(repo.id)) { // If not already added via a group
      const isOriginallyUngrouped = !groups.value.some(g => g.repoIds.includes(repo.id));
      const repoMatch =
        repo.name.toLowerCase().includes(lowerCaseQuery) ||
        repo.owner.toLowerCase().includes(lowerCaseQuery) ||
        (repo.source && repo.source.toLowerCase().includes(lowerCaseQuery));

      if (repoMatch) { // If the repo itself matches
         // If it was originally ungrouped, or if its original group didn't match by name (and thus wasn't created)
         // This logic ensures it appears in ungrouped if its group isn't in finalFilteredGrouped
         const originalGroup = groups.value.find(g => g.repoIds.includes(repo.id));
         if (!originalGroup || !finalFilteredGrouped[originalGroup.name]) {
            finalFilteredUngrouped.push(repo);
            processedRepoIds.add(repo.id); // Mark as processed
         }
      }
    }
  });

  return { grouped: finalFilteredGrouped, ungrouped: finalFilteredUngrouped };
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

// Action to set the search query
function setSearchQuery(query: string) {
  searchQuery.value = query.trim();
}

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
    searchQuery: readonly(searchQuery), // Expose search query

    // Getters
    isAuthenticated,
    repositoriesByGroup, // Expose new getter

    // Actions
    loadTokens,
    setSearchQuery, // Expose setSearchQuery
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
