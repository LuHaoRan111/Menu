// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE', // 单选题
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多选题
  FILL_IN_BLANK = 'FILL_IN_BLANK', // 填空题
  TRUE_FALSE = 'TRUE_FALSE', // 判断题
  PROGRAMMING = 'PROGRAMMING', // 编程题
}

// 选项类型
export interface Option {
  label: string;
  content: string;
}

// 题目数据类型
export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  content: string;
  options: string | null; // JSON字符串，解析后为Option[]
  answer: string;
  analysis: string | null;
  difficulty: number;
  language?: string; // 题目使用的编程语言
  creator?: string | null; // 创建人
  createdTime: string;
  updatedTime: string;
}

// 分页数据类型
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

// 查询题目列表响应类型
export interface QuestionListResponse {
  code: number;
  data: {
    list: Question[];
    pagination: Pagination;
  };
}

// 单个题目响应类型
export interface QuestionResponse {
  code: number;
  data: Question;
  msg?: string;
}

// AI生成题目响应类型
export interface GenerateQuestionsResponse {
  code: number;
  data: Question[];
  msg?: string;
}

// 通用操作响应类型
export interface CommonResponse {
  code: number;
  msg: string;
  data?: any;
} 