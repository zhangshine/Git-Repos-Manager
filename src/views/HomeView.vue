<template>
  <v-container class="popup-container" fluid>
    <v-row align="center" class="mb-3">
      <v-col>
        <div class="text-h5">My Repositories</div>
      </v-col>
      <v-col cols="auto">
        <v-btn size="small" color="info" icon :loading="store.isLoading.value" :disabled="store.isLoading.value" @click="refreshRepos" title="Refresh Repositories">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading and Error States -->
    <v-row v-if="store.isLoading.value && store.repositories.value.length === 0" justify="center" class="mt-4">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-2">Loading repositories...</p>
      </v-col>
    </v-row>
    <v-alert v-if="!store.isLoading.value && store.error.value" type="error" density="compact" class="mb-3">
      {{ store.error.value }}
      <p>Visit <a href="#" @click.prevent="openOptionsPage" class="text-white font-weight-bold">options</a> to check configuration.</p>
    </v-alert>

    <!-- Group Management -->
    <div class="mb-3">
      <v-text-field
        v-model="newGroupName"
        label="New group name"
        density="compact"
        hide-details="auto"
        @keyup.enter="handleCreateGroup"
        class="mb-1"
      >
        <template v-slot:append>
          <v-btn variant="outlined" color="success" @click="handleCreateGroup" :disabled="!newGroupName.trim()">Add Group</v-btn>
        </template>
      </v-text-field>
      <v-alert v-if="groupError" type="error" density="compact" class="mt-1">{{ groupError }}</v-alert>
    </div>

    <!-- Display Repositories by Group -->
    <div v-if="!store.isLoading.value && !store.error.value && (store.groups.value.length > 0 || store.repositories.value.length > 0)">
      <!-- Grouped Repositories -->
      <div
        v-for="(groupRepos, groupName) in store.repositoriesByGroup.value.grouped"
        :key="groupName"
        class="group-container"
        @dragover.prevent
        @drop="onDrop(getGroupIdByName(groupName), $event)"
      >
        <v-row align="center" no-gutters class="group-header-custom">
          <v-col>
            <div class="group-title-text">{{ groupName }}</div>
          </v-col>
          <v-col cols="auto">
            <v-btn icon variant="text" size="x-small" @click="confirmDeleteGroup(getGroupIdByName(groupName))" title="Delete group">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="groupRepos.length > 0">
          <v-col v-for="repo in groupRepos" :key="repo.id" cols="12" sm="4" md="3" lg="2">
            <v-card class="d-flex flex-column fill-height">
              <v-card-title>{{ repo.name }}</v-card-title>
              <v-card-subtitle>{{ repo.owner }} / {{ repo.source }}</v-card-subtitle>
              <v-card-actions class="mt-auto">
                <v-btn :href="repo.url" target="_blank" variant="text" :title="`View ${repo.name} on ${repo.source}`">View Repo</v-btn>
                <v-spacer></v-spacer>
                <v-btn icon variant="text" size="x-small" @click="removeRepoFromGroup(repo)" title="Remove from group">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        <div v-else class="text-caption text-disabled pa-2">No repositories in this group.</div>
      </div>

      <!-- Ungrouped Repositories -->
      <div v-if="store.repositoriesByGroup.value.ungrouped.length > 0" class="group-container">
        <div class="group-header-custom">
          <span class="group-title-text">Ungrouped</span>
        </div>
        <v-row>
          <v-col v-for="repo in store.repositoriesByGroup.value.ungrouped" :key="repo.id" cols="12" sm="4" md="3" lg="2">
            <v-card draggable="true" @dragstart="onDragStart(repo, $event)" class="d-flex flex-column fill-height">
              <v-card-title>{{ repo.name }}</v-card-title>
              <v-card-subtitle>{{ repo.owner }} / {{ repo.source }}</v-card-subtitle>
              <v-card-actions class="mt-auto">
                <v-btn :href="repo.url" target="_blank" variant="text" :title="`View ${repo.name} on ${repo.source}`">View Repo</v-btn>
                <v-spacer></v-spacer>
                <v-btn size="x-small" color="primary" variant="outlined" @click="openAssignGroupDialog(repo)" title="Add to group">Add to</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <v-row v-if="!store.isLoading.value && !store.error.value && store.repositories.value.length === 0 && store.groups.value.length === 0 && store.isAuthenticated.value" justify="center" class="mt-4">
      <v-col class="text-center">
        <p>No repositories found. Try refreshing.</p>
      </v-col>
    </v-row>
    <v-row v-if="!store.isAuthenticated.value && !store.isLoading.value" justify="center" class="mt-4">
      <v-col class="text-center">
        <p>Please <a href="#" @click.prevent="openOptionsPage">configure your API token(s)</a> to see repositories.</p>
      </v-col>
    </v-row>

    <v-dialog v-model="isAssignGroupDialogVisible" max-width="500px">
      <v-card v-if="selectedRepoForGrouping">
        <v-card-title>
          Assign "{{ selectedRepoForGrouping.name }}" to Group
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="groupSearchQuery"
            label="Search Group"
            density="compact"
            hide-details
            class="mb-3"
          ></v-text-field>
          <div v-if="store.groups.value.length === 0" class="text-caption text-disabled mb-2">
            No groups available. Create one first.
          </div>
          <v-list
            v-else
            density="compact"
            style="max-height: 200px; overflow-y: auto;"
            class="border rounded"
          >
            <!-- Iterate over filteredGroups -->
            <v-list-item
              v-for="group in filteredGroups"
              :key="group.id"
              :value="group.id"
              @click="selectedGroupIdForDialog = group.id"
              :active="selectedGroupIdForDialog === group.id"
              color="primary"
            >
              <v-list-item-title>{{ group.name }}</v-list-item-title>
            </v-list-item>
            <!-- Message when filter yields no results but there are groups -->
            <v-list-item v-if="filteredGroups.length === 0 && groupSearchQuery && store.groups.value.length > 0">
              <v-list-item-title class="text-caption text-disabled">
                No groups match your search "{{ groupSearchQuery }}".
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- This message is already handled by the v-if/v-else on the v-list and the div above it -->
          <!-- <div v-if="store.groups.value.length === 0" class="text-caption text-disabled mt-2">
            You need to create a group first before you can assign a repository.
          </div> -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAssignGroupDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="confirmAssignGroup"
            :disabled="!selectedGroupIdForDialog || !selectedRepoForGrouping"
          >
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // Add this import
import { useStore } from '../store';
import type { Repository, RepoGroup } from '../store'; // Assuming RepoGroup is exported from store or defined locally

