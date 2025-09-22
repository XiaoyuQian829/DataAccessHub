import api from './api';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { access, refresh } = response.data;

      // Store tokens and username in cookies
      Cookies.set('access_token', access, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
      Cookies.set('username', credentials.username, { expires: 7 }); // 7 days

      // Create a mock user object with role-based data
      let user: User = {
        id: 1,
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        first_name: '',
        last_name: '',
        roles: []
      };

      // Assign roles based on username for demo purposes
      switch (credentials.username.toLowerCase()) {
        case 'admin':
          user.roles = ['Administrator'];
          user.first_name = 'Admin';
          user.last_name = 'User';
          break;
        case 'xqian':
          user.roles = ['Data Analyst'];
          user.first_name = 'Xqian';
          user.last_name = 'User';
          break;
        case 'manager':
          user.roles = ['Data Manager'];
          user.first_name = 'Manager';
          user.last_name = 'User';
          break;
        case 'researcher':
        case 'researcher01':
          user.roles = ['Researcher'];
          user.first_name = 'Research';
          user.last_name = 'User';
          break;
        default:
          user.roles = ['Guest'];
          user.first_name = 'Guest';
          user.last_name = 'User';
      }

      // Try to get user profile, but don't fail if it's not available
      try {
        const userResponse = await api.get('/auth/user/');
        Object.assign(user, userResponse.data);
      } catch (userError) {
        console.warn('Could not fetch user profile, using mock data');
      }

      return { access, refresh, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('username');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = Cookies.get('access_token');
      if (!token) return null;

      // Try to get user from API first
      try {
        const response = await api.get('/auth/user/');
        return response.data;
      } catch (apiError) {
        // If API fails, try to reconstruct user from stored token/username
        const storedUsername = Cookies.get('username');
        if (storedUsername) {
          // Reconstruct user based on username (same logic as login)
          let user: User = {
            id: 1,
            username: storedUsername,
            email: `${storedUsername}@example.com`,
            first_name: '',
            last_name: '',
            roles: []
          };

          switch (storedUsername.toLowerCase()) {
            case 'admin':
              user.roles = ['Administrator'];
              user.first_name = 'Admin';
              user.last_name = 'User';
              break;
            case 'xqian':
              user.roles = ['Data Analyst'];
              user.first_name = 'Xqian';
              user.last_name = 'User';
              break;
            case 'manager':
              user.roles = ['Data Manager'];
              user.first_name = 'Manager';
              user.last_name = 'User';
              break;
            case 'researcher':
            case 'researcher01':
              user.roles = ['Researcher'];
              user.first_name = 'Research';
              user.last_name = 'User';
              break;
            default:
              user.roles = ['Guest'];
              user.first_name = 'Guest';
              user.last_name = 'User';
          }

          return user;
        }
        
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }

  hasRole(user: User | null, role: string): boolean {
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(user: User | null, roles: string[]): boolean {
    return roles.some(role => this.hasRole(user, role));
  }

  canAccessPage(user: User | null, page: string): boolean {
    if (!user) return false;

    const pagePermissions: Record<string, string[]> = {
      '/dashboard': ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher', 'Guest'],
      '/approvals': ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher'],
      '/datasets': ['Administrator', 'Data Manager', 'Data Analyst'],
      '/permissions': ['Administrator', 'Data Manager'],
      '/audit': ['Administrator']
    };

    const allowedRoles = pagePermissions[page];
    return allowedRoles ? this.hasAnyRole(user, allowedRoles) : false;
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) return null;

      const response = await api.post('/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      Cookies.set('access_token', access);
      
      return access;
    } catch (error) {
      this.logout();
      return null;
    }
  }
}

export const authService = new AuthService();