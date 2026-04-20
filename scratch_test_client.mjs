import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.workspace.update({
      where: { workspace_id: 1 },
      data: { logo: "test" } // This might fail if client isn't regenerated
    });
    console.log('Update OK');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
