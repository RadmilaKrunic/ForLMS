import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthSource, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { LdapService } from './ldap/ldap.service';
import { AuditService } from '../audit/audit.service';

/**
 * Auth flow (ELR_LMS_009):
 *  1. If a local account exists for the username (authSource = LOCAL), verify
 *     with bcrypt — this is the fallback path for admin accounts not managed
 *     by AD.
 *  2. Otherwise, look the username up in AD, verify the password by binding
 *     as the user's DN, auto-provision the User row on first login, sync
 *     displayName/email/orgUnit, and resolve roles from AD-group membership
 *     via AdGroupRoleMapping.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ldap: LdapService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(username: string, password: string) {
    const existingLocal = await this.prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } },
    });

    const user =
      existingLocal?.authSource === AuthSource.LOCAL
        ? await this.authenticateLocal(existingLocal, password)
        : await this.authenticateLdap(username, password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.log(user.id, 'LOGIN', 'User', user.id);

    const roles = await this.getRoleNames(user.id);
    const accessToken = this.jwt.sign({ sub: user.id, username: user.username, roles });
    return { accessToken, user: { id: user.id, username: user.username, displayName: user.displayName, roles } };
  }

  private async authenticateLocal(user: User, password: string) {
    if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private async authenticateLdap(username: string, password: string) {
    const ldapUser = await this.ldap.findUser(username);
    if (!ldapUser) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.ldap.verifyPassword(ldapUser.dn, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.provisionFromLdap(ldapUser);
  }

  /** Create-on-first-login + attribute sync, per ELR_LMS_009. */
  private async provisionFromLdap(ldapUser: {
    dn: string;
    username: string;
    displayName: string;
    email?: string;
    orgUnit?: string;
    groups: string[];
  }) {
    const user = await this.prisma.user.upsert({
      where: { ldapDn: ldapUser.dn },
      update: {
        displayName: ldapUser.displayName,
        email: ldapUser.email,
        orgUnit: ldapUser.orgUnit,
      },
      create: {
        username: ldapUser.username,
        ldapDn: ldapUser.dn,
        displayName: ldapUser.displayName,
        email: ldapUser.email,
        orgUnit: ldapUser.orgUnit,
        authSource: AuthSource.LDAP,
      },
    });

    await this.syncRolesFromAdGroups(user.id, ldapUser.groups);
    return user;
  }

  private async syncRolesFromAdGroups(userId: string, groupDns: string[]) {
    if (groupDns.length === 0) return;
    const mappings = await this.prisma.adGroupRoleMapping.findMany({
      where: { groupDn: { in: groupDns } },
    });
    for (const mapping of mappings) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: mapping.roleId } },
        update: {},
        create: { userId, roleId: mapping.roleId },
      });
    }
  }

  private async getRoleNames(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return roles.map((r) => r.role.name);
  }
}
