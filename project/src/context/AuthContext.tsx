import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vehicle } from '../types';
import { API_MODE, apiClient } from '../config/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<boolean>;
  removeVehicle: (vehicleId: string) => Promise<boolean>;
  updateProfile: (name: string, phone: string) => Promise<boolean>;
  changePassword: (old: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simulated backend database stored in localStorage
const initializeMockDB = () => {
  if (!localStorage.getItem('users_db')) {
    const defaultUsers = [
      {
        id: 'user_1',
        name: 'Admin User',
        email: 'admin@quickpark.com',
        phone: '9999999999',
        password: 'admin123', // In a real DB this would be hashed
        role: 'admin',
        vehicles: []
      },
      {
        id: 'user_2',
        name: 'John Doe',
        email: 'user@quickpark.com',
        phone: '9876543210',
        password: 'user123',
        role: 'user',
        vehicles: [
          { id: 'v_1', licensePlate: 'TN-07-BY-1234', type: 'sedan', modelName: 'Honda City' }
        ]
      }
    ];
    localStorage.setItem('users_db', JSON.stringify(defaultUsers));
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    initializeMockDB();
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && (token || !API_MODE)) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    if (API_MODE) {
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
        return false;
      }
    } else {
      // Mock Login
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const userSession: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role as 'user' | 'admin',
          vehicles: foundUser.vehicles || []
        };
        setUser(userSession);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userSession));
        return true;
      } else {
        setError('Invalid email or password');
        return false;
      }
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<boolean> => {
    setError(null);
    if (API_MODE) {
      try {
        const response = await apiClient.post('/auth/register', { name, email, phone, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        return false;
      }
    } else {
      // Mock Registration
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      if (users.some((u: any) => u.email === email)) {
        setError('User already exists with this email');
        return false;
      }

      const newUserDb = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        password,
        role: 'user',
        vehicles: []
      };
      
      users.push(newUserDb);
      localStorage.setItem('users_db', JSON.stringify(users));

      const userSession: User = {
        id: newUserDb.id,
        name: newUserDb.name,
        email: newUserDb.email,
        phone: newUserDb.phone,
        role: 'user',
        vehicles: []
      };

      setUser(userSession);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userSession));
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    const newVehicle: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      ...vehicle
    };

    if (API_MODE) {
      try {
        const response = await apiClient.post('/users/vehicles', newVehicle);
        const updatedUser = { ...user, vehicles: response.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } catch (err) {
        return false;
      }
    } else {
      // Mock add vehicle
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          const currentVehicles = u.vehicles || [];
          const updatedVehicles = [...currentVehicles, newVehicle];
          return { ...u, vehicles: updatedVehicles };
        }
        return u;
      });

      localStorage.setItem('users_db', JSON.stringify(updatedUsers));
      const updatedUser = { ...user, vehicles: [...(user.vehicles || []), newVehicle] };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
  };

  const removeVehicle = async (vehicleId: string): Promise<boolean> => {
    if (!user) return false;

    if (API_MODE) {
      try {
        await apiClient.delete(`/users/vehicles/${vehicleId}`);
        const updatedVehicles = (user.vehicles || []).filter(v => v.id !== vehicleId);
        const updatedUser = { ...user, vehicles: updatedVehicles };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } catch (err) {
        return false;
      }
    } else {
      // Mock delete vehicle
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          const updatedVehicles = (u.vehicles || []).filter((v: any) => v.id !== vehicleId);
          return { ...u, vehicles: updatedVehicles };
        }
        return u;
      });

      localStorage.setItem('users_db', JSON.stringify(updatedUsers));
      const updatedVehicles = (user.vehicles || []).filter(v => v.id !== vehicleId);
      const updatedUser = { ...user, vehicles: updatedVehicles };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
  };

  const updateProfile = async (name: string, phone: string): Promise<boolean> => {
    if (!user) return false;

    if (API_MODE) {
      try {
        const response = await apiClient.put('/users/profile', { name, phone });
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } catch (err) {
        return false;
      }
    } else {
      // Mock update profile
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return { ...u, name, phone };
        }
        return u;
      });

      localStorage.setItem('users_db', JSON.stringify(updatedUsers));
      const updatedUser = { ...user, name, phone };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
  };

  const changePassword = async (old: string, newPass: string): Promise<boolean> => {
    if (!user) return false;

    if (API_MODE) {
      try {
        await apiClient.put('/users/password', { oldPassword: old, newPassword: newPass });
        return true;
      } catch (err) {
        return false;
      }
    } else {
      // Mock change password
      const users = JSON.parse(localStorage.getItem('users_db') || '[]');
      const foundUserIndex = users.findIndex((u: any) => u.id === user.id && u.password === old);
      if (foundUserIndex !== -1) {
        users[foundUserIndex].password = newPass;
        localStorage.setItem('users_db', JSON.stringify(users));
        return true;
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        error,
        addVehicle,
        removeVehicle,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};