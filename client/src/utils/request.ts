import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';

// 错误码与错误信息映射
const ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求地址不存在',
  408: '请求超时',
  500: '服务器内部错误',
  501: '服务未实现',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
};

// 创建axios实例
const instance = axios.create({
  baseURL: '/api',
  timeout: 60000, // 默认超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 添加请求日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
    }
    
    // 这里可以添加token等统一处理逻辑
    // 例如: const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // 处理搜索参数
    if (config.params) {
      // 防止发送空字符串参数
      Object.keys(config.params).forEach(key => {
        if (config.params[key] === '' || config.params[key] === undefined || config.params[key] === null) {
          delete config.params[key];
        }
      });
      
      // 如果是搜索请求 (通过检查是否有title或titleSearch参数)
      if (config.params.title || config.params.titleSearch) {
        // 确保所有必要的搜索参数都被设置，以严格按题目名称搜索
        if (config.params.title) {
          config.params.titleSearch = config.params.title;  // 复制到更明确的参数
        }
        
        // 强制设置只搜索题目名称的参数
        config.params.searchByTitleOnly = true;
        config.params.searchField = 'title';
        config.params.exactTitle = true;
        config.params.excludeLanguageSearch = true;
        config.params.fulltext = false;
        
        // 处理日志
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SEARCH] 正在严格按题目名称 "${config.params.title || config.params.titleSearch}" 搜索`);
          console.log('[SEARCH] 搜索参数:', config.params);
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 添加响应日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    // 处理通用的业务逻辑
    const { data } = response;
    
    // 适配后端返回的数据格式
    // 如果后端直接返回数据而不是 { code, data, msg } 格式，则包装成标准格式
    if (data && data.code === undefined) {
      // 假设这是直接返回数据的情况，将其包装为标准响应格式
      response.data = {
        code: 0,
        data: data,
        msg: 'success'
      };
    } else if (data && data.code !== undefined) {
      // 如果code不为0(成功)，可以统一处理错误
      if (data.code !== 0) {
        // 可选：统一显示错误消息
        // message.error(data.msg || '操作失败');
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // 处理异常
    if (process.env.NODE_ENV === 'development') {
      console.error('[API RESPONSE ERROR]', error);
    }
    
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      const errorMsg = ERROR_MESSAGES[status] || '未知错误，请联系管理员';
      message.error(errorMsg);
      
      // 特殊状态码处理
      // if (status === 401) {
      //   // 处理未授权
      //   localStorage.removeItem('token');
      //   window.location.href = '/login';
      // }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络异常，请检查您的网络连接');
    } else {
      // 请求配置出错
      message.error('请求错误，请稍后再试');
    }
    
    return Promise.reject(error);
  }
);

// 通用请求方法
export const request = {
  get: <T = any>(url: string, params?: any, config?: AxiosRequestConfig) => {
    return instance.get<T, AxiosResponse<T>>(url, { params, ...config });
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return instance.post<T, AxiosResponse<T>>(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return instance.put<T, AxiosResponse<T>>(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return instance.delete<T, AxiosResponse<T>>(url, config);
  },
  
  // 自定义请求超时的方法
  postWithTimeout: <T = any>(url: string, data?: any, timeout: number = 120000) => {
    return instance.post<T, AxiosResponse<T>>(url, data, { timeout });
  },
  
  // 自定义请求方法，支持所有axios配置
  custom: <T = any>(config: AxiosRequestConfig) => {
    return instance.request<T, AxiosResponse<T>>(config);
  },
};

export default request; 