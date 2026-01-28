import type { ACL } from '../services/auth.service';

type AccessType = 'view' | 'add' | 'edit' | 'delete' | 'elevated_role';

interface CheckUserAccessResult {
  hasAccess: boolean;
  accessTypes: AccessType[];
}

/**
 *
 * @param acls
 * @param moduleUniqueId
 * @param subModuleUniqueId
 * @param accessType 
 * @returns { hasAccess, accessTypes } 
 */
export function checkUserAccess(
  acls: ACL[],
  moduleUniqueId: string,
  subModuleUniqueId?: string,
  accessType?: AccessType
): CheckUserAccessResult {
  const currentDate = new Date();

  const filteredAcls = acls.filter((acl) => {
    const isModuleMatch = acl.module_unique_id === moduleUniqueId;
    const isSubModuleMatch = subModuleUniqueId
      ? acl.sub_module_unique_id === subModuleUniqueId
      : true;
    const isNotExpired =
      !acl.acl_expiring || new Date(acl.acl_expiring) >= currentDate;

    return isModuleMatch && isSubModuleMatch && isNotExpired && acl.status === 1;
  });

  if (filteredAcls.length === 0) {
    return { hasAccess: false, accessTypes: [] };
  }

  const accessTypes = filteredAcls.reduce((acc: AccessType[], acl) => {
    const types: AccessType[] = ['view', 'add', 'edit', 'delete', 'elevated_role'];
    types.forEach((type) => {
      if (acl[type] && !acc.includes(type)) {
        acc.push(type);
      }
    });
    return acc;
  }, []);

  const hasSpecificAccess = accessType ? accessTypes.includes(accessType) : true;

  return { hasAccess: hasSpecificAccess, accessTypes };
}

export type { AccessType, CheckUserAccessResult };
