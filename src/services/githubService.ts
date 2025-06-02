// src/services/githubService.ts
import { ApiService, Repository, ApiError } from './apiService';

const GITHUB_API_URL = 'https://api.github.com';

export class GithubService implements ApiService {
  public async getRepositories(token: string): Promise<Repository[]> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user/repos?type=owner&sort=updated&per_page=100`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiError('Unauthorized: Invalid GitHub token or insufficient scope.', response.status);
        }
        throw new ApiError(`GitHub API request failed: ${response.statusText}`, response.status);
      }

      const data = await response.json();

      return data.map((repo: any) => ({
        id: String(repo.id),
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        owner: repo.owner.login,
        source: 'GitHub',
      }));
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching GitHub repositories:', error);
      throw new ApiError('Failed to fetch repositories from GitHub.');
    }
  }

  // Example: Optional method to validate token or get user info
  public async getUserProfile(token: string): Promise<any> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!response.ok) {
        throw new ApiError(`GitHub API request failed: ${response.statusText}`, response.status);
      }
      return await response.json();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Error fetching GitHub user profile:', error);
        throw new ApiError('Failed to fetch user profile from GitHub.');
    }
  }
}
