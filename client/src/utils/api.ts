import { request } from './request';
import { QuestionListResponse, QuestionResponse, GenerateQuestionsResponse, CommonResponse, Question } from '../types';

// 获取学习心得
export const getStudyNote = () => {
  return request.get<CommonResponse>('/study-note');
};

// 获取题目列表
export const getQuestions = (params: { 
  page?: number; 
  pageSize?: number; 
  type?: string; 
  title?: string;               // 基本题目名称搜索
  titleSearch?: string;         // 专用于标题搜索的参数 
  searchByTitleOnly?: boolean;  // 是否只搜索标题
  searchField?: string;         // 指定搜索字段
  searchMode?: string;          // 搜索模式
  exactTitle?: boolean;         // 精确匹配标题
  fulltext?: boolean;           // 是否全文搜索
  excludeLanguageSearch?: boolean; // 排除语言字段搜索
  keyword?: string;             // 兼容后端的通用搜索参数
  difficulty?: number;
  language?: string;            // 按编程语言筛选
}) => {
  return request.get<QuestionListResponse>('/questions', params);
};

// 获取单个题目
export const getQuestion = (id: number) => {
  return request.get<QuestionResponse>(`/questions/${id}`);
};

// 添加题目
export const addQuestion = (question: Omit<Question, 'id' | 'createdTime' | 'updatedTime'>) => {
  return request.post<QuestionResponse>('/questions', question);
};

// 更新题目
export const updateQuestion = (id: number, question: Partial<Omit<Question, 'id' | 'createdTime' | 'updatedTime'>>) => {
  return request.put<QuestionResponse>(`/questions/${id}`, question);
};

// 删除题目
export const deleteQuestion = (id: number) => {
  return request.delete<CommonResponse>(`/questions/${id}`);
};

// 批量删除题目
export const batchDeleteQuestions = (ids: number[]) => {
  return request.post<CommonResponse>('/questions/batch-delete', { ids });
};

// 生成题目 - 增加超时时间
export const generateQuestions = (params: { prompt: string; count?: number; type?: string; language?: string; difficulty?: number }) => {
  return request.postWithTimeout<GenerateQuestionsResponse>('/questions/generate', params, 300000); // 5分钟超时
}; 