export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'translationSupervisor';
  department?: string;
  /** Display name (e.g. Arabic full name) */
  name?: string;
}

export interface StoredAdmin extends User {
  password: string;
  active: boolean;
  createdAt: string;
  /** Service keys this admin is responsible for. Empty/undefined = all services */
  services?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}