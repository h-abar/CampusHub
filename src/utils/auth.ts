import type { User } from '../types/auth';
import { getStoredAdmins } from './storage';
import { apiLogin } from './api';

// Authenticate against the PostgreSQL API first; fall back to the local
// stored admins list when the server is unreachable.
export async function authenticateUser(username: string, password: string): Promise<User> {
  const apiUser = await apiLogin(username, password);
  if (apiUser) return apiUser;

  const admin = getStoredAdmins().find((a) => a.username === username.trim());
  if (admin && admin.active && admin.password === password) {
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      department: admin.department,
      name: admin.name,
    };
  }
  throw new Error('Invalid credentials');
}
