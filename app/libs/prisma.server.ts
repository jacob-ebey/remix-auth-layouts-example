import { PrismaClient } from "@prisma/client";

declare global {
  var prismaClient: PrismaClient | undefined;
}

let prisma = (global.prismaClient = global.prismaClient || new PrismaClient());

export default prisma;
