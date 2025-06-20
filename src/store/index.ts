import { ref, computed, readonly, watch } from 'vue'; // Added watch
import type { Repository } from '../services/apiService';
import { GithubService } from '../services/githubService';
import { GitlabService } from '../services/gitlabService'; // For future use
import { BitbucketService } from '../services/bitbucketService'; // For future use
import { ApiError } from '../services/apiService';

// --- Cache Constants ---
const REPOSITORIES_CACHE_KEY = 'cachedRepositories';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const CACHE_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// --- Interval Management ---
let periodicRefreshIntervalId: number | null = null;

export interface PlatformToken {
  id: string; // Unique ID for the token (e.g., timestamp or UUID)
  platform: 'GitHub' | 'GitLab' | 'Bitbucket';
  token: string;
  name?: string; // Optional user-friendly name
}

export interface StoreState {
  tokens: PlatformToken[];
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  groups: RepoGroup[];
}

// --- State ---
const state = ref<StoreState>({
  tokens: [],
  repositories: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  groups: [],
});
// Add refs for GitLab and Bitbucket tokens later
// const gitlabToken = ref<string | null>(null);
// const bitbucketToken = ref<string | null>(null);

export interface RepoGroup {
  id: string; // e.g., timestamp or UUID
  name: string;
  repoIds: (string | number)[]; // Store repository IDs
}

// --- Getters (Computed properties) ---
const isAuthenticated = computed(() => state.value.tokens.length > 0);

