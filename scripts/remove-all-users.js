let { PrismaClient } = require("@prisma/client");

let client = new PrismaClient();

client.user.deleteMany().then((r) => console.log("deleted", r.count, "users"));
