import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const wsId = 1;
    // Check members
    const memberCheck = await prisma.workspaceMember.findFirst({
        where: { 
            workspace_id: parseInt(wsId), 
            role: "Owner" 
        }
    });

    console.log("Member Check Result:", memberCheck);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