const repositoriesByGroup = computed(() => {
  const lowerCaseQuery = state.value.searchQuery.toLowerCase();
  const allRepoIdsInGroups = new Set<string|number>();

  state.value.groups.forEach(group => {
    group.repoIds.forEach(repoId => {
      allRepoIdsInGroups.add(repoId);
    });
  });

  if (!lowerCaseQuery) {
    // Original logic when no search query
    const grouped: { [key: string]: Repository[] } = {};
    const ungrouped: Repository[] = [];
    // const allRepoIdsInGroups = new Set<string|number>(); // This line is removed

    state.value.groups.forEach(group => {
      grouped[group.name] = [];
      group.repoIds.forEach(repoId => {
        // allRepoIdsInGroups.add(repoId); // This line is removed
        const repo = state.value.repositories.find(r => r.id === repoId);
        if (repo) {
          grouped[group.name].push(repo);
        }
      });
    });

    state.value.repositories.forEach(repo => {
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
  // state.value.groups.forEach(group => { // This logic block is replaced by "Refined approach"

  // This entire block related to filteredGrouped, filteredUngrouped, addedRepoIds,
  // and the first pass of state.value.groups.forEach is part of the older search logic
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
  // The line `const isOriginallyUngrouped = !state.value.groups.some(g => g.repoIds.includes(repo.id));`
  // in the refined approach is actually more accurate for determining "originally ungrouped"
  // than relying on an `allRepoIdsInGroups` populated only during the no-search case.
  // However, the subtask is specifically to populate `allRepoIdsInGroups` for all repos in groups,
  // irrespective of search. This set *is* used in the `if (!lowerCaseQuery)` block.
  // And it is also used in one place in the original search logic before the "Refined approach":
  // `state.value.repositories.forEach(repo => { if (!allRepoIdsInGroups.has(repo.id)) { ... } });`
  // This specific line *will* be affected by the change and use the new `allRepoIdsInGroups`.

  // Refined approach:
  const finalFilteredGrouped: { [key: string]: Repository[] } = {};
  const finalFilteredUngrouped: Repository[] = [];
  const processedRepoIds = new Set<string|number>(); // Tracks repos included in any part of the result

  // Process groups first
  state.value.groups.forEach(group => {
    const groupNameMatch = group.name.toLowerCase().includes(lowerCaseQuery);
    let reposToAddForThisGroup: Repository[] = [];

    group.repoIds.forEach(repoId => {
      const repo = state.value.repositories.find(r => r.id === repoId);
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
  state.value.repositories.forEach(repo => {
    if (!processedRepoIds.has(repo.id)) { // If not already added via a group
      const isOriginallyUngrouped = !state.value.groups.some(g => g.repoIds.includes(repo.id));
      const repoMatch =
        repo.name.toLowerCase().includes(lowerCaseQuery) ||
        repo.owner.toLowerCase().includes(lowerCaseQuery) ||
        (repo.source && repo.source.toLowerCase().includes(lowerCaseQuery));

      if (repoMatch) { // If the repo itself matches
         // If it was originally ungrouped, or if its original group didn't match by name (and thus wasn't created)
         // This logic ensures it appears in ungrouped if its group isn't in finalFilteredGrouped
         const originalGroup = state.value.groups.find(g => g.repoIds.includes(repo.id));
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
    const storedTokens = localStorage.getItem('platformTokens');
    if (storedTokens) {
      const parsedTokens = JSON.parse(storedTokens) as PlatformToken[];
      if (Array.isArray(parsedTokens)) {
        // Basic validation for each token (can be more thorough)
        state.value.tokens = parsedTokens.filter(
          t => t.id && t.platform && t.token
        );
      } else {
        state.value.tokens = [];
        console.warn('Loaded "platformTokens" from localStorage, but it was not an array. Initializing to empty array.');
      }
    } else {
      state.value.tokens = [];
    }
  } catch (e) {
    console.error('Error loading tokens from localStorage:', e);
    state.value.tokens = []; // Ensure tokens is an array in case of an error
    state.value.error = 'Could not load token configuration.';
  }
}

function loadGroups() {
  try {
    const storedGroups = localStorage.getItem('repositoryGroups');
    if (storedGroups) {
      const parsedGroups = JSON.parse(storedGroups);
      if (Array.isArray(parsedGroups)) {
        state.value.groups = parsedGroups;
      } else {
        state.value.groups = [];
        console.warn('Loaded "repositoryGroups" from localStorage, but it was not an array. Initializing to empty array. Value was:', parsedGroups);
      }
    } else {
      state.value.groups = []; // Initialize if nothing in storage
    }
  } catch (e) {
    console.error('Error loading groups from localStorage:', e);
    state.value.groups = []; // Also ensure groups is an array in case of an error during storage access or parsing
  }
}

function saveGroups() {
  try {
    localStorage.setItem('repositoryGroups', JSON.stringify(state.value.groups));
  } catch (e) {
    console.error('Error saving groups to localStorage:', e);
    // Optionally set an error state for groups
  }
}

// Modified to be synchronous as saveGroups is now sync
function addGroup(name: string) {
  if (!name.trim()) throw new Error('Group name cannot be empty.');
  const existingGroup = state.value.groups.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
  if (existingGroup) throw new Error(`Group '${name}' already exists.`);

  const newGroup: RepoGroup = {
    id: Date.now().toString(), // Simple unique ID
    name: name.trim(),
    repoIds: [],
  };
  state.value.groups.push(newGroup);
  saveGroups(); // Now synchronous
}

// Modified to be synchronous
function deleteGroup(groupId: string) {
  state.value.groups = state.value.groups.filter(g => g.id !== groupId);
  saveGroups(); // Now synchronous
}

// Modified to be synchronous
function addRepoToGroup(groupId: string, repoId: string | number) {
  const group = state.value.groups.find(g => g.id === groupId);
  if (group && !group.repoIds.includes(repoId)) {
    // Remove from other groups first to ensure a repo is in at most one group
    state.value.groups.forEach(g => {
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
  const group = state.value.groups.find(g => g.id === groupId);
  if (group) {
    group.repoIds = group.repoIds.filter(id => id !== repoId);
    saveGroups(); // Now synchronous
  }
}

// Watch for changes in groups and save them.
// This provides a more robust way to persist group changes automatically.
// For now, explicit saveGroups() is used. If auto-save is preferred:
// watch(state.value.groups, saveGroups, { deep: true });

// Action to set the search query
function setSearchQuery(query: string) {
  state.value.searchQuery = query.trim();
}

// Function to save a platform token
function saveToken(tokenToSave: PlatformToken) {
  if (!tokenToSave.token.trim()) {
    throw new Error('Token cannot be empty.');
  }
  if (!tokenToSave.platform) {
    throw new Error('Platform must be selected.');
  }

  try {
    const existingTokenIndex = state.value.tokens.findIndex(t => t.id === tokenToSave.id);
    if (existingTokenIndex !== -1) {
      // Update existing token
      state.value.tokens[existingTokenIndex] = { ...state.value.tokens[existingTokenIndex], ...tokenToSave };
    } else {
      // Add new token
      const newToken = { ...tokenToSave };
      if (!newToken.id) { // Ensure ID exists if it's a new token being added without one
        newToken.id = Date.now().toString();
      }
      // Check for duplicate token (same platform and token string) before adding
      const isDuplicate = state.value.tokens.some(
        t => t.platform === newToken.platform && t.token === newToken.token && t.id !== newToken.id
      );
      if (isDuplicate) {
        throw new Error(`A token for ${newToken.platform} with the same value already exists.`);
      }
      state.value.tokens.push(newToken);
    }
    localStorage.setItem('platformTokens', JSON.stringify(state.value.tokens));
    // If this is the first token, start periodic refresh
    if (state.value.tokens.length === 1 && existingTokenIndex === -1) {
       startPeriodicCacheRefresh();
    }
  } catch (e: any) {
    console.error('Error saving token to localStorage:', e);
    throw new Error(e.message || 'Failed to save token to local storage.');
  }
}

// Function to delete a platform token
function deleteToken(tokenId: string) {
  try {
    const initialTokenCount = state.value.tokens.length;
    state.value.tokens = state.value.tokens.filter(t => t.id !== tokenId);
    localStorage.setItem('platformTokens', JSON.stringify(state.value.tokens));
    // If all tokens are deleted, stop periodic refresh
    if (initialTokenCount > 0 && state.value.tokens.length === 0) {
      stopPeriodicCacheRefresh();
    }
  } catch (e) {
    console.error('Error deleting token from localStorage:', e);
    throw new Error('Failed to delete token from local storage.');
  }
}

// --- Periodic Cache Refresh ---
function startPeriodicCacheRefresh() {
  if (periodicRefreshIntervalId !== null) {
    clearInterval(periodicRefreshIntervalId);
  }
  if (state.value.tokens.length === 0) { // Do not start if no tokens
    return;
  }
  periodicRefreshIntervalId = setInterval(() => {
    // Check for tokens again inside interval, in case they were cleared by other means
    if (state.value.tokens.length > 0) {
      console.log('Periodic cache refresh triggered.');
      // Call fetchRepositories with forceRefresh: false
      // This allows fetchRepositories to use its own logic to determine if a fetch is needed
      // (e.g., if current data is stale or forceRefresh was internally decided)
      fetchRepositories({ forceRefresh: false });
    } else {
      // Token was cleared, stop the interval
      stopPeriodicCacheRefresh();
    }
  }, CACHE_REFRESH_INTERVAL_MS);
  console.log('Periodic cache refresh started.');
}

function stopPeriodicCacheRefresh() {
  if (periodicRefreshIntervalId !== null) {
    clearInterval(periodicRefreshIntervalId);
    periodicRefreshIntervalId = null;
    console.log('Periodic cache refresh stopped.');
  }
}

// Function to fetch repositories (remains async as it deals with external APIs)
// For now, focuses on GitHub. Will be expanded for other services.
async function fetchRepositories(options?: { forceRefresh?: boolean; isBackground?: boolean }) {
  const forceRefresh = options?.forceRefresh ?? false;
  const isBackground = options?.isBackground ?? false;

  if (state.value.tokens.length === 0) {
    state.value.error = 'No platform tokens are set. Please configure at least one token in options.';
    state.value.repositories = [];
    localStorage.removeItem(REPOSITORIES_CACHE_KEY); // Clear cache if no tokens
    return;
  }

  // If not forcing a refresh and repositories are already loaded, validate existing cache
  if (!forceRefresh && state.value.repositories.length > 0) {
    const cachedItem = localStorage.getItem(REPOSITORIES_CACHE_KEY);
    if (cachedItem) {
      try {
        const parsedItem = JSON.parse(cachedItem);
        if (parsedItem.timestamp && (Date.now() - parsedItem.timestamp) < CACHE_EXPIRY_MS) {
          // Cache is still valid and matches current state, no need to fetch.
          // This re-validates that the data in state.value.repositories is indeed the fresh cache.
          // If loadRepositoriesFromCache put it there, it's good.
          // If a previous fetchRepositories put it there, it's also good.
          console.log('Skipping fetch; using recently validated cached repositories.');
          return;
        }
      } catch (e) {
        // Error parsing cache, or item is malformed. Proceed to fetch.
        console.warn('Error validating cache during fetch, proceeding to refresh:', e);
      }
    }
  }

  // Proceed with fetching if forceRefresh is true, or no initial repositories, or cache is stale/invalid
  if (!isBackground) {
    state.value.isLoading = true;
  }
  state.value.error = null; // Clear previous errors regardless of background mode

  let allRepositories: Repository[] = [];
  const errors: string[] = [];

  for (const platformToken of state.value.tokens) {
    try {
      let service;
      switch (platformToken.platform) {
        case 'GitHub':
          service = new GithubService();
          break;
        case 'GitLab':
          service = new GitlabService();
          break;
        case 'Bitbucket':
          service = new BitbucketService();
          break;
        default:
          console.warn(`Unsupported platform: ${platformToken.platform}`);
          errors.push(`Unsupported platform: ${platformToken.platform} for token ${platformToken.name || platformToken.id}.`);
          continue;
      }

      if (!platformToken.token) {
        console.warn(`Token for ${platformToken.platform} (ID: ${platformToken.id}, Name: ${platformToken.name || 'N/A'}) is empty. Skipping.`);
        errors.push(`Token for ${platformToken.platform} ${platformToken.name ? `(${platformToken.name})` : `(ID: ${platformToken.id})`} is empty.`);
        continue;
      }

      const repos = await service.getRepositories(platformToken.token);
      // Add a 'sourcePlatform' to each repository to distinguish them if IDs clash
      // and to know which token/platform it came from.
      allRepositories.push(...repos.map(repo => ({
        ...repo,
        sourcePlatform: platformToken.platform,
        tokenId: platformToken.id // To trace back to the token if needed
      })));
    } catch (e: any) {
      console.error(`Failed to fetch repositories for ${platformToken.platform} (Token: ${platformToken.name || platformToken.id}):`, e);
      let errorMessage = `Error fetching from ${platformToken.platform}`;
      if (platformToken.name) {
        errorMessage += ` (Token: ${platformToken.name})`;
      }
      if (e instanceof ApiError) {
        errorMessage += `: ${e.message}`;
      } else {
        errorMessage += `: An unexpected error occurred.`;
      }
      errors.push(errorMessage);
    }
  }

  state.value.repositories = allRepositories;

  if (errors.length > 0) {
    state.value.error = errors.join(' | ');
  }

  // Cache the aggregated repositories if any were fetched successfully
  if (allRepositories.length > 0 || state.value.tokens.length > 0) { // Cache even if empty if tokens exist
    try {
      const cachedData = { timestamp: Date.now(), data: allRepositories };
      localStorage.setItem(REPOSITORIES_CACHE_KEY, JSON.stringify(cachedData));
    } catch (cacheError) {
      console.error('Error saving repositories to cache:', cacheError);
      // Optionally, inform the user or log this error more formally
      if (state.value.error) {
        state.value.error += ' | Failed to cache results.';
      } else {
        state.value.error = 'Failed to cache results.';
      }
    }
  } else if (state.value.tokens.length === 0) {
    // If all tokens were removed during the fetch or before, clear the cache.
    localStorage.removeItem(REPOSITORIES_CACHE_KEY);
  }
  // If errors occurred but some repos were fetched, repositories are updated, and errors are set.
  // If all fetches failed, repositories will be empty, and errors will be set.

  if (!isBackground) {
      state.value.isLoading = false;
  }
}

// Function to load repositories from cache
interface LoadCacheResult {
  success: boolean;
  isStale: boolean;
}

function loadRepositoriesFromCache(): LoadCacheResult {
  try {
    const cachedItem = localStorage.getItem(REPOSITORIES_CACHE_KEY);
    if (!cachedItem) {
      console.log('No cached repositories found.');
      return { success: false, isStale: true };
    }

    let cachedData;
    try {
      cachedData = JSON.parse(cachedItem);
    } catch (parseError) {
      console.error('Error parsing cached repositories from localStorage:', parseError);
      localStorage.removeItem(REPOSITORIES_CACHE_KEY); // Clean up malformed cache
      return { success: false, isStale: true };
    }

    if (!cachedData || typeof cachedData.timestamp !== 'number' || !Array.isArray(cachedData.data)) {
      console.warn('Cached repositories data is malformed. Removing.');
      localStorage.removeItem(REPOSITORIES_CACHE_KEY); // Clean up malformed cache
      return { success: false, isStale: true };
    }

    state.value.repositories = cachedData.data;
    state.value.error = null; // Clear any previous error

    const isStale = (Date.now() - cachedData.timestamp) > CACHE_EXPIRY_MS;

    if (isStale) {
      console.log('Repositories loaded from cache (stale).');
      // Optional: could remove stale cache here if we want to force a refresh next time
      // localStorage.removeItem(REPOSITORIES_CACHE_KEY);
    } else {
      console.log('Repositories loaded from cache (fresh).');
    }
    return { success: true, isStale: isStale };

  } catch (error) { // Catch any other unexpected errors during the process
    console.error('Unexpected error loading repositories from cache:', error);
    // Attempt to clean up cache if it was involved, though the error might be unrelated
    try {
      localStorage.removeItem(REPOSITORIES_CACHE_KEY);
    } catch (removeError) {
      console.error('Failed to remove cache during unexpected error handling:', removeError);
    }
    return { success: false, isStale: true };
  }
}


// Initialize by loading tokens when the store module is first imported.
// This makes tokens available as soon as the app (popup/options) starts.
loadTokens(); // already called
loadGroups(); // Load groups when store initializes
// loadRepositoriesFromCache(); // Initial load will be handled by initializeAndRefreshRepositories

// New function to initialize and refresh repositories
async function initializeAndRefreshRepositories() {
  // Ensure tokens are available before trying to load/fetch
  if (state.value.tokens.length === 0) {
    console.log('Initialization skipped: No tokens available.');
    // Optionally set an error state or handle as appropriate
    // state.value.error = 'Authentication token not found. Please configure.';
    return;
  }

  const cacheStatus = loadRepositoriesFromCache();

  if (!cacheStatus.success || cacheStatus.isStale) {
    const reason = !cacheStatus.success ? 'absent cache' : 'stale cache';
    console.log(`Initiating background refresh due to ${reason}.`);
    // Call fetchRepositories, assuming it will be adapted for isBackground
    // For now, isBackground will be an unused option in fetchRepositories
    try {
      await fetchRepositories({ forceRefresh: true, isBackground: true });
      console.log('Background refresh completed.');
    } catch (error) {
      console.error('Background refresh failed:', error);
      // Error is likely already set by fetchRepositories, but can add specific handling if needed
    }
  } else {
    console.log('Fresh data loaded from cache. No immediate refresh needed.');
  }
}

// Call the new initialization function when the store is set up.
// This replaces the direct call to loadRepositoriesFromCache().
initializeAndRefreshRepositories();


// Start periodic refresh if tokens are already loaded
if (state.value.tokens.length > 0) {
  startPeriodicCacheRefresh();
}

// --- Export Store Functionality ---
// It's common to export refs directly or wrapped in a function/object.
// Using readonly for state that shouldn't be mutated directly from components.
export function useStore() {
  function getRepoGroupId(repoId: string | number): string | null {
    for (const group of state.value.groups) {
      if (group.repoIds.includes(repoId)) {
        return group.id;
      }
    }
    return null;
  }

  return {
    // State
    tokens: readonly(computed(() => state.value.tokens)),
    repositories: readonly(computed(() => state.value.repositories)),
    isLoading: readonly(computed(() => state.value.isLoading)),
    error: readonly(computed(() => state.value.error)),
    groups: readonly(computed(() => state.value.groups)), // Expose groups
    searchQuery: readonly(computed(() => state.value.searchQuery)), // Expose search query

    // Getters
    isAuthenticated,
    repositoriesByGroup, // Expose new getter

    // Actions
    loadTokens,
    setSearchQuery, // Expose setSearchQuery
    saveToken, // New function
    deleteToken, // New function
    fetchRepositories,
    addGroup, // Expose group actions
    deleteGroup,
    addRepoToGroup,
    removeRepoFromGroup,
    getRepoGroupId, // Add this line
    // loadRepositoriesFromCache, // Kept internal, initialization managed by initializeAndRefreshRepositories
    initializeAndRefreshRepositories, // Expose the new function
    // loadGroups, // No need to expose if auto-loaded
    // saveGroups, // Internal use mostly
  };
}

export type { Repository } from '../services/apiService';