const store = useStore();
const router = useRouter(); // Add this
const newGroupName = ref('');
const groupError = ref<string | null>(null);
const draggedRepoId = ref<string | null>(null); // Added for drag operation
const selectedRepoForGrouping = ref<Repository | null>(null);
const isAssignGroupDialogVisible = ref(false);
const selectedGroupIdForDialog = ref<string | null>(null);
const groupSearchQuery = ref(''); // Added for the new search field

// Computed property for filtering groups
const filteredGroups = computed(() => {
  if (!groupSearchQuery.value) {
    return store.groups.value;
  }
  return store.groups.value.filter(group =>
    group.name.toLowerCase().includes(groupSearchQuery.value.toLowerCase())
  );
});

const openOptionsPage = () => {
  router.push('/options');
};
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

const onDrop = async (groupId: string | undefined, event: DragEvent) => {
  if (event.dataTransfer) {
    const repoId = event.dataTransfer.getData('text/plain');
    if (groupId && repoId) { // Ensure it's not a drop on its original (non-group) or same item
      console.log(`Attempting to drop repo ${repoId} into group ${groupId}`);
      try {
        // Check if repo is already in the target group (optional, store might handle this)
        const group = store.groups.value.find(g => g.id === groupId);
        if (group && group.repoIds.includes(repoId)) {
            console.log(`Repo ${repoId} is already in group ${groupId}. No action taken.`);
            draggedRepoId.value = null; // Clear dragged repo id
            return;
        }

        // Find current group of repo, if any, to remove it from there first
        let currentGroupIdOfDraggedRepo: string | null = null;
        for (const grp of store.groups.value) {
            if (grp.repoIds.includes(repoId)) {
                currentGroupIdOfDraggedRepo = grp.id;
                break;
            }
        }
        // If the repo is part of another group, remove it first
        if (currentGroupIdOfDraggedRepo && currentGroupIdOfDraggedRepo !== groupId) {
            await store.removeRepoFromGroup(currentGroupIdOfDraggedRepo, repoId);
        }

        await store.addRepoToGroup(groupId, repoId);
        console.log(`Repo ${repoId} successfully added to group ${groupId}`);
      } catch (e: any) {
        console.error(`Error dropping repo ${repoId} into group ${groupId}:`, e);
        groupError.value = `Error adding repo to group: ${e.message || 'Unknown error'}`;
      } finally {
        draggedRepoId.value = null; // Clear dragged repo id
      }
    } else if (repoId === draggedRepoId.value) {
      // console.log("Repo dropped in the same conceptual area or invalid target, clearing dragged ID.");
      // This case might occur if not dropped on a valid group, or dropped back onto ungrouped (which has no drop handler yet)
      // For now, just clear. Future: handle dropping on "ungrouped" to remove from a group.
      draggedRepoId.value = null;
    } else {
      console.warn('Drop event occurred without valid groupId or repoId.', { groupId, repoId });
      draggedRepoId.value = null; // Clear in case of incomplete drag
    }
  }
};

