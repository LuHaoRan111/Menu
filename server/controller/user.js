import { getUsersModel, postUserModel } from "../model/index.js";
// controller => 处理路由参数逻辑的
export const getUsers = async (ctx) => {
  try {
    const query = ctx.query;
    const name = query.name || "";
    const pagenum = Math.abs(Number(query.pagenum)) || 1;
    const pagesize = Math.abs(Number(query.pagesize)) || 10;
    const skip = (pagenum - 1) * pagesize;
    try {
      ctx.body = await getUsersModel(name, skip, pagesize);
    } catch (err) {
      throw err;
    }
  } catch (err) {
    throw err;
  }
};

export const postUser = async (ctx) => {
  try {
    const body = ctx.request.body;
    const name = body.name || "";
    const email = body.email || "";
    const password = body.password || "";
    ctx.body = await postUserModel(name, email, password);
  } catch (err) {
    throw err;
  }
};
