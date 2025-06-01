// src/services/bitbucketService.ts
import { ApiService, Repository, ApiError } from './apiService';

const BITBUCKET_API_URL = 'https://api.bitbucket.org/2.0';

export class BitbucketService implements ApiService {
  public async getRepositories(token: string): Promise<Repository[]> {
    // Placeholder: Implementation for Bitbucket API
    // Note: Bitbucket Cloud API typically uses App Passwords or OAuth.
    // For App Passwords, username and app password are used in Basic Auth.
    // token here might be in the format "username:app_password"
    console.warn('BitbucketService.getRepositories is not yet implemented.');
    // Example structure (using app password as token: "username:apppassword"):
    // const [username, appPassword] = token.split(':');
    // const response = await fetch(`${BITBUCKET_API_URL}/repositories/${username}?role=owner&pagelen=100`, {
    //   headers: { Authorization: `Basic ${btoa(token)}` }, // btoa for browser, different in Node.js
    // });
    // if (!response.ok) throw new ApiError('Bitbucket API request failed', response.status);
    // const data = await response.json();
    // return data.values.map((repo: any) => ({ /* mapping */ }));
    await Promise.resolve();
    return [
        {id: 'bb1', name: 'Bitbucket Repo 1 (Demo)', url: '#', owner: 'bitbucket_user', source: 'Bitbucket'},
        {id: 'bb2', name: 'Bitbucket Repo 2 (Demo)', url: '#', owner: 'bitbucket_user', source: 'Bitbucket'}
    ];
  }
}
