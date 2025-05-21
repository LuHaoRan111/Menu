import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koaStatic from "koa-static";
import router from "./router/index.js";
import { errorHandler } from "./middleware/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = new Koa();

process.on("uncaughtException", (err, origin) => {
  console.log(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
});

app.use(koaStatic(join(__dirname, "../client/dist")));

// 解析请求体里面的参数的
app.use(bodyParser());
app.use(errorHandler());
app.use(router.routes());
// 假如请求了一个不存在的方法，会返回 405，Method Not Allowed
app.use(router.allowedMethods());

app.listen(8080, () => {
  console.log("The server is running on http://127.0.0.1:8080");
});
