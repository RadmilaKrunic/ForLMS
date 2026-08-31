import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ldap from 'ldapjs';

export interface LdapUserAttributes {
  dn: string;
  username: string;
  displayName: string;
  email?: string;
  orgUnit?: string;
  /** Distinguished names of the AD groups the user is a member of. */
  groups: string[];
}

/**
 * Thin wrapper around ldapjs implementing the two operations the platform
 * needs against SCA's Active Directory: locate a user's DN by username
 * (service-account bind + search), then verify their password with a bind
 * as that DN. Also carries the attributes ELR_LMS_009 requires syncing
 * (displayName, email, orgUnit) plus group membership for role mapping.
 */
@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(private readonly config: ConfigService) {}

  private createClient(): ldap.Client {
    return ldap.createClient({ url: this.config.get<string>('ldap.url')! });
  }

  async findUser(username: string): Promise<LdapUserAttributes | null> {
    const client = this.createClient();
    const bindDn = this.config.get<string>('ldap.bindDn')!;
    const bindPassword = this.config.get<string>('ldap.bindPassword')!;
    const baseDn = this.config.get<string>('ldap.baseDn')!;
    const filterTemplate = this.config.get<string>('ldap.userFilter')!;
    const attrs = this.config.get('ldap.attributes') as {
      displayName: string;
      email: string;
      orgUnit: string;
      groups: string;
    };

    try {
      await this.bind(client, bindDn, bindPassword);
      const filter = filterTemplate.replace('{{username}}', this.escape(username));

      const entry = await new Promise<ldap.SearchEntry | null>((resolve, reject) => {
        client.search(baseDn, { filter, scope: 'sub' }, (err, res) => {
          if (err) return reject(err);
          let found: ldap.SearchEntry | null = null;
          res.on('searchEntry', (entry) => {
            found = entry;
          });
          res.on('error', reject);
          res.on('end', () => resolve(found));
        });
      });

      if (!entry) return null;

      const get = (name: string): string | undefined =>
        entry.pojo.attributes.find((a) => a.type === name)?.values?.[0];
      const getAll = (name: string): string[] =>
        entry.pojo.attributes.find((a) => a.type === name)?.values ?? [];

      return {
        dn: entry.pojo.objectName,
        username,
        displayName: get(attrs.displayName) ?? username,
        email: get(attrs.email),
        orgUnit: get(attrs.orgUnit),
        groups: getAll(attrs.groups),
      };
    } finally {
      client.unbind();
    }
  }

  /** Verifies the user's password by binding to AD as their own DN. */
  async verifyPassword(dn: string, password: string): Promise<boolean> {
    const client = this.createClient();
    try {
      await this.bind(client, dn, password);
      return true;
    } catch (err) {
      this.logger.debug(`LDAP bind failed for ${dn}: ${(err as Error).message}`);
      return false;
    } finally {
      client.unbind();
    }
  }

  private bind(client: ldap.Client, dn: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.bind(dn, password, (err) => (err ? reject(err) : resolve()));
    });
  }

  /** Escapes LDAP filter special characters to prevent filter injection. */
  private escape(value: string): string {
    return value.replace(/[\\*()\0]/g, (c) => `\\${c.charCodeAt(0).toString(16).padStart(2, '0')}`);
  }
}
