import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { ACL } from '../services/auth.service';
import { checkUserAccess, type AccessType, type CheckUserAccessResult } from '../utils/checkUserAccess';

interface User {
  fullname: string;
}

interface AccessIds {
  module_unique_id: string;
  sub_module_unique_id: string;
}

interface GeneralContextType {
  user: User | null;
  acls: ACL[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, acls: ACL[], rememberMe?: boolean) => void;
  logout: () => void;
  hasAccess: (moduleStripped: string, subModuleStripped?: string) => boolean;
  getAccessIds: (moduleStripped: string, subModuleStripped: string) => AccessIds | null;
  checkAccess: (moduleUniqueId: string, subModuleUniqueId?: string, accessType?: AccessType) => CheckUserAccessResult;
}

const GeneralContext = createContext<GeneralContextType | undefined>(undefined);

interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider = ({ children }: GeneralProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [acls, setAcls] = useState<ACL[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('token');
    const savedUser = Cookies.get('user');
    const savedAcls = localStorage.getItem('acls');

    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('user');
      }
    }
    if (savedAcls) {
      try {
        setAcls(JSON.parse(savedAcls));
      } catch {
        localStorage.removeItem('acls');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newAcls: ACL[], rememberMe = false) => {
    const cookieOptions = rememberMe ? { expires: 7 } : undefined;

    setToken(newToken);
    setUser(newUser);
    setAcls(newAcls);

    Cookies.set('token', newToken, cookieOptions);
    Cookies.set('user', JSON.stringify(newUser), cookieOptions);
    localStorage.setItem('acls', JSON.stringify(newAcls));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAcls([]);

    Cookies.remove('token');
    Cookies.remove('user');
    localStorage.removeItem('acls');
  };

  const hasAccess = (moduleStripped: string, subModuleStripped?: string): boolean => {
    if (!acls.length) return false;

    return acls.some((acl) => {
      const moduleMatch = acl.Module?.stripped === moduleStripped;
      if (!subModuleStripped) return moduleMatch;
      return moduleMatch && acl.SubModule?.stripped === subModuleStripped;
    });
  };

  const getAccessIds = (moduleStripped: string, subModuleStripped: string): AccessIds | null => {
    const acl = acls.find(
      (a) => a.Module?.stripped === moduleStripped && a.SubModule?.stripped === subModuleStripped
    );

    if (!acl) return null;

    return {
      module_unique_id: acl.module_unique_id,
      sub_module_unique_id: acl.sub_module_unique_id,
    };
  };

  const checkAccess = useCallback(
    (moduleUniqueId: string, subModuleUniqueId?: string, accessType?: AccessType): CheckUserAccessResult => {
      return checkUserAccess(acls, moduleUniqueId, subModuleUniqueId, accessType);
    },
    [acls]
  );

  const isAuthenticated = !!token && !!user;

  return (
    <GeneralContext.Provider
      value={{
        user,
        acls,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasAccess,
        getAccessIds,
        checkAccess,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneral = (): GeneralContextType => {
  const context = useContext(GeneralContext);
  if (context === undefined) {
    throw new Error('useGeneral must be used within a GeneralProvider');
  }
  return context;
};

export default GeneralContext;
