import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { AxiosResponse } from 'axios';

// 通用API响应类型，匹配后端返回格式
interface ApiResponse<T = any> {
  code: number;
  data?: T;  // 可选，因为有些响应（如删除操作）可能没有data字段
  msg?: string;
}

// API函数类型，用于描述API调用函数
type ApiFunction<P, R> = (params: P) => Promise<AxiosResponse<ApiResponse<R>>>;

interface UseApiOptions<R> {
  onSuccess?: (response: ApiResponse<R>) => void;
  onError?: (error: any) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
}

/**
 * 自定义Hook，用于处理API调用
 * @param apiFn API函数
 * @param options 配置选项
 * @returns 包含状态和执行函数的对象
 */
export function useApi<P, R>(
  apiFn: ApiFunction<P, R>,
  options: UseApiOptions<R> = {}
) {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const {
    onSuccess,
    onError,
    showSuccessMessage = false,
    showErrorMessage = true,
    successMessage = '操作成功',
  } = options;

  const execute = useCallback(
    async (params: P) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFn(params);
        const apiResult = response.data;
        
        if (apiResult.code === 0) {
          // 成功处理
          if (apiResult.data !== undefined) {
            setData(apiResult.data);
          }
          
          if (showSuccessMessage) {
            message.success(successMessage);
          }
          
          if (onSuccess) {
            onSuccess(apiResult);
          }
          
          return apiResult;
        } else {
          // 业务逻辑错误
          const errorMsg = apiResult.msg || '操作失败';
          if (showErrorMessage) {
            message.error(errorMsg);
          }
          
          setError({ message: errorMsg });
          
          if (onError) {
            onError({ message: errorMsg });
          }
          
          return apiResult;
        }
      } catch (err: any) {
        setError(err);
        
        // 如果请求拦截器没有处理错误消息，在这里处理
        if (showErrorMessage && !err.handled) {
          message.error(err.message || '请求失败');
        }
        
        if (onError) {
          onError(err);
        }
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn, onSuccess, onError, showSuccessMessage, showErrorMessage, successMessage]
  );

  return {
    data,
    loading,
    error,
    execute,
    reset: useCallback(() => {
      setData(null);
      setError(null);
    }, []),
  };
}

// 分页数据结构
interface PaginationData { 
  list: any[]; 
  pagination: { 
    total: number;
    page: number;
    pageSize: number;
  } 
}

// 分页参数结构
interface PaginationParams { 
  page?: number; 
  pageSize?: number;
  [key: string]: any;
}

/**
 * 用于分页查询的自定义Hook
 */
