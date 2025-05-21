import prisma from "../prisma/index.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.ALI_API_KEY,
  timeout: 300000, // 增加API超时时间到300秒(5分钟)
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1" // 直接设置为阿里云灵积模的地址
});

// 检查API密钥是否配置
if (!process.env.ALI_API_KEY) {
  console.warn("警告: 未设置ALI_API_KEY环境变量，AI生成功能将使用模拟数据");
}

// 获取学习心得（从根目录的md文件读取）
export const getStudyNote = async (ctx) => {
  try {
    const notePath = path.join(dirname(__dirname), "../study-note.md");
    const content = await fs.readFile(notePath, "utf-8");
    ctx.body = {
      code: 0,
      data: content,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "获取学习心得失败",
      error: error.message,
    };
  }
};

// 获取题目列表
export const getQuestions = async (ctx) => {
  try {
    const { page = 1, pageSize = 10, type, keyword, difficulty, language } = ctx.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    
    // 构建查询条件
    const where = {};
    
    // 如果指定了题目类型，添加到查询条件
    if (type) {
      where.type = type;
    }
    
    // 如果指定了难度，添加到查询条件
    if (difficulty) {
      where.difficulty = parseInt(difficulty);
    }
    
    // 如果指定了语言，添加到查询条件（不匹配语言）
    // 完全移除语言匹配
    
    // 如果有关键词，只匹配题目标题
    if (keyword && keyword.trim() !== '') {
      // 直接匹配title字段，不考虑其他任何字段
      where.title = { contains: keyword.trim() };
      console.log("仅匹配题目标题:", keyword.trim());
    }
    
    console.log("查询条件:", where);
    
    // 查询总数
    const total = await prisma.question.count({ where });
    
    // 查询分页数据
    const questions = await prisma.question.findMany({
      where,
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: {
        createdTime: "desc",
      },
    });
    
    console.log(`查询到 ${questions.length} 条题目数据`);
    
    ctx.body = {
      code: 0,
      data: {
        list: questions,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
        },
      },
    };
  } catch (error) {
    console.error("获取题目列表失败:", error);
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "获取题目列表失败",
      error: error.message,
    };
  }
};

// 获取单个题目
export const getQuestion = async (ctx) => {
  try {
    const { id } = ctx.params;
    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!question) {
      ctx.status = 404;
      ctx.body = {
        code: 1,
        msg: "题目不存在",
      };
      return;
    }
    
    ctx.body = {
      code: 0,
      data: question,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "获取题目失败",
      error: error.message,
    };
  }
};

// 添加题目
export const addQuestion = async (ctx) => {
  try {
    const { title, type, content, options, answer, analysis, difficulty, creator, language } = ctx.request.body;
    
    // 数据验证
    if (!title || !type || !content || !answer) {
      ctx.status = 400;
      ctx.body = {
        code: 1,
        msg: "缺少必要参数",
      };
      return;
    }
    
    const question = await prisma.question.create({
      data: {
        title,
        type,
        content,
        options: options || null,
        answer,
        analysis: analysis || null,
        difficulty: parseInt(difficulty) || 3,
        creator: creator || null,
        language: language || null,
      },
    });
    
    ctx.body = {
      code: 0,
      data: question,
      msg: "添加题目成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "添加题目失败",
      error: error.message,
    };
  }
};

// 更新题目
export const updateQuestion = async (ctx) => {
  try {
    const { id } = ctx.params;
    const { title, type, content, options, answer, analysis, difficulty, creator, language } = ctx.request.body;
    
    // 检查题目是否存在
    const existingQuestion = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingQuestion) {
      ctx.status = 404;
      ctx.body = {
        code: 1,
        msg: "题目不存在",
      };
      return;
    }
    
    // 更新题目
    const question = await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        title,
        type,
        content,
        options: options || null,
        answer,
        analysis: analysis || null,
        difficulty: parseInt(difficulty) || existingQuestion.difficulty,
        creator: creator || existingQuestion.creator,
        language: language || existingQuestion.language,
      },
    });
    
    ctx.body = {
      code: 0,
      data: question,
      msg: "更新题目成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "更新题目失败",
      error: error.message,
    };
  }
};

// 删除题目
export const deleteQuestion = async (ctx) => {
  try {
    const { id } = ctx.params;
    
    // 检查题目是否存在
    const existingQuestion = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingQuestion) {
      ctx.status = 404;
      ctx.body = {
        code: 1,
        msg: "题目不存在",
      };
      return;
    }
    
    // 删除题目
    await prisma.question.delete({
      where: { id: parseInt(id) },
    });
    
    ctx.body = {
      code: 0,
      msg: "删除题目成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "删除题目失败",
      error: error.message,
    };
  }
};

// 批量删除题目
export const batchDeleteQuestions = async (ctx) => {
  try {
    const { ids } = ctx.request.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.status = 400;
      ctx.body = {
        code: 1,
        msg: "缺少必要参数或参数格式不正确",
      };
      return;
    }
    
    // 批量删除题目
    await prisma.$transaction(
      ids.map((id) => 
        prisma.question.delete({
          where: { id: parseInt(id) },
        })
      )
    );
    
    ctx.body = {
      code: 0,
      msg: "批量删除题目成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: "批量删除题目失败",
      error: error.message,
    };
  }
};

// 调用AI模型生成题目
export const generateQuestions = async (ctx) => {
  try {
    const { prompt, count = 5, type, language } = ctx.request.body;
    
    console.log("接收到生成题目请求:", { prompt, count, type, language });
    
    if (!prompt) {
      ctx.status = 400;
      ctx.body = {
        code: 1,
        msg: "缺少必要参数",
      };
      return;
    }
    
    // 直接生成模拟数据作为备用
    const mockQuestions = generateMockQuestions(type, count, prompt, language);
    
    // 尝试实际调用API生成题目
    try {
      // 检查API密钥是否存在
      if (!process.env.ALI_API_KEY) {
        console.error("未找到API密钥，使用模拟数据");
        ctx.status = 200;
        ctx.body = {
          code: 0,
          data: mockQuestions
        };
        return;
      }
      
      // 根据题目类型和语言构建提示词
      let questionType = "考试题目";
      let promptTemplate = "";
      
      if (type === "PROGRAMMING") {
        // 编程题的提示词模板
        questionType = "编程题";
        const langName = language || "Java";
        
        promptTemplate = `请生成${count}道关于"${prompt}"的${langName}${questionType}，每道题的格式如下：

题目标题：（简短的题目标题）
题目内容：（详细的题目描述，包含需求和约束条件）
代码实现：
\`\`\`${langName.toLowerCase()}
// 这里是${langName}代码实现
\`\`\`
解析：（解题思路和关键点说明）

每道题需包含上述所有部分，确保代码实现部分是可运行的完整代码。
请确保每道题都有明确的标题、内容、代码实现和解析，不要省略任何部分。
题目之间请用"###"分隔，便于系统识别。`;
      } else if (type === "MULTIPLE_CHOICE") {
        // 多选题的提示词模板
        questionType = "多选题";
        const langName = language || "编程";
        
        promptTemplate = `请生成${count}道关于"${prompt}"的${langName}${questionType}，每道题的格式如下：

题目标题：（简短的题目标题）
题目内容：（详细的题目描述）
选项A：（选项A的内容）
选项B：（选项B的内容）
选项C：（选项C的内容）
选项D：（选项D的内容）
正确答案：（多个选项，如ABC）
解析：（解题思路说明）

每道题需包含上述所有部分，确保每道题都有多个正确答案。
请确保每道题都有明确的标题、内容、选项、答案和解析，不要省略任何部分。
题目之间请用"###"分隔，便于系统识别。`;
      } else {
        // 单选题的提示词模板
        questionType = "单选题";
        const langName = language || "编程";
        
        promptTemplate = `请生成${count}道关于"${prompt}"的${langName}${questionType}，每道题的格式如下：

题目标题：（简短的题目标题）
题目内容：（详细的题目描述）
选项A：（选项A的内容）
选项B：（选项B的内容）
选项C：（选项C的内容）
选项D：（选项D的内容）
正确答案：（单个选项，如A）
解析：（解题思路说明）

每道题需包含上述所有部分，确保每道题只有一个正确答案。
请确保每道题都有明确的标题、内容、选项、答案和解析，不要省略任何部分。
题目之间请用"###"分隔，便于系统识别。`;
      }
      
      console.log("准备调用阿里云千问API，提示词:", promptTemplate);
      
      // 设置更长的超时时间，给API足够的时间生成所有题目
      const timeoutDuration = 300000; // 增加到300秒(5分钟)超时
      
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('阿里云千问API请求超时')), timeoutDuration)
        );
        
        console.log(`开始API调用，请求生成${count}道题目，超时时间设置为${timeoutDuration/1000}秒`);
        
        // 调用API
        const apiPromise = openai.chat.completions.create({
          messages: [
            { role: "system", content: "你是一个专业的考试题目生成助手，擅长创建高质量、清晰的考试题目。请按照指定格式生成题目，确保每道题都包含完整的标题、内容、选项、答案和解析。" },
            { role: "user", content: promptTemplate }
          ],
          model: "qwen-max",
          temperature: 0.3,
          max_tokens: 8000 // 增加token限制，确保能生成足够的内容
        });
        
        // 使用Promise.race实现超时控制
        const response = await Promise.race([apiPromise, timeoutPromise]);
        console.log("阿里云千问API响应成功");
        
        // 获取生成的文本
        const generatedText = response.choices[0].message.content.trim();
        console.log("生成的原始文本:", generatedText.substring(0, 200) + "...");
        
        // 解析生成的文本为题目数组
        const questions = parseGeneratedText(generatedText, type || "SINGLE_CHOICE", prompt, language);
        console.log(`解析完成，成功生成 ${questions.length} 道题目`);
        
        if (questions.length > 0) {
          // 如果没有生成足够的题目，用模拟数据补充
          let finalQuestions = questions;
          if (questions.length < count) {
            console.log(`API生成的题目不足，使用模拟数据补充。已生成: ${questions.length}, 需要: ${count}`);
            const additionalMockQuestions = mockQuestions.slice(0, count - questions.length);
            finalQuestions = [...questions, ...additionalMockQuestions];
          } else if (questions.length > count) {
            // 如果生成的题目超过需要的数量，只取需要的部分
            finalQuestions = questions.slice(0, count);
          }
          
          // 输出解析后的题目结构，方便调试
          if (finalQuestions.length > 0) {
            console.log("解析后的第一道题目:", JSON.stringify(finalQuestions[0], null, 2));
          }
          
          ctx.status = 200;
          ctx.body = {
            code: 0,
            data: finalQuestions
          };
          return;
        }
      } catch (apiError) {
        console.error("调用阿里云千问API失败:", apiError.message);
        // API调用失败，使用模拟数据
      }
      
      // 如果API调用失败或没有生成题目，使用模拟数据
      console.log("使用模拟数据");
      ctx.status = 200;
      ctx.body = {
        code: 0,
        data: mockQuestions
      };
      
    } catch (error) {
      console.error("生成题目总体错误:", error);
      console.error("错误详情:", error.message);
      // 如果API调用失败，退回到模拟数据
      ctx.status = 200;
      ctx.body = {
        code: 0,
        data: mockQuestions
      };
    }
  } catch (error) {
    console.error("生成题目总体错误:", error);
    console.error("错误堆栈:", error.stack);
    ctx.status = 500;
    ctx.body = {
      code: 1,
      msg: `生成题目失败: ${error.message}`,
    };
  }
};

