import OpenAI from "openai";
import "dotenv/config";

try {
  const openai = new OpenAI({
    // 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：apiKey: "sk-xxx",
    apiKey: process.env.ALI_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
  const completion = await openai.chat.completions.create({
    model: "qwen-plus", //模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages: [
      {
        role: "user",
        content: `
          帮我出2道React相关的选择器，以JSON的格式返回，如下：
      [{
       "title": "React的生命周期函数有几个阶段？",
       "content": "具体描述",
       "options": [
         "1个",
         "2个",
         "3个",
         "4个"
       ],
       answer: [0, 1]
      }]  
    `,
      },
    ],
  });
  console.log(completion.choices[0].message.content);
} catch (error) {
  console.log(`错误信息：${error}`);
  console.log("请参考文档：https://help.aliyun.com/zh/model-studio/developer-reference/error-code");
}
