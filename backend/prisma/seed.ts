import { PrismaClient, AuthSource } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seeds the three baseline roles and one local Administrator account so the
 * platform is reachable before any AD-group mapping is configured
 * (see docs/deployment-vm.md, step 7).
 */
async function main() {
  const roles = ['Administrator', 'ContentManager', 'Learner'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'Administrator' },
  });

  const bootstrapPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme';
  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: 'LMS Administrator',
      authSource: AuthSource.LOCAL,
      passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('Seed complete. Local admin username: admin');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
