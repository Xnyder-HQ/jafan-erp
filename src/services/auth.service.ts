import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    fullname: string;
    acls: ACL[];
  } | null;
}

export interface ACL {
  unique_id: string;
  user_unique_id: string;
  role_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Role: {
    unique_id: string;
    name: string;
    stripped: string;
  };
  Module: {
    unique_id: string;
    name: string;
    stripped: string;
  };
  SubModule: {
    unique_id: string;
    name: string;
    stripped: string;
  };
}

export interface PasswordRecoveryPayload {
  login_id: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post('/auth/signin/via/email', payload);
    return response.data;
  },

  passwordRecovery: async (payload: PasswordRecoveryPayload) => {
    const response = await api.post('/password/recover', payload);
    return response.data;
  },
};

export default authService;
