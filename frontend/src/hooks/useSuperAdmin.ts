import { useState } from 'react';
import { apiService } from '../services/api';
import { User, UserRole } from '@shared/types';

interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const useSuperAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAdmin = async (data: CreateAdminRequest): Promise<User> => {
    try {
      setError(null);
      const admin = await apiService.post<User>('/admins', data);
      
      // Refresh users list
      await fetchUsers();
      
      return admin;
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create admin';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const changeUserRole = async (userId: string, role: UserRole): Promise<User> => {
    try {
      setError(null);
      const user = await apiService.put<User>(`/users/${userId}/role`, { role });
      
      // Update user in local state
      setUsers(prev => prev.map(u => u.id === userId ? user : u));
      
      return user;
    } catch (err: any) {
      console.error('Failed to change user role:', err);
      const errorMessage = err.response?.data?.error || 'Failed to change user role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      setError(null);
      await apiService.delete(`/users/${userId}`);
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll use a simple endpoint to get all users
      // In a real implementation, this would be paginated
      const response = await apiService.get<User[]>('/users');
      setUsers(response);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    createAdmin,
    changeUserRole,
    deleteUser,
    fetchUsers,
  };
};