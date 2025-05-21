import Mock from "mockjs";

const users = [];
for (let i = 0; i < 100; i++) {
  const user = {
    name: Mock.Random.cname(),
    email: Mock.Random.email(),
    password: Mock.Random.string(10),
  };
  users.push(user);
}

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function init() {
  await prisma.user.createMany({
    data: users,
  });
}
init();
