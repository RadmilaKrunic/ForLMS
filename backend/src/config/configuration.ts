export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? true,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  ldap: {
    url: process.env.LDAP_URL,
    bindDn: process.env.LDAP_BIND_DN,
    bindPassword: process.env.LDAP_BIND_PASSWORD,
    baseDn: process.env.LDAP_BASE_DN,
    userFilter: process.env.LDAP_USER_FILTER ?? '(sAMAccountName={{username}})',
    attributes: {
      displayName: process.env.LDAP_ATTR_DISPLAY_NAME ?? 'displayName',
      email: process.env.LDAP_ATTR_EMAIL ?? 'mail',
      orgUnit: process.env.LDAP_ATTR_ORG_UNIT ?? 'department',
      groups: process.env.LDAP_ATTR_GROUPS ?? 'memberOf',
    },
  },
  scorm: {
    storagePath: process.env.SCORM_STORAGE_PATH ?? './storage/scorm-packages',
    maxPackageSizeMb: parseInt(process.env.SCORM_MAX_PACKAGE_SIZE_MB ?? '500', 10),
  },
});