const onDragStart = (repo: Repository, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', repo.id);
    draggedRepoId.value = repo.id;
    // Optional: Visual feedback for dragging
    // event.dataTransfer.effectAllowed = 'move';
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

const openAssignGroupDialog = (repo: Repository) => {
  selectedRepoForGrouping.value = repo;
  selectedGroupIdForDialog.value = null; // Reset selection
  groupSearchQuery.value = ''; // Reset search query
  isAssignGroupDialogVisible.value = true;
  console.log('Open assign group dialog for repo:', repo.name);
};

const closeAssignGroupDialog = () => {
  isAssignGroupDialogVisible.value = false;
  selectedRepoForGrouping.value = null;
  selectedGroupIdForDialog.value = null;
  groupSearchQuery.value = ''; // Also reset search query on close
};

const confirmAssignGroup = async () => {
  if (!selectedRepoForGrouping.value || !selectedGroupIdForDialog.value) {
    console.error('No repository or group selected for assignment.');
    groupError.value = 'Failed to assign: Repository or group not selected.'; // Show error to user
    return;
  }
  try {
    // Check if repo is already in another group and remove it (store.addRepoToGroup already handles this)
    // Optional: Add a check here if store.addRepoToGroup doesn't handle it,
    // or if you want to provide specific feedback to the user about moving the repo.
    // For now, relying on store.addRepoToGroup's logic.

    await store.addRepoToGroup(selectedGroupIdForDialog.value, selectedRepoForGrouping.value.id);
    console.log(`Repository ${selectedRepoForGrouping.value.name} assigned to group ${selectedGroupIdForDialog.value}.`);
    closeAssignGroupDialog();
  } catch (e: any) {
    console.error('Error assigning repository to group:', e);
    groupError.value = `Error assigning to group: ${e.message || 'Unknown error'}`;
    // Keep dialog open if error? Or close and show error? For now, keeps open.
  }
};

const removeRepoFromGroup = async (repo: Repository) => {
  const currentGroupId = store.getRepoGroupId(repo.id); // Use the new store function
  if (currentGroupId) {
    try {
      await store.removeRepoFromGroup(currentGroupId, repo.id);
      console.log(`Repository ${repo.name} removed from group.`);
    } catch (e: any) {
      groupError.value = `Error removing repository from group: ${e.message}`;
      console.error('Error removing repository from group:', e);
    }
  } else {
    console.warn(`Repository ${repo.name} not found in any group.`);
    // Potentially set an error message or handle this case as needed
    groupError.value = `Repository "${repo.name}" doesn't seem to be in a group.`;
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
.group-container { /* Renamed from group-drop-zone */
  background-color: #f9f9f9; /* Light background */
  border: 1px solid #e0e0e0; /* Subtle border */
  padding: 15px; /* Increased padding within each group section */
  margin-bottom: 20px; /* Increased bottom margin for better separation */
  border-radius: 4px; /* Optional: slightly rounded corners */
  transition: background-color 0.2s ease;
}
.group-container:hover {
  /* background-color: #f0f0f0; */ /* Example hover, can be adjusted or removed */
}
/* Styles for when an item is dragged over a group-container, if needed later
.group-container.drag-over {
  border-color: #4CAF50;
  background-color: #e8f5e9;
}
*/

.popup-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.repo-link-custom {
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block; /* Ensures ellipsis works with other elements if any */
  max-width: 100%; /* Ensure it doesn't overflow its container */
}
.repo-link-custom:hover {
  text-decoration: underline;
}
.group-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem; /* Spacing below the header row */
  padding-bottom: 0.3rem;
  /* border-bottom: 1px solid #ddd; */ /* Border removed as group-container has it */
}

.group-title-text { /* New class for group titles */
  font-weight: bold; /* Bolder titles */
  font-size: 1.1rem; /* Slightly larger titles */
  color: #333;
}

/* Card Styling */
.v-card {
  transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
  width: 100%; /* Ensure card takes full width of v-col */
  /* height: 100%; /* d-flex and fill-height class should handle this */
}

.v-card:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08); /* Adjusted shadow for a bit more depth */
  transform: translateY(-3px);
}

:deep(.v-card-item) { /* Added to control padding around title/subtitle block */
  padding: 10px; /* Reduced padding */
}

:deep(.v-card-title) {
  font-size: 0.9rem; /* Decreased font size */
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-bottom: 2px; /* Further reduced padding */
  line-height: 1.4em; /* Adjust line-height for tighter spacing if needed */
}

:deep(.v-card-subtitle) {
  font-size: 0.8rem; /* Decreased font size */
  padding-bottom: 2px; /* Further reduced padding */
  line-height: 1.4em; /* Adjust line-height for tighter spacing if needed */
}

/* Removed .v-card-text styling as the component is no longer present */

:deep(.v-card-actions) {
  padding: 0 8px 4px 8px; /* More compact: top 0, L/R 8px, bottom 4px */
  min-height: auto; /* Override default min-height if any */
}

/* Ensure v-card itself doesn't have excessive min-height or padding if not overridden by props */
.v-card {
  transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
  width: 100%; /* Ensure card takes full width of v-col */
  /* min-height: 0; /* Override Vuetify's default min-height for v-card if necessary. Test this carefully. */
}

/* Remove old deep styles for v-list-item */
</style>
