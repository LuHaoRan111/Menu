import prisma from "../prisma/index.js";
export const getUsersModel = async (name, skip, pagesize) => {
  try {
    return await prisma.user.findMany({
      where: {
        name: {
          contains: name,
        },
      },
      select: {
        name: true,
        email: true,
      },
      // Offset, equivalent to page number
      skip,
      take: pagesize,
      orderBy: {
        email: "desc", // descending order，z~a
      },
    });
  } catch (err) {
    throw err;
  }
};

export const postUserModel = async (name, email, password) => {
  try {
    return await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
  } catch (err) {
    throw err;
  }
};
