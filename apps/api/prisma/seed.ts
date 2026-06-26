import bcrypt from "bcryptjs";
import { LOS_SANTOS_DISTRICTS, ROLE_PERMISSIONS, RoleType } from "../../../packages/shared/src";
import { PrismaClient, type Permission as PrismaPermission, type RoleType as PrismaRoleType } from "../src/shared/prisma";

const prisma = new PrismaClient();
const ADMIN_PASSWORD = "Admin1234!";
const BCRYPT_ROUNDS = 12;

function districtCoords(id: number): string {
  const offset = id * 120;
  return JSON.stringify({
    type: "Polygon",
    coordinates: [[[offset, offset], [offset + 90, offset], [offset + 90, offset + 90], [offset, offset + 90], [offset, offset]]]
  });
}

async function seedAdmin(): Promise<void> {
  const password = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: RoleType.FISCAL_GENERAL as PrismaRoleType, active: true },
    create: {
      username: "admin",
      displayName: "Administrador SADOJ",
      password,
      role: RoleType.FISCAL_GENERAL as PrismaRoleType,
      active: true,
      division: "Fiscalía General"
    }
  });
}

async function seedZones(): Promise<void> {
  for (const district of LOS_SANTOS_DISTRICTS) {
    await prisma.zone.upsert({
      where: { name: district.name },
      update: {
        district: district.name,
        description: district.subZones.join(", "),
        coordsJson: districtCoords(district.id)
      },
      create: {
        name: district.name,
        district: district.name,
        description: district.subZones.join(", "),
        coordsJson: districtCoords(district.id)
      }
    });
  }
}

async function seedRolePermissions(): Promise<void> {
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role: role as PrismaRoleType, permission: permission as PrismaPermission } },
        update: {},
        create: { role: role as PrismaRoleType, permission: permission as PrismaPermission }
      });
    }
  }
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedZones();
  await seedRolePermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
