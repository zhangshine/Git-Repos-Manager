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
        class="mb-3 group-drop-zone"
        @dragover.prevent
        @drop="onDrop(getGroupIdByName(groupName), $event)"
      >
        <v-row align="center" no-gutters class="group-header-custom">
          <v-col>
            <div class="text-subtitle-1">{{ groupName }}</div>
          </v-col>
          <v-col cols="auto">
            <v-btn icon variant="text" size="x-small" @click="confirmDeleteGroup(getGroupIdByName(groupName))" title="Delete group">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="groupRepos.length > 0">
          <v-col v-for="repo in groupRepos" :key="repo.id" cols="12" sm="6" md="4" lg="3">
            <v-card class="d-flex flex-column fill-height">
              <v-card-title>{{ repo.name }}</v-card-title>
              <v-card-subtitle>{{ repo.owner }} / {{ repo.source }}</v-card-subtitle>
              <v-card-text :class="{ 'text-disabled font-italic': !repo.description }">{{ repo.description || "No description available." }}</v-card-text>
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
      <div v-if="store.repositoriesByGroup.value.ungrouped.length > 0" class="mb-3">
        <div class="text-subtitle-1 group-header-custom">Ungrouped</div>
        <v-row>
          <v-col v-for="repo in store.repositoriesByGroup.value.ungrouped" :key="repo.id" cols="12" sm="6" md="4" lg="3">
            <v-card draggable="true" @dragstart="onDragStart(repo, $event)" class="d-flex flex-column fill-height">
              <v-card-title>{{ repo.name }}</v-card-title>
              <v-card-subtitle>{{ repo.owner }} / {{ repo.source }}</v-card-subtitle>
              <v-card-text :class="{ 'text-disabled font-italic': !repo.description }">{{ repo.description || "No description available." }}</v-card-text>
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

    <v-divider class="my-2"></v-divider>
    <v-btn variant="outlined" size="small" block @click="openOptionsPage">
      Settings
    </v-btn>

    <v-dialog v-model="isAssignGroupDialogVisible" max-width="500px">
      <v-card v-if="selectedRepoForGrouping">
        <v-card-title>
          Assign "{{ selectedRepoForGrouping.name }}" to Group
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedGroupIdForDialog"
            :items="store.groups.value"
            item-title="name"
            item-value="id"
            label="Select Group"
            placeholder="Choose a group"
            :disabled="store.groups.value.length === 0"
            no-data-text="No groups available. Create one first."
          ></v-select>
          <div v-if="store.groups.value.length === 0" class="text-caption text-disabled mt-2">
            You need to create a group first before you can assign a repository.
          </div>
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
  isAssignGroupDialogVisible.value = true;
  console.log('Open assign group dialog for repo:', repo.name);
};

const closeAssignGroupDialog = () => {
  isAssignGroupDialogVisible.value = false;
  selectedRepoForGrouping.value = null;
  selectedGroupIdForDialog.value = null;
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
.group-drop-zone {
  /* Optional: Add some visual indication that it's a drop zone */
  /* border: 2px dashed transparent; */
  padding: 5px; /* Add some padding so the border doesn't overlap content too much */
  margin-bottom: 10px; /* Ensure spacing between drop zones */
  transition: background-color 0.2s ease;
}
.group-drop-zone:hover {
  /* background-color: #f0f0f0; /* Light background on hover to indicate droppable area */
}
.group-drop-zone.drag-over { /* You would need to dynamically add this class via JS if desired */
  /* border-color: #4CAF50; */
  /* background-color: #e8f5e9; */
}

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
  font-size: 0.95rem; /* Consider Vuetify typography classes if they match */
  color: #333; /* Or use Vuetify theme colors */
  margin-bottom: 0.3rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #eee; /* v-divider could be an alternative if design allows */
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

:deep(.v-card-title) {
  font-size: 1rem; /* Adjust as needed */
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-bottom: 8px; /* Add some space below title */
}

:deep(.v-card-subtitle) {
  font-size: 0.875rem;
  padding-bottom: 8px; /* Add some space below subtitle */
}

:deep(.v-card-text) {
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Limit to 3 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  /* min-height: 4.4em; /* Approx 3 lines (3 * 1.4em line-height + small buffer) */
  /* max-height: 4.4em; */ /* To prevent card resizing due to this, ensure card has fixed height or flex grow for this section is limited*/
  flex-grow: 1; /* Allow text to take available space before actions */
  padding-bottom: 8px; /* Add some space before actions */
}

/* Style for "No description available." text is now handled by Vuetify's `text-disabled` and `font-italic` classes directly in the template */
/* :deep(.v-card-text.no-description-text) {
  color: #757575; // Vuetify's grey.darken-1 or use var(--v-disabled-color)
  font-style: italic;
} */

:deep(.v-card-actions) {
  padding-top: 0px; /* Remove extra padding if mt-auto is used and space is sufficient */
}

/* Remove old deep styles for v-list-item */
</style>