export function usePaginatedApi<R extends PaginationData>(
  apiFn: ApiFunction<PaginationParams, R>,
  options: UseApiOptions<R> = {}
) {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [list, setList] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  
  // 添加请求ID追踪，避免竞态条件
  const requestIdRef = useRef<number>(0);
  
  // 添加防抖控制
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用ref跟踪最后一次请求参数，避免重复请求
  const lastParamsRef = useRef<PaginationParams | null>(null);
  
  // 添加初始加载标志
  const hasLoadedRef = useRef<boolean>(false);
  
  // 创建自定义成功回调，处理分页数据
  const handleSuccess = useCallback((response: ApiResponse<R>) => {
    // 标记已完成初始加载
    hasLoadedRef.current = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('API请求成功，响应数据:', response);
    }
    
    // 重置连接错误状态
    setConnectionError(false);
    
    if (response.code === 0) {
      // 检查response.data是否存在
      const responseData = response.data;
      if (responseData) {
        try {
          // 尝试获取列表数据
          const listData = responseData.list || [];
          setList(listData);
          
          // 尝试获取分页信息
          const paginationInfo = responseData.pagination;
          if (paginationInfo) {
            setPagination(prev => ({
              current: Number(paginationInfo.page || prev.current),
              pageSize: Number(paginationInfo.pageSize || prev.pageSize),
              total: Number(paginationInfo.total || 0),
            }));
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('处理后的列表数据:', listData);
            console.log('处理后的分页信息:', paginationInfo);
          }
        } catch (err) {
          console.error('处理响应数据时出错:', err);
        }
      }
      
      // 调用用户提供的成功回调
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    }
  }, [options.onSuccess]);
  
  // 创建自定义错误回调，处理连接错误
  const handleError = useCallback((err: any) => {
    // 检查是否为连接错误 (ECONNREFUSED) 或网络错误
    const isConnectionError = 
      (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('Network Error'))) || 
      (err.code && err.code === 'ECONNABORTED');
    
    if (isConnectionError) {
      setConnectionError(true);
      message.error('无法连接到服务器，请确保后端服务已启动');
    }
    
    // 调用用户提供的错误回调
    if (options.onError) {
      options.onError(err);
    }
  }, [options.onError]);
  
  // 使用基础API钩子
  const api = useApi(apiFn, {
    ...options,
    onSuccess: handleSuccess,
    onError: handleError,
  });
  
  // 清理函数，避免内存泄漏
  useEffect(() => {
    return () => {
      // 组件卸载时清除定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // 防抖函数
  const debounce = (func: Function, delay: number = 300) => {
    // 先清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      func();
      debounceTimerRef.current = null;
    }, delay);
  };
  
  // 获取列表数据的函数
  const fetchList = useCallback(
    (params: PaginationParams = {}) => {
      // 打印当前请求参数，便于调试
      console.log('请求参数:', params);
      
      // 针对初始化请求的特殊处理，确保第一次加载能执行
      if (params.page === 1 && params.pageSize === 15 && Object.keys(params).length <= 2) {
        console.log('这是初始加载请求，强制执行');
        
        // 更新最后一次参数
        lastParamsRef.current = null; // 清空上次参数，确保不会被跳过
        
        // 强制执行请求
        return new Promise((resolve, reject) => {
          console.log('强制执行初始API请求:', params);
          
          // 更新分页状态
          setPagination(prev => ({ 
            ...prev, 
            current: 1, 
            pageSize: 15 
          }));
          
          // 直接执行API请求，不使用防抖
          api.execute(params)
            .then(resolve)
            .catch(reject);
        });
      }
      
      // 序列化参数用于比较（去掉空属性）
      const cleanParams = { ...params };
      Object.keys(cleanParams).forEach(key => {
        if (cleanParams[key] === undefined || cleanParams[key] === null || cleanParams[key] === '') {
          delete cleanParams[key];
        }
      });
      
      // 序列化处理后的参数
      const paramsStr = JSON.stringify(cleanParams);
      const lastParamsStr = lastParamsRef.current ? JSON.stringify(lastParamsRef.current) : null;
      
      console.log('清理后参数:', cleanParams, '上次参数:', lastParamsRef.current);
      
      // 如果参数未变化，不重复请求
      if (paramsStr === lastParamsStr && hasLoadedRef.current) {
        console.log('参数未变化，跳过请求');
        return Promise.resolve();
      }
      
      // 更新最后一次参数
      lastParamsRef.current = { ...cleanParams };
      
      // 增加请求ID
      const currentRequestId = ++requestIdRef.current;
      
      // 重置连接错误状态
      setConnectionError(false);
      
      // 防抖处理，避免短时间内多次请求
      return new Promise((resolve, reject) => {
        debounce(() => {
          // 检查是否为最新请求
          if (currentRequestId !== requestIdRef.current) {
            console.log('不是最新请求，跳过');
            return; // 不是最新请求，直接返回
          }
          
          const { page = 1, pageSize = 10, ...restParams } = cleanParams;
          
          // 更新分页状态
          setPagination(prev => ({ 
            ...prev, 
            current: Number(page), 
            pageSize: Number(pageSize) 
          }));
          
          console.log('执行API请求:', { page, pageSize, ...restParams });
          
          // 执行API请求
          api.execute({ 
            ...restParams, 
            page, 
            pageSize 
          })
          .then(resolve)
          .catch(err => {
            // 额外处理错误，确保返回一个拒绝的Promise
            reject(err);
          });
        }, 300); // 300毫秒防抖
      });
    },
    [api] // 只依赖api，避免无限循环
  );
  
  return {
    list,
    pagination,
    loading: api.loading,
    error: api.error,
    connectionError,
    fetchList,
    setList,
    // 添加一个重置连接错误状态的方法
    resetConnectionError: useCallback(() => {
      setConnectionError(false);
    }, []),
  };
}

export default useApi; 