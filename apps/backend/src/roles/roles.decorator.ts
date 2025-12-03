import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator - hỗ trợ cả string và number roles
 * @param roles - 'admin' | 'user' hoặc RoleEnum values
 */
export const Roles = (...roles: (string | number)[]) =>
  SetMetadata('roles', roles);
