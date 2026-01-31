import api from './api';

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'DISPATCHER' | 'FLEET' | 'SUPPORT';
  };
  token: string;
}

export const authService = {
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { identifier, password });
    return response.data;
  },

  registerSuperAdmin: async (data: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    password: string; 
    dateOfBirth: string; 
    gender: string; 
    faydaId: string; 
    faydaIdFrontUrl: string; 
    faydaIdBackUrl: string; 
  }) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      fayda_id: data.faydaId,
      fayda_id_front_url: data.faydaIdFrontUrl,
      fayda_id_back_url: data.faydaIdBackUrl,
      role: 'super_admin'
    };
    // Use the specific super-admin register endpoint
    const response = await api.post('/auth/super-admin/register', payload);
    return response.data;
  },

  verifyAccount: async (identifier: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { phoneNumber: identifier, otp });
    return response.data;
  },

  requestPasswordReset: async (identifier: string) => {
    const response = await api.post('/auth/forgot-password', { identifier });
    return response.data;
  },

  resetPassword: async (data: Record<string, unknown>) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  verifyResetOtp: async (identifier: string, otp: string) => {
    // We send 'phoneNumber' because backend verifyResetOTP expects it or we can change backend.
    // Backend verifyResetOTP expects { phoneNumber, otp }. But it uses it as identifier.
    // identifier can be phone or email.
    // Let's send { phoneNumber: identifier, otp } to keys match backend expectation.
    const response = await api.post('/auth/verify-reset-otp', { phoneNumber: identifier, otp });
    return response.data;
  },

  resendOtp: async (identifier: string, type: 'registration' | 'reset' = 'registration') => {
    const response = await api.post('/auth/resend-otp', { identifier, type });
    return response.data;
  },

  checkSetup: async () => {
    const response = await api.get('/auth/setup-status');
    return response.data;
  }
};
