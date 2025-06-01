# Repo Groupie - Chrome Extension

Repo Groupie is a Chrome extension that helps you quickly group and access your software repositories from various Git hosting platforms. It allows you to organize your projects into custom groups for easier navigation directly from your browser.

## Features

*   **Connect Multiple Platforms**: Designed to support GitHub, GitLab, and Bitbucket. (Currently, GitHub is fully implemented; GitLab and Bitbucket have placeholder services.)
*   **Automatic Repository Sync**: Fetches your repositories from connected platforms.
*   **Custom Grouping**: Create custom groups (e.g., "Work," "Personal," "Side Projects") to organize your repositories.
*   **Quick Access Popup**: Access your grouped repositories directly from the Chrome toolbar.
*   **Simple Configuration**: Manage API tokens and settings via an options page.
*   **Built with Modern Tech**: Uses Vue 3, TypeScript, and Vite for a fast and efficient experience.

## Requirements Met (from original issue)

*   Summarized requirements in this README.
*   Uses TypeScript and Vue 3.
*   Uses Vue 3 `ref` for a single, merged store.
*   Uses `<script setup>` syntax style.
*   Uses Bootstrap CSS for styling.
*   Code is split into multiple files with attempts at code reuse.

## Installation

1.  **Clone the repository (or download the source code).**
    ```bash
    # Coming soon - link to actual repo
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the extension:**
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the packaged extension files.

4.  **Load into Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right).
    *   Click "Load unpacked."
    *   Select the `dist` directory generated in step 3.

## Configuration

1.  After installation, click the Repo Groupie extension icon in your Chrome toolbar.
2.  If the popup shows a message to configure, or to go to settings, click the "Settings" button (or right-click the extension icon and choose "Options").
3.  On the Options page:
    *   **GitHub**: Enter your GitHub Personal Access Token (PAT).
        *   You can generate a PAT from your GitHub settings (Developer settings > Personal access tokens).
        *   The token needs the `repo` scope to read your repository information.
    *   **(Future)** Similar configuration will be available for GitLab and Bitbucket.
4.  Click "Save Token."

## How to Use

1.  **Open the Popup**: Click the Repo Groupie extension icon in your Chrome toolbar.
2.  **View Repositories**: Your repositories from connected accounts will be listed.
3.  **Refresh Repositories**: Click the refresh button (↻) in the popup to fetch the latest list of your repositories.
4.  **Create Groups**:
    *   In the popup, type a name for your new group in the "New group name" input field.
    *   Click "Add Group."
5.  **Assign Repositories to Groups**:
    *   Each repository in the "Ungrouped" list or within other groups has a "+/-" button next to it.
    *   Click this button. A prompt will appear.
    *   Enter the name or ID (first few characters) of the group you want to assign the repository to.
    *   To remove a repository from its current group (making it "Ungrouped"), clear the input in the prompt and submit.
6.  **Navigate to Repositories**: Click on any repository name in the popup to open its page in a new tab.
7.  **Delete Groups**:
    *   Next to each group name, there is a small "×" button.
    *   Click it and confirm to delete the group. Repositories within the deleted group will become "Ungrouped."

## Development

*   **Tech Stack**: Vue 3, TypeScript, Vite, Bootstrap CSS
*   **Source Directory**: `src/`
*   **Build Command**: `npm run build`
*   **Dev Server (for UI testing if adapted outside extension context)**: `npm run dev` (Note: Vite's HMR for extensions is more complex; typically, you rebuild and reload the extension).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
(Details to be added once the repository is public).

## License

This project is licensed under the [MIT License](LICENSE).
