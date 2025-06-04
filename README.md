# Repo Groupie - PWA

Repo Groupie is a Progressive Web App (PWA) that helps you quickly group and access your software repositories from various Git hosting platforms. It allows you to organize your projects into custom groups for easier navigation from any device with a modern web browser.

## Features

*   **Connect Multiple Platforms**: Designed to support GitHub, GitLab, and Bitbucket. (Currently, GitHub is fully implemented; GitLab and Bitbucket have placeholder services.)
*   **Automatic Repository Sync**: Fetches your repositories from connected platforms.
*   **Custom Grouping**: Create custom groups (e.g., "Work," "Personal," "Side Projects") to organize your repositories.
*   **Responsive Interface**: Access your grouped repositories easily from desktop or mobile browsers.
*   **Simple Configuration**: Manage API tokens and settings via an in-app settings page.
*   **Built with Modern Tech**: Uses Vue 3, TypeScript, and Vite for a fast and efficient experience.

## Requirements Met (from original issue)

*   Summarized requirements in this README.
*   Uses TypeScript and Vue 3.
*   Uses Vue 3 `ref` for a single, merged store.
*   Uses `<script setup>` syntax style.
*   Uses Vuetify (Material Design) for styling.
*   Code is split into multiple files with attempts at code reuse.

## Accessing Repo Groupie (PWA)

You can access Repo Groupie by visiting its website:

1.  Open your web browser and go to: `https://your-repo-groupie-url.com` (Note: Replace with the actual URL when deployed).
2.  **For a more app-like experience (optional):**
    *   **On Desktop:** Look for an "Install" icon in your browser's address bar (often a computer with a down arrow) or an option in the browser menu (e.g., "Install Repo Groupie..." or "Add to Home Screen").
    *   **On Mobile:** Open the browser menu and look for an "Add to Home Screen" or "Install app" option.

Once installed, Repo Groupie will function like other apps on your device.

## Building from Source

1.  **Clone the repository (or download the source code).**
    ```bash
    git clone https://github.com/zhangshine/Git-Repos-Manager.git
    cd Git-Repos-Manager
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

## Configuration

After accessing Repo Groupie in your browser or installing it as a PWA:

1.  Navigate to the settings or configuration area within the application. This is usually accessible via a "Settings" link or an icon (e.g., a gear ⚙️).
2.  In the settings page:
    *   **GitHub**: Enter your GitHub Personal Access Token (PAT).
        *   You can generate a PAT from your GitHub settings (Developer settings > Personal access tokens).
        *   The token needs the `repo` scope to read your repository information.
    *   **(Future)** Similar configuration will be available for GitLab and Bitbucket.
3.  Click "Save Token" (or the equivalent button) to save your settings. The application will then be able to fetch and display your repositories.

## How to Use

Once Repo Groupie is configured with your API tokens:

1.  **Open the App**: Launch Repo Groupie by clicking its icon (if installed as a PWA) or by navigating to its URL in your browser.
2.  **View Repositories**: Your repositories from connected accounts will be listed on the main page.
3.  **Refresh Repositories**: Click the refresh button (often an icon like ↻ or a "Refresh" button) to fetch the latest list of your repositories.
4.  **Create Groups**:
    *   Look for an input field like "New group name" or similar.
    *   Type a name for your new group and click "Add Group" (or an equivalent button).
5.  **Assign Repositories to Groups**:
    *   Each repository in the "Ungrouped" list or within other groups should have an option to manage its group assignment (e.g., a "+/-" button, a dropdown menu, or a drag-and-drop interface).
    *   Use this control to assign the repository to your desired group.
    *   To remove a repository from its current group (making it "Ungrouped"), there will typically be an option to set its group to "None" or move it to an "Ungrouped" section.
6.  **Navigate to Repositories**: Click on any repository name to open its page on the respective Git hosting platform (e.g., GitHub) in a new tab.
7.  **Delete Groups**:
    *   Next to each group name, look for a delete option (e.g., a "×" button, a trash icon).
    *   Click it and confirm to delete the group. Repositories within the deleted group will typically become "Ungrouped."

## Development

*   **Tech Stack**: Vue 3, TypeScript, Vite, Vuetify
*   **Source Directory**: `src/`
*   **Build Command**: `npm run build`
*   **Development Server**: To run the app locally for development, use `npm run dev`. This will start a hot-reloading development server.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
