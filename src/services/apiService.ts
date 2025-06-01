// src/services/apiService.ts
export interface Repository {
  id: string | number;
  name: string;
  url: string;
  description?: string;
  owner: string;
  source: 'GitHub' | 'GitLab' | 'Bitbucket'; // To identify the origin
}

export interface ApiService {
  getRepositories(token: string): Promise<Repository[]>;
  // getUserProfile?(token: string): Promise<any>; // Optional: for validating token or getting user info
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}
