import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** ELR_LMS_005: role-based access control on endpoints. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
