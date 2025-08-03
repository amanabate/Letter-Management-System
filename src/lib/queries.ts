import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Types
interface Letter {
  _id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  department: string;
  priority: string;
  content: string;
  createdAt: string;
  unread: boolean;
  starred: boolean;
  attachments?: Array<{ filename: string }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  createdAt: string;
  relatedLetter?: {
    _id: string;
    subject: string;
    fromName: string;
  };
}

// Query keys
export const queryKeys = {
  sentLetters: 'sentLetters',
  notifications: 'notifications',
  letters: 'letters',
  departments: 'departments',
  users: 'users',
};

// API endpoints
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch functions
export const fetchSentLetters = async () => {
  const response = await axios.get(`${API_BASE_URL}/letters/sent`);
  return response.data;
};

export const fetchNotifications = async (userId: string) => {
  const response = await axios.get(`${API_BASE_URL}/notifications/user/${userId}`);
  return response.data;
};

export const fetchLetters = async () => {
  const response = await axios.get(`${API_BASE_URL}/letters`);
  return response.data;
};

export const fetchDepartments = async () => {
  const response = await axios.get(`${API_BASE_URL}/departments`);
  return response.data;
};

export const fetchUsersByDepartment = async (departmentName: string) => {
  const response = await axios.get(`${API_BASE_URL}/users?department=${encodeURIComponent(departmentName)}`);
  return response.data;
};

// Custom hooks
export const useLetters = () => {
  return useQuery<Letter[]>({
    queryKey: ['letters'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/letters`);
      return data;
    },
  });
};

export const useSentLetters = () => {
  return useQuery<Letter[]>({
    queryKey: ['sentLetters'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/letters/sent`);
      return data;
    },
  });
};

export const useNotifications = (userId: string) => {
  return useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/notifications/user/${userId}`);
      return data;
    },
  });
};

export const useDepartments = () => {
  return useQuery<string[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/departments`);
      return data;
    },
  });
};

export const useUsersByDepartment = (department: string) => {
  return useQuery<User[]>({
    queryKey: ['users', department],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/users/department/${department}`);
      return data;
    },
    enabled: !!department,
  });
};

// Mutations
export const useUpdateLetterStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ letterId, status }: { letterId: string; status: { unread?: boolean; starred?: boolean } }) => {
      const { data } = await axios.post(`${API_BASE_URL}/letters/status`, {
        letterId,
        ...status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['sentLetters'] });
    },
  });
};

export const useForwardLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (forwardData: any) => {
      const { data } = await axios.post(`${API_BASE_URL}/letters`, forwardData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['sentLetters'] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}; 