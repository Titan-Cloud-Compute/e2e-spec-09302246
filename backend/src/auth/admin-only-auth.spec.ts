/**
 * Foundation card (admin_only): no public self-registration, no public
 * registration-token preview, and invites are ADMIN-only.
 */
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from './roles.guard';

describe('admin_only auth model', () => {
  const proto = AuthController.prototype as unknown as Record<string, unknown>;

  it('has no public signup endpoint', () => {
    expect(proto.signup).toBeUndefined();
  });

  it('has no public registration-token preview endpoint', () => {
    expect(proto.previewRegistrationToken).toBeUndefined();
  });

  it('restricts invite to ADMIN via JwtAuthGuard + RolesGuard', () => {
    const handler = proto.invite as object;
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['ADMIN']);
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });
});