// 解析生成的文本为题目对象
function parseGeneratedText(text, type, prompt, language) {
  const questions = [];
  
  // 辅助函数：从文本中提取数值
  function extractNumberFromText(text) {
    if (!text) return null;
    
    // 尝试直接提取数字
    const directNumber = text.match(/([0-9]+\.?[0-9]*)/) || text.match(/(\d+\.\d+)/);
    if (directNumber && directNumber[1]) {
      return parseFloat(directNumber[1]);
    }
    
    // 尝试提取分数形式 \frac{45}{8} 或 \frac{45/8} 或 45/8
    const fractionLatex = text.match(/\\frac\{(\d+)\}\{(\d+)\}/);
    if (fractionLatex && fractionLatex[1] && fractionLatex[2]) {
      const numerator = parseInt(fractionLatex[1]);
      const denominator = parseInt(fractionLatex[2]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    
    // 尝试提取普通分数形式 45/8
    const fractionNormal = text.match(/(\d+)\/(\d+)/);
    if (fractionNormal && fractionNormal[1] && fractionNormal[2]) {
      const numerator = parseInt(fractionNormal[1]);
      const denominator = parseInt(fractionNormal[2]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    
    return null;
  }

  // 尝试按题目分割文本
  let questionBlocks = [];
  
  // 清理文本，移除末尾的空分隔符
  const cleanedText = text.replace(/###\s*$/g, '');
  
  // 尝试使用多种分隔符模式
  const separatorPatterns = [
    /###\s*题目\s*\d+/g,
    /###\s*第\s*\d+\s*题/g,
    /题目\s*\d+\s*[:：]/g,
    /第\s*\d+\s*题\s*[:：]/g,
    /\n\s*\d+[\.\、]\s*/g
  ];
  
  // 尝试使用不同的分隔符分割文本
  for (const pattern of separatorPatterns) {
    if (cleanedText.match(pattern)) {
      questionBlocks = cleanedText.split(pattern).filter(block => block.trim());
      if (questionBlocks.length > 0) {
        console.log(`使用分隔符 ${pattern} 成功分割出 ${questionBlocks.length} 个题目块`);
        break;
      }
    }
  }
  
  // 如果上面的分隔符都没有匹配成功，尝试用 ### 分割
  if (questionBlocks.length === 0) {
    // 移除开头的 ### 并按 ### 分割
    const processedText = cleanedText.replace(/^###\s*/g, '');
    questionBlocks = processedText.split(/###/).filter(block => block.trim());
  }
  
  // 如果仍然没有成功分割，尝试用空行分割
  if (questionBlocks.length === 0) {
    questionBlocks = cleanedText.split(/\n\s*\n/).filter(block => block.trim());
  }
  
  // 如果只有一个题目块且没有明确的分隔符，则将整个文本作为一个题目
  if (questionBlocks.length === 0) {
    questionBlocks = [cleanedText];
  }
  
  console.log(`识别到 ${questionBlocks.length} 个可能的题目块`);
  
  // 处理每个题目块
  for (let i = 0; i < questionBlocks.length; i++) {
    try {
      const block = questionBlocks[i].trim();
      if (!block) continue;
      
      console.log(`处理题目块 ${i + 1}/${questionBlocks.length}`);
      
      // 根据题目类型进行不同的解析
      if (type === "PROGRAMMING") {
        // 编程题解析
        
        // 提取题目标题
        const titleMatch = block.match(/题目标题[：:]\s*(.+?)(?:\n|$)/) || 
                          block.match(/标题[：:]\s*(.+?)(?:\n|$)/);
        
        // 提取题目内容
        const contentMatch = block.match(/题目内容[：:]\s*(.+?)(?=代码实现|解析|$)/s) || 
                           block.match(/内容[：:]\s*(.+?)(?=代码实现|解析|$)/s);
        
        // 提取代码实现 - 支持多种代码块格式
        let codeMatch = block.match(/代码实现[：:]\s*(.+?)(?=解析|$)/s);
        
        // 如果上面没匹配到，尝试匹配Markdown代码块
        if (!codeMatch || !codeMatch[1]) {
          const codeBlockMatch = block.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            codeMatch = [null, codeBlockMatch[1]];
          }
        }
        
        // 提取解析
        const analysisMatch = block.match(/解析[：:]\s*(.+?)(?=###|$)/s) || 
                            block.match(/解释[：:]\s*(.+?)(?=###|$)/s);
        
        // 如果没有找到必要的部分，跳过这个块
        if (!titleMatch && !contentMatch) {
          console.log("跳过不完整的编程题块");
          continue;
        }
        
        // 构建编程题对象
        const question = {
          title: (titleMatch && titleMatch[1].trim()) || `关于${prompt}的编程题`,
          type: "PROGRAMMING",
          content: (contentMatch && contentMatch[1].trim()) || block.split('\n')[0].trim(),
          options: null, // 编程题没有选项
          answer: (codeMatch && codeMatch[1].trim()) || "// 请在此处实现代码",
          analysis: (analysisMatch && analysisMatch[1].trim()) || "无解析",
          difficulty: 3,
          language: language || null
        };
        
        questions.push(question);
        console.log(`成功解析编程题: ${question.title}`);
      } else if (type === "MULTIPLE_CHOICE") {
        // 多选题解析
        
        // 提取题目标题
        const titleMatch = block.match(/题目标题[：:]\s*(.+?)(?:\n|$)/) || 
                          block.match(/标题[：:]\s*(.+?)(?:\n|$)/);
        
        // 提取题目内容
        const contentMatch = block.match(/题目内容[：:]\s*(.+?)(?=选项A|$)/s) || 
                           block.match(/内容[：:]\s*(.+?)(?=选项A|$)/s);
        
        // 提取选项
        const optionA = block.match(/选项A[：:]\s*(.+?)(?=选项B|$)/s);
        const optionB = block.match(/选项B[：:]\s*(.+?)(?=选项C|$)/s);
        const optionC = block.match(/选项C[：:]\s*(.+?)(?=选项D|$)/s);
        const optionD = block.match(/选项D[：:]\s*(.+?)(?=正确答案|答案|解析|$)/s);
        
        // 提取答案
        const answerMatch = block.match(/正确答案[：:]\s*([A-D,]+)/) || 
                          block.match(/答案[：:]\s*([A-D,]+)/);
        
        // 提取解析
        const analysisMatch = block.match(/解析[：:]\s*(.+?)(?=###|$)/s) || 
                            block.match(/解释[：:]\s*(.+?)(?=###|$)/s);
        
        // 如果没有找到必要的部分，跳过这个块
        if (!titleMatch && !contentMatch) {
          console.log("跳过不完整的多选题块");
          continue;
        }
        
        // 确定正确答案
        let answer = "A,B"; // 默认答案
        if (answerMatch && answerMatch[1]) {
          answer = answerMatch[1].trim().replace(/[,，、\s]+/g, ',');
        }
        
        // 构建多选题对象
        const question = {
          title: (titleMatch && titleMatch[1].trim()) || `关于${prompt}的多选题`,
          type: "MULTIPLE_CHOICE",
          content: (contentMatch && contentMatch[1].trim()) || block.split('\n')[0].trim(),
          options: JSON.stringify([
            { label: "A", content: (optionA && optionA[1].trim()) || "选项A" },
            { label: "B", content: (optionB && optionB[1].trim()) || "选项B" },
            { label: "C", content: (optionC && optionC[1].trim()) || "选项C" },
            { label: "D", content: (optionD && optionD[1].trim()) || "选项D" }
          ]),
          answer: answer,
          analysis: (analysisMatch && analysisMatch[1].trim()) || "无解析",
          difficulty: 3,
          language: language || null
        };
        
        questions.push(question);
        console.log(`成功解析多选题: ${question.title}`);
      } else {
        // 单选题解析 (默认)
        
        // 提取题目标题
        const titleMatch = block.match(/题目标题[：:]\s*(.+?)(?:\n|$)/) || 
                          block.match(/标题[：:]\s*(.+?)(?:\n|$)/);
        
        // 提取题目内容
        const contentMatch = block.match(/题目内容[：:]\s*(.+?)(?=选项A|$)/s) || 
                           block.match(/内容[：:]\s*(.+?)(?=选项A|$)/s);
        
        // 提取选项
        const optionA = block.match(/选项A[：:]\s*(.+?)(?=选项B|$)/s);
        const optionB = block.match(/选项B[：:]\s*(.+?)(?=选项C|$)/s);
        const optionC = block.match(/选项C[：:]\s*(.+?)(?=选项D|$)/s);
        const optionD = block.match(/选项D[：:]\s*(.+?)(?=正确答案|答案|解析|$)/s);
        
        // 提取答案
        const answerMatch = block.match(/正确答案[：:]\s*([A-D])/) || 
                          block.match(/答案[：:]\s*([A-D])/);
        
        // 提取解析
        const analysisMatch = block.match(/解析[：:]\s*(.+?)(?=###|$)/s) || 
                            block.match(/解释[：:]\s*(.+?)(?=###|$)/s);
        
        // 如果没有找到必要的部分，跳过这个块
        if (!titleMatch && !contentMatch) {
          console.log("跳过不完整的单选题块");
          continue;
        }
        
        // 确定正确答案
        let answer = "A"; // 默认答案
        if (answerMatch && answerMatch[1]) {
          answer = answerMatch[1].trim();
        }
        
        // 构建单选题对象
        const question = {
          title: (titleMatch && titleMatch[1].trim()) || `关于${prompt}的单选题`,
          type: "SINGLE_CHOICE",
          content: (contentMatch && contentMatch[1].trim()) || block.split('\n')[0].trim(),
          options: JSON.stringify([
            { label: "A", content: (optionA && optionA[1].trim()) || "选项A" },
            { label: "B", content: (optionB && optionB[1].trim()) || "选项B" },
            { label: "C", content: (optionC && optionC[1].trim()) || "选项C" },
            { label: "D", content: (optionD && optionD[1].trim()) || "选项D" }
          ]),
          answer: answer,
          analysis: (analysisMatch && analysisMatch[1].trim()) || "无解析",
          difficulty: 3,
          language: language || null
        };
        
        questions.push(question);
        console.log(`成功解析单选题: ${question.title}`);
      }
    } catch (parseError) {
      console.error("解析题目块失败:", parseError);
    }
  }
  
  return questions;
}

// 模拟生成题目的函数（实际项目中应替换为真实API调用）
function generateMockQuestions(type, count, prompt, language) {
  const questions = [];
  const langName = language || "Java";
  
  // 根据语言生成不同的代码示例
  const getCodeSample = (lang, prompt) => {
    switch (lang.toLowerCase()) {
      case 'java':
        return `// Java代码示例
public class Solution {
    public static void main(String[] args) {
        System.out.println("Java解决方案");
    }
    
    // ${prompt}的实现方法
    public static void solve() {
        // 实现逻辑
    }
}`;
      case 'python':
        return `# Python代码示例
def solve():
    """
    ${prompt}的实现函数
    """
    # 实现逻辑
    print("Python解决方案")

if __name__ == "__main__":
    solve()`;
      case 'javascript':
        return `// JavaScript代码示例
function solve() {
  // ${prompt}的实现逻辑
  console.log("JavaScript解决方案");
}

// 调用函数
solve();`;
      case 'go':
        return `// Go语言代码示例
package main

import "fmt"

func main() {
    fmt.Println("Go解决方案")
    solve()
}

// ${prompt}的实现函数
func solve() {
    // 实现逻辑
}`;
      case 'csharp':
        return `// C#代码示例
using System;

class Program {
    static void Main() {
        Console.WriteLine("C#解决方案");
        Solve();
    }
    
    // ${prompt}的实现方法
    static void Solve() {
        // 实现逻辑
    }
}`;
      case 'cpp':
        return `// C++代码示例
#include <iostream>
using namespace std;

// ${prompt}的实现函数
void solve() {
    // 实现逻辑
    cout << "C++解决方案" << endl;
}

int main() {
    solve();
    return 0;
}`;
      case 'rust':
        return `// Rust代码示例
fn main() {
    println!("Rust解决方案");
    solve();
}

// ${prompt}的实现函数
fn solve() {
    // 实现逻辑
}`;
      case 'php':
        return `<?php
// PHP代码示例

/**
 * ${prompt}的实现函数
 */
function solve() {
    // 实现逻辑
    echo "PHP解决方案";
}

// 调用函数
solve();
?>`;
      default:
        return `// ${langName}代码示例
// ${prompt}的实现
function solve() {
    // 实现逻辑
    console.log("解决方案");
}`;
    }
  };
  
  for (let i = 0; i < count; i++) {
    if (type === "PROGRAMMING") {
      // 生成编程题
      questions.push({
        title: `关于${langName}的编程题${i + 1}`,
        type: "PROGRAMMING",
        content: `请实现一个${langName}函数，完成以下功能：${prompt}`,
        options: null,
        answer: getCodeSample(langName, prompt),
        analysis: `这是一道关于${langName}的${prompt}编程题，解题思路如下：\n1. 首先理解问题要求\n2. 设计算法思路\n3. 编写代码实现\n4. 测试边界情况`,
        difficulty: Math.floor(Math.random() * 5) + 1,
        language: language || null
      });
    } else if (type === "MULTIPLE_CHOICE") {
      // 生成多选题
      questions.push({
        title: `关于${langName}的多选题${i + 1}`,
        type: "MULTIPLE_CHOICE",
        content: `以下关于${langName}中${prompt}的描述，正确的有：`,
        options: JSON.stringify([
          { label: "A", content: `${langName}中的${prompt}特性A` },
          { label: "B", content: `${langName}中的${prompt}特性B` },
          { label: "C", content: `${langName}中的${prompt}特性C` },
          { label: "D", content: `${langName}中的${prompt}特性D` },
        ]),
        answer: "A,C",
        analysis: `这是一道关于${langName}的${prompt}多选题，正确答案是A和C，因为：\n- A选项描述了${langName}的正确特性\n- C选项也是${langName}的正确特性\n- B和D选项描述不准确`,
        difficulty: Math.floor(Math.random() * 5) + 1,
        language: language || null
      });
    } else {
      // 生成单选题
      questions.push({
        title: `关于${langName}的单选题${i + 1}`,
        type: "SINGLE_CHOICE",
        content: `在${langName}中，关于${prompt}的正确说法是：`,
        options: JSON.stringify([
          { label: "A", content: `${langName}中${prompt}的特性描述1` },
          { label: "B", content: `${langName}中${prompt}的特性描述2` },
          { label: "C", content: `${langName}中${prompt}的特性描述3` },
          { label: "D", content: `${langName}中${prompt}的特性描述4` },
        ]),
        answer: "A",
        analysis: `这是一道关于${langName}的${prompt}单选题，正确答案是A，因为A选项准确描述了${langName}中${prompt}的特性，而其他选项存在错误。`,
        difficulty: Math.floor(Math.random() * 5) + 1,
        language: language || null
      });
    }
  }
  
  return questions;
} 