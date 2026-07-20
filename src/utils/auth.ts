import type { User } from '../types/auth';
import { getStoredAdmins } from './storage';

// Mock authentication against the stored admins list.
// In a real app, this would call a backend with proper password hashing.
export async function authenticateUser(username: string, password: string): Promise<User> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

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
