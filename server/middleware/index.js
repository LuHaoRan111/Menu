export const errorHandler = () => {
  return async (ctx, next) => {
    try {
      // 把控制权交给后续的中间件，直到后续中间件执行完毕，才会继续执行当前中间件剩余的代码
      await next();
      if (ctx.response.status === 404 && !ctx.response.body) {
        ctx.throw(404);
      }
    } catch (error) {
      const { url = "" } = ctx.request;
      const { status = 500, message } = error;
      // 区分 API 请求
      // 例如请求 http://localhost:3000/xxx.png
      if (url.startsWith("/api")) {
        ctx.status = typeof status === "number" ? status : 500;
        ctx.body = {
          msg: message,
        };
      }
      // 非 /api 请求：不处理，Koa 会使用默认的错误响应
    }
  };
};
