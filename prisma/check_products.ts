import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        gender: true,
      }
    });
    console.log("PRODUCTS_IN_DB:", JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error querying db:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
