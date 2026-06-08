const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  try {
    console.log("Checking DB connectivity...");
    await db.$executeRaw`SELECT 1`;
    console.log("DB connected successfully.");

    const users = await db.user.findMany({
      include: {
        addresses: true
      }
    });

    console.log("Registered users in DB:");
    for (const u of users) {
      console.log(`User: ID=${u.id}, Name=${u.name}, Email=${u.email}`);
      console.log(`Addresses:`, u.addresses);
    }
  } catch (err) {
    console.error("Error inspecting database:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
