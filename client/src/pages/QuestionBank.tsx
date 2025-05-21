import React, { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  message,
  Space,
  Tag,
  Modal,
  Popconfirm,
  Pagination,
} from 'antd';
import {
  PlusOutlined,
  DownOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { getQuestions, deleteQuestion, batchDeleteQuestions } from '../utils/api';
import { Question, QuestionType } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePaginatedApi, useApi } from '../hooks/useApi';
import QuestionForm from '../components/QuestionForm';

// 添加样式对象，防止闪烁
const styles: Record<string, CSSProperties> = {
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  buttonWrapper: {
    marginRight: 16,
  },
  addButtonWrapper: {
    position: 'relative',
  },
  addButton: {
    position: 'relative',
    zIndex: 1,
    transition: 'none',
    boxShadow: 'none',
  },
  deleteButton: {
    transition: 'none',
  },
  dropdownMenu: {
    boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    minWidth: '120px',
  },
  dropdownItem: {
    padding: '8px 12px',
    cursor: 'pointer',
  }
};

interface QuestionBankProps {
  hideHeader?: boolean;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ hideHeader = false }) => {
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty] = useState<number | null>(null);
  const [selectedLanguage] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('全部');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 打开AI生成题目页面
  function handleAIGenerate() {
    console.log('准备跳转到AI出题页面');
    setDropdownVisible(false); // 关闭下拉菜单
    try {
      navigate('/ai-question');
      console.log('跳转完成');
    } catch (error) {
      console.error('导航错误:', error);
      // 备用方案：使用window.location
      window.location.href = '/ai-question';
    }
  }

  // 检查是否从AI生成页面返回
  useEffect(() => {
    const state = location.state as any;
    if (state && state.fromAIQuestion) {
      console.log('从AI生成页面返回，保持在AI生成界面');
      // 使用定时器确保组件完全渲染后执行
      setTimeout(() => {
        handleAIGenerate();
        // 清除状态，防止重复触发
        window.history.replaceState({}, document.title);
      }, 0);
    }
  }, [location, navigate]);

  // 使用分页API钩子加载题目列表
  const {
    list: questions,
    pagination,
    loading,
    fetchList,
    connectionError,
    resetConnectionError,
    setList
  } = usePaginatedApi<{ list: Question[]; pagination: { total: number, page: number, pageSize: number }}>(getQuestions);

  // 使用API钩子处理删除操作
  const { execute: executeDelete } = useApi<number, any>(deleteQuestion, {
    showSuccessMessage: false,
    successMessage: '删除成功',
    onSuccess: () => {
      refreshQuestionList();
    }
  });
  
  // 使用API钩子处理批量删除
  const { execute: executeBatchDelete } = useApi<number[], any>(batchDeleteQuestions, {
    showSuccessMessage: false,
    successMessage: '批量删除成功',
    onSuccess: () => {
      setSelectedRowKeys([]);
      refreshQuestionList();
    }
  });
  
  // 手动立即加载数据 - 这里直接在顶层调用API
  React.useEffect(() => {
    console.log('在组件初始化时立即调用API');
    // 设置一个立即执行的计时器，确保组件完全渲染后执行
    const immediateTimer = setTimeout(() => {
      console.log('立即执行数据加载');
      // 直接调用getQuestions API，不通过钩子
      getQuestions({ page: 1, pageSize: 15 })
        .then(response => {
          console.log('直接API调用响应:', response);
        })
        .catch(error => {
          console.error('直接API调用失败:', error);
        });
      
      // 也尝试通过钩子加载
      fetchList({ page: 1, pageSize: 15 });
      
      // 3秒后关闭初始加载状态
      setTimeout(() => {
        setInitialLoad(false);
      }, 3000);
    }, 0);
    
    return () => clearTimeout(immediateTimer);
  }, []);  // 空依赖数组，确保只执行一次

  // 刷新题目列表的函数
  const refreshQuestionList = useCallback(() => {
    // 保存当前查询参数
    const currentParams: any = {
      keyword: searchKeyword,
      difficulty: selectedDifficulty,
      language: selectedLanguage,
      pageSize: pagination.pageSize || 15
    };
    
    // 只有当选择了特定类型时才添加type参数，"全部"不传type
    if (selectedType) {
      currentParams.type = selectedType;
    }
    
    console.log('刷新列表，参数:', currentParams);
    
    // 判断是否需要跳转页码
    const page = (questions.length <= 1 && pagination.current > 1) ? 
      pagination.current - 1 : pagination.current;
    
    // 刷新列表
    fetchList({
      ...currentParams,
      page
    });
  }, [
    fetchList, 
    questions.length, 
    pagination.current, 
    selectedType, 
    searchKeyword, 
    selectedDifficulty, 
    selectedLanguage,
    pagination.pageSize
  ]);

  // 处理表格分页、筛选、排序变化
  const handleTableChange = useCallback((newPagination: any) => {
    // 检查页码是否发生变化
    if (newPagination.current === pagination.current && 
        newPagination.pageSize === pagination.pageSize) {
      return; // 如果页码和每页大小未变，不执行请求
    }
    
    console.log('表格分页变化:', newPagination.current, '每页数量:', newPagination.pageSize);
    
    // 构造查询参数
    const params: any = {
      page: newPagination.current,
      pageSize: newPagination.pageSize || 15,
      keyword: searchKeyword,
      difficulty: selectedDifficulty,
      language: selectedLanguage
    };
    
    // 只有当选择了特定类型时才添加type参数
    if (selectedType) {
      params.type = selectedType;
    }
    
    fetchList(params);
  }, [fetchList, pagination.current, pagination.pageSize, selectedType, searchKeyword, selectedDifficulty, selectedLanguage]);

  // 搜索防抖计时器ref
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // 处理搜索
  const handleSearch = useCallback(() => {
    // 清除之前的定时器
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // 设置新的定时器，延迟300ms执行搜索
    searchDebounceRef.current = setTimeout(() => {
      console.log('执行搜索, 关键词:', searchKeyword, '类型:', selectedType);
      
      // 构造查询参数
      const params: any = {
        page: 1,
        pageSize: pagination.pageSize || 15,
        keyword: searchKeyword,
        difficulty: selectedDifficulty,
        language: selectedLanguage
      };
      
      // 只有当选择了特定类型时才添加type参数
      if (selectedType) {
        params.type = selectedType;
      }
      
      fetchList(params);
      
      searchDebounceRef.current = null;
    }, 300);
  }, [fetchList, searchKeyword, selectedType, selectedDifficulty, selectedLanguage, pagination.pageSize]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // 处理删除题目
  const handleDelete = async (id: number) => {
    try {
      const result = await executeDelete(id);
      if (result && result.code === 0) {
        // 删除成功后立即刷新列表
        message.success('删除成功');
        // 直接从当前列表中移除该项，实现立即更新UI
        setList((prevList: Question[]) => prevList.filter((item: Question) => item.id !== id));
        // 同时发起请求刷新数据
        refreshQuestionList();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的题目');
      return;
    }
    
    try {
      const result = await executeBatchDelete(selectedRowKeys as number[]);
      if (result && result.code === 0) {
        message.success('批量删除成功');
        // 直接从当前列表中移除这些项，实现立即更新UI
        setList((prevList: Question[]) => prevList.filter((item: Question) => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        // 同时发起请求刷新数据
        refreshQuestionList();
      }
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  // 处理编辑
  const handleEdit = (record: Question) => {
    setEditQuestion(record);
    setIsFormVisible(true);
  };

  // 打开添加题目表单
  const handleAdd = () => {
    console.log('打开普通出题表单');
    setDropdownVisible(false); // 关闭下拉菜单
    setEditQuestion(null);
    setIsFormVisible(true);
  };

  // 表单提交成功后刷新列表
  const handleFormSuccess = useCallback((newQuestion?: Question) => {
    setIsFormVisible(false);
    
    // 保存当前查询参数
    const currentParams = {
      type: selectedType,
      keyword: searchKeyword,
      difficulty: selectedDifficulty,
      language: selectedLanguage
    };
    
    // 根据是否是编辑模式决定页码
    const page = editQuestion ? pagination.current : 1;
    
    if (newQuestion) {
      // 如果是编辑操作，直接更新列表中的对应项
      if (editQuestion) {
        setList((prevList: Question[]) => 
          prevList.map((item: Question) => 
            item.id === newQuestion.id ? newQuestion : item
          )
        );
      } 
      // 如果是添加操作，将新项添加到列表顶部
      else {
        setList((prevList: Question[]) => [newQuestion, ...prevList]);
      }
    }
    
    // 同时发起请求刷新数据
    fetchList({
      page,
      pageSize: pagination.pageSize || 15,
      ...currentParams
    });
    
    setEditQuestion(null);
  }, [
    fetchList,
    editQuestion,
    pagination.current,
    pagination.pageSize,
    selectedType,
    searchKeyword,
    selectedDifficulty,
    selectedLanguage,
    setList
  ]);

  // 处理题型切换
  const handleTabChange = useCallback((tab: string) => {
    // 如果当前标签已经是选中状态，不执行操作
    if (tab === activeTab) {
      return;
    }
    
    console.log('切换到标签:', tab);
    
    // 确保不在切换时应用初始加载动画
    setInitialLoad(false);
    
    setActiveTab(tab);
    let typeValue = '';
    switch(tab) {
      case '单选题':
        typeValue = QuestionType.SINGLE_CHOICE;
        break;
      case '多选题':
        typeValue = QuestionType.MULTIPLE_CHOICE;
        break;
      case '编程题':
        typeValue = QuestionType.PROGRAMMING;
        break;
      case '全部':
      default:
        typeValue = '';
    }
    
    // 更新类型值，不管是否变化都进行更新
    setSelectedType(typeValue);
    
    // 无条件执行查询
    setTimeout(() => {
      console.log('执行标签切换查询，类型:', typeValue);
      fetchList({
        page: 1,
        pageSize: pagination.pageSize || 15,
        // 当选择"全部"时，不传type参数
        ...(typeValue ? { type: typeValue } : {}),
        keyword: searchKeyword,
        difficulty: selectedDifficulty,
        language: selectedLanguage
      });
    }, 0);
  }, [
    activeTab,
    fetchList,
    searchKeyword,
    selectedDifficulty,
    selectedLanguage,
    pagination.pageSize
  ]);

  // 添加按钮点击波纹效果
  const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    
    // 设置波纹元素的样式和位置
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top}px`;
    circle.classList.add("ripple");
    
    // 移除可能已存在的波纹元素
    const ripple = button.querySelector(".ripple");
    if (ripple) {
      ripple.remove();
    }
    
    // 添加新的波纹元素
    button.appendChild(circle);
    
    // 波纹动画结束后移除元素
    setTimeout(() => {
      circle.remove();
    }, 600);
  }, []);

  // 格式化题目类型显示
  const formatQuestionType = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return <span>单选题</span>;
      case QuestionType.MULTIPLE_CHOICE:
        return <span>多选题</span>;
      case QuestionType.PROGRAMMING:
        return <span>编程题</span>;
      case QuestionType.FILL_IN_BLANK:
        return <span>填空题</span>;
      case QuestionType.TRUE_FALSE:
        return <span>判断题</span>;
      default:
        return <span>未知类型</span>;
    }
  };

  // 格式化难度等级显示
  const formatDifficulty = (difficulty: number) => {
    const colors = ['', 'green', 'cyan', 'blue', 'orange', 'red'];
    const levels = ['', '简单', '较简单', '中等', '较难', '困难'];
    return <Tag color={colors[difficulty]}>{levels[difficulty]}</Tag>;
  };

  // 处理题目预览
  const handlePreview = (record: Question) => {
    setPreviewQuestion(record);
    setPreviewVisible(true);
  };

  // 关闭预览弹窗
  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewQuestion(null);
  };

  // 预览题目弹窗内容
  const renderPreviewContent = () => {
    if (!previewQuestion) return null;

    return (
      <div className="question-preview">
        <div style={{ marginBottom: '16px' }}>
          <Tag color={
            previewQuestion.type === QuestionType.SINGLE_CHOICE ? 'blue' :
            previewQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'purple' :
            previewQuestion.type === QuestionType.PROGRAMMING ? 'green' : 'default'
          }>
            {formatQuestionType(previewQuestion.type)}
          </Tag>
          
          {/* 添加难度等级标签 */}
          {previewQuestion.difficulty && (
            <Tag color={
              previewQuestion.difficulty === 1 ? 'green' :
              previewQuestion.difficulty === 2 ? 'cyan' :
              previewQuestion.difficulty === 3 ? 'blue' :
              previewQuestion.difficulty === 4 ? 'orange' :
              previewQuestion.difficulty === 5 ? 'red' : 'default'
            } style={{ marginLeft: '8px' }}>
              难度: {
                previewQuestion.difficulty === 1 ? '简单' :
                previewQuestion.difficulty === 2 ? '较简单' :
                previewQuestion.difficulty === 3 ? '中等' :
                previewQuestion.difficulty === 4 ? '较难' :
                previewQuestion.difficulty === 5 ? '困难' : '未知'
              }
            </Tag>
          )}
          
          {/* 添加语言标签 */}
          {previewQuestion.language && (
            <Tag color="geekblue" style={{ marginLeft: '8px' }}>
              语言: {previewQuestion.language}
            </Tag>
          )}
          
          {previewQuestion.creator && (
            <Tag color="cyan" style={{ marginLeft: '8px' }}>创建人: {previewQuestion.creator}</Tag>
          )}
        </div>
        
        <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>{previewQuestion.title}</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{previewQuestion.content}</div>
        </div>
        
        {previewQuestion.options && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>选项：</div>
            {renderOptions(previewQuestion.options)}
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>答案：</div>
          {previewQuestion.type === QuestionType.PROGRAMMING ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <CodeOutlined style={{ marginRight: '8px' }} /> 代码实现（{previewQuestion.language || '未知语言'}）
              </div>
              {renderCode(previewQuestion.answer)}
            </div>
          ) : (
            <div>{previewQuestion.answer}</div>
          )}
        </div>
        
        {previewQuestion.analysis && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>解析：</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{previewQuestion.analysis}</div>
          </div>
        )}
      </div>
    );
  };

  // 渲染选项内容
  const renderOptions = (options: string | null) => {
    if (!options) return null;
    try {
      const parsedOptions = JSON.parse(options);
      return (
        <div className="question-options">
          {parsedOptions.map((option: { label: string; content: string }, index: number) => (
            <div key={index} className="option-item" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{option.label}.</span>
              <span>{option.content}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  // 渲染代码内容
  const renderCode = (answer: string) => {
    return (
      <div style={{ 
        backgroundColor: '#f6f8fa', 
        padding: '16px', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto'
      }}>
        <pre style={{ margin: 0 }}>{answer}</pre>
      </div>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Question) => (
        <a onClick={() => handlePreview(record)}>{text}</a>
      )
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: QuestionType) => formatQuestionType(type)
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: number) => formatDifficulty(difficulty)
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string | undefined) => <span>{language || '未知'}</span>
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (creator: string | null) => <span>{creator || '未知'}</span>
    },
    {
      title: <div style={{ textAlign: 'center' }}>操作</div>,
      key: 'action',
      width: 150,
      render: (_: any, record: Question) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            style={{ padding: 0, color: '#1890ff', lineHeight: '22px', height: '22px', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这道题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              style={{ padding: 0, color: '#ff4d4f', lineHeight: '22px', height: '22px', display: 'inline-flex', alignItems: 'center' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  // 为每个表格行添加样式
  const onRow = (_record: Question, index?: number) => {
    return {
      style: { 
        animationDelay: `${(index || 0) * 0.05}s`
      }
    };
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  // 处理导航到学习心得
  const handleNavigateToStudyNote = () => {
    navigate('/study-note');
  };

  // 添加手动重试函数
  const handleRetry = useCallback(() => {
    resetConnectionError();
    fetchList({ 
      page: 1, 
      pageSize: pagination.pageSize || 15, 
      type: selectedType,
      keyword: searchKeyword 
    });
  }, [resetConnectionError, fetchList, selectedType, searchKeyword, pagination.pageSize]);

  // 直接使用React的useRef和useEffect实现点击外部关闭下拉菜单
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的是按钮本身，让按钮的onClick处理
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return;
      }
      
      // 如果点击在下拉菜单外部，则关闭下拉菜单
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    
    // 当下拉菜单打开时，添加点击事件监听器
    if (dropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

  return (
    <div className="question-bank-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      minWidth: '1200px', // 保留最小宽度
      overflow: 'auto'    // 只在最外层保留滚动
    }}>
      {/* 金山WPS风格标题栏，根据hideHeader属性决定是否显示 */}
      {!hideHeader && (
        <>
          <div className="kingsoft-header">
            <div className="logo-container">
              <img src="https://www.wps.cn/favicon.ico" alt="logo" style={{ height: '24px', marginRight: '8px' }} />
              <span style={{ fontWeight: 'bold' }}>金山办公</span>
              <span style={{ marginLeft: '20px', fontWeight: 'normal' }}>武汉科技大学 张三 大作业</span>
            </div>
          </div>
          
          {/* 学习心得选项卡，根据hideHeader属性决定是否显示 */}
          <div className="kingsoft-tab">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                className="kingsoft-tab-item kingsoft-tab-inactive"
                onClick={handleNavigateToStudyNote}
              >
                学习心得
              </div>
              <div className="kingsoft-tab-item kingsoft-tab-active">
                题库管理
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 主内容区域 */}
      <div className="kingsoft-content" style={{ 
        height: hideHeader ? 'calc(100vh - 16px)' : 'calc(100vh - 140px)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'visible', // 修改为visible，去掉内部滚动条
        minWidth: '1200px' // 保留最小宽度
      }}>
        <Card bordered={false} bodyStyle={{ 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'visible', // 确保不出现滚动条
          height: 'auto',
          minWidth: '1100px' // 保留最小宽度
        }} className="animate-card">
          {/* 连接错误提示 */}
          {connectionError && (
            <div style={{ 
              padding: '16px', 
              marginBottom: '16px', 
              backgroundColor: '#fff2f0', 
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#cf1322' }}>无法连接到服务器</h3>
                <p style={{ margin: '8px 0 0 0' }}>请确保后端服务已启动，然后点击重试按钮</p>
              </div>
              <Button type="primary" danger onClick={handleRetry}>
                重试连接
              </Button>
            </div>
          )}
          
          {/* 题型选择器 */}
          <div className={`kingsoft-type-selector ${initialLoad ? 'initial-load' : ''}`}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginRight: '12px', 
              fontSize: '16px', 
              fontWeight: 500 
            }}>
              题型：
            </span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  className={`kingsoft-type-button ${activeTab === '全部' ? 'kingsoft-type-button-active' : ''}`}
                  onClick={(e) => {
                    createRipple(e);
                    handleTabChange('全部');
                  }}
                >
                  全部
                </button>
                <button 
                  className={`kingsoft-type-button ${activeTab === '单选题' ? 'kingsoft-type-button-active' : ''}`}
                  onClick={(e) => {
                    createRipple(e);
                    handleTabChange('单选题');
                  }}
                >
                  单选题
                </button>
                <button 
                  className={`kingsoft-type-button ${activeTab === '多选题' ? 'kingsoft-type-button-active' : ''}`}
                  onClick={(e) => {
                    createRipple(e);
                    handleTabChange('多选题');
                  }}
                >
                  多选题
                </button>
                <button 
                  className={`kingsoft-type-button ${activeTab === '编程题' ? 'kingsoft-type-button-active' : ''}`}
                  onClick={(e) => {
                    createRipple(e);
                    handleTabChange('编程题');
                  }}
                >
                  编程题
                </button>
            </div>
          </div>
          
          {/* 搜索和操作区域 */}
          <div className="kingsoft-search-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
            <div>
              <Input.Search
                placeholder="请输入试题名称"
                style={{ width: 300 }}
                onSearch={handleSearch}
                onChange={(e) => setSearchKeyword(e.target.value)}
                enterButton
              />
            </div>
            
            {/* 重构按钮区域，完全解决闪烁问题 */}
            <div style={styles.buttonContainer}>
              <div style={styles.buttonWrapper}>
                <Popconfirm
                  title="确定要批量删除选中的题目吗？"
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                  disabled={selectedRowKeys.length === 0}
                >
                  <Button 
                    className="batch-action-button"
                    disabled={selectedRowKeys.length === 0}
                    style={styles.deleteButton}
                  >
                    批量删除
                  </Button>
                </Popconfirm>
              </div>
              
              <div style={styles.addButtonWrapper} ref={dropdownRef}>
                <Button 
                  ref={buttonRef}
                  type="primary" 
                  className="add-question-button"
                  icon={<PlusOutlined />}
                  style={styles.addButton}
                  onClick={(e) => {
                    e.preventDefault();
                    // 切换下拉菜单的显示状态
                    setDropdownVisible(!dropdownVisible);
                  }}
                >
                  出题 <DownOutlined />
                </Button>
                
                {dropdownVisible && (
                  <div className="custom-dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: '#fff',
                    boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)',
                    borderRadius: '2px',
                    padding: '4px 0',
                    minWidth: '120px',
                    zIndex: 1050,
                    marginTop: '4px'
                  }}>
                    <div 
                      className="custom-dropdown-item" 
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                      onClick={() => {
                        handleAdd();
                        setDropdownVisible(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      普通出题
                    </div>
                    <div 
                      className="custom-dropdown-item" 
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                      onClick={() => {
                        handleAIGenerate();
                        setDropdownVisible(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      AI生成题目
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 题目表格 - 使用flex: 1让表格自动占满剩余空间 */}
          <div style={{ 
            flex: '1', 
            overflow: 'visible', // 修改为visible，移除水平滚动
            display: 'flex', 
            flexDirection: 'column',
            minWidth: '1100px' // 保留最小宽度
          }}>
            <Table
              rowKey="id"
              rowSelection={rowSelection}
              columns={columns}
              dataSource={questions}
              loading={loading}
              size="middle"
              className="kingsoft-table"
              pagination={false}
              onChange={handleTableChange}
              onRow={onRow}
              style={{ 
                flex: '1', 
                overflow: 'visible', // 修改为visible，移除水平滚动
                display: 'flex', 
                flexDirection: 'column',
                minWidth: '1100px' // 保留最小宽度
              }}
            />
          </div>
          
          {/* 分页器 - 单独放置在表格下方 */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '16px', 
            marginBottom: '20px', 
            padding: '8px 16px',
            backgroundColor: '#f7f7f7',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize || 15}
              total={pagination.total}
              showSizeChanger={true}
              showQuickJumper={true}
              showTotal={(total) => `共 ${total} 条`}
              hideOnSinglePage={false}
              onChange={(page, pageSize) => handleTableChange({ current: page, pageSize })}
              onShowSizeChange={(_current, size) => {
                fetchList({
                  page: 1,
                  pageSize: size,
                  keyword: searchKeyword,
                  difficulty: selectedDifficulty,
                  language: selectedLanguage,
                  ...(selectedType ? { type: selectedType } : {})
                });
              }}
              pageSizeOptions={['15', '20', '30', '50']}
              defaultPageSize={15}
              style={{ fontSize: '14px' }}
            />
          </div>
        </Card>
      </div>

      {/* 题目预览弹窗 */}
      <Modal
        title="题目预览"
        open={previewVisible}
        onCancel={handleClosePreview}
        footer={[
          <Button key="close" onClick={handleClosePreview}>
            关闭
          </Button>
        ]}
        width={700}
        className="preview-modal"
        destroyOnClose={true}
        maskClosable={true}
        centered={true}
        transitionName=""
        maskTransitionName=""
      >
        {renderPreviewContent()}
      </Modal>

      {/* 添加/编辑题目表单 */}
      {isFormVisible && (
        <QuestionForm
          visible={isFormVisible}
          onCancel={() => setIsFormVisible(false)}
          onSuccess={handleFormSuccess}
          question={editQuestion}
        />
      )}
    </div>
  );
};

export default QuestionBank;