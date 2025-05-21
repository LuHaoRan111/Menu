# 后端服务

## 设置环境变量

为了使用AI生成题目功能，你需要配置API密钥。请在`server`目录下创建一个`.env`文件，内容如下：

```
# API密钥配置

# 用于OpenAI API调用的密钥
# 如果使用OpenAI原生API，设置：
# OPENAI_API_KEY=sk-xxxxxxxx

# 如果使用阿里云灵积模API，设置：
ALI_API_KEY=sk-xxxxxxxx

# 用于阿里灵积模，可选配置BASE_URL
# BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

请将`sk-xxxxxxxx`替换为你实际的API密钥。

## 启动服务

安装依赖：
```
npm install
```

启动开发服务器：
```
npm start
```

服务器默认运行在`http://localhost:8080`。 