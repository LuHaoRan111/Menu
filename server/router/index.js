import Router from "@koa/router";
import { 
  getUsers, 
  postUser, 
  getStudyNote, 
  getQuestions, 
  getQuestion, 
  addQuestion, 
  updateQuestion, 
  deleteQuestion, 
  batchDeleteQuestions, 
  generateQuestions 
} from "../controller/index.js";

const router = new Router({
  prefix: "/api",
});

// 用户相关路由
router.get("/users", getUsers);
router.post("/users", postUser);

// 学习心得路由
router.get("/study-note", getStudyNote);

// 题库管理路由
router.get("/questions", getQuestions);
router.get("/questions/:id", getQuestion);
router.post("/questions", addQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);
router.post("/questions/batch-delete", batchDeleteQuestions);
router.post("/questions/generate", generateQuestions);

export default router;
