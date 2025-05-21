import React, { useEffect, useState, CSSProperties } from 'react';
import { Table, Button, Space, message, Card, Input, Tag, Popconfirm, Dropdown, Menu } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { Question, QuestionType } from '../types';
import QuestionForm from '../components/QuestionForm';
import { usePaginatedApi, useApi } from '../hooks/useApi';
import { getQuestions, deleteQuestion, batchDeleteQuestions } from '../utils/api';

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
  },
  deleteButton: {
    transition: 'none',
  },
};

const QuestionBankExample: React.FC = () => {
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
  
  // 使用自定义钩子加载题目列表
  const {
    list: questions,
    pagination,
    loading,
    fetchList
  } = usePaginatedApi<{ list: Question[]; pagination: { total: number, page: number, pageSize: number }}>(getQuestions);

  // 使用自定义钩子处理删除操作
  const { execute: executeDelete } = useApi<number, any>(deleteQuestion, {
    showSuccessMessage: true,
    successMessage: '删除成功',
    onSuccess: () => {
      // 刷新列表
      fetchData();
    }
  });
  
  // 使用自定义钩子处理批量删除
  const { execute: executeBatchDelete, loading: batchDeleteLoading } = useApi<number[], any>(batchDeleteQuestions, {
    showSuccessMessage: true,
    successMessage: '批量删除成功',
    onSuccess: () => {
      setSelectedRowKeys([]);
      // 刷新列表
      fetchData();
    }
  });

  // 封装的数据获取函数，确保搜索参数一致
  const fetchData = (page = pagination.current || 1, pageSize = pagination.pageSize || 15) => {
    const params: any = {
      page,
      pageSize,
    };
    
    // 只有当搜索关键词不为空时，才添加搜索参数
    if (searchKeyword && searchKeyword.trim() !== '') {
      // 只使用keyword参数，确保后端只搜索title字段
      params.keyword = searchKeyword.trim();
    }
    
    console.log('搜索参数:', params);
    fetchList(params);
  };

  // 初始加载
  useEffect(() => {
    fetchData(1, 15);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // 处理表格分页变化
  const handleTableChange = (pagination: any) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  // 处理搜索 - 只按题目名称搜索
  const handleSearch = () => {
    // 确保清除任何可能的分页或其他状态
    setSelectedRowKeys([]);
    
    // 开始新的搜索，总是从第一页开始
    fetchData(1, pagination.pageSize || 15);
    
    // 如果开发环境，打印更多信息
    if (process.env.NODE_ENV === 'development') {
      console.log('执行严格按题目名称搜索:', searchKeyword);
    }
  };

  // 处理删除题目
  const handleDelete = async (id: number) => {
    await executeDelete(id);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的题目');
      return;
    }
    await executeBatchDelete(selectedRowKeys as number[]);
    setConfirmVisible(false);
  };

  // 处理编辑
  const handleEdit = (record: Question) => {
    setEditQuestion(record);
    setIsFormVisible(true);
  };

  // 打开添加题目表单
  const handleAdd = () => {
    setEditQuestion(null);
    setIsFormVisible(true);
  };

  // 处理AI生成题目
  const handleAIGenerate = () => {
    message.info('正在跳转到AI生成题目页面...');
    // 这里可以跳转到AI生成页面或者打开AI生成Modal
  };

  // 表单提交成功后刷新列表
  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setEditQuestion(null);
    fetchData();
  };

  // 格式化题目类型显示
  const formatQuestionType = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return <span>单选题</span>;
      case QuestionType.MULTIPLE_CHOICE:
        return <span>多选题</span>;
      case QuestionType.PROGRAMMING:
        return <span>编程题</span>;
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

  // 表格列定义
  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: QuestionType) => formatQuestionType(type),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: number) => formatDifficulty(difficulty),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string | undefined) => <span>{language || '未知'}</span>,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (creator: string | null) => <span>{creator || '未知'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Question) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
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
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card bordered={false} title="题库管理(使用自定义API钩子示例)">
        {/* 搜索和操作区域 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>
              <b>注意:</b> 搜索仅匹配题目标题，不匹配其他字段
            </p>
            <Input.Search
              placeholder="请输入题目名称"
              style={{ width: 350 }}
              value={searchKeyword}
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              enterButton="搜索题目"
            />
          </div>
          
          {/* 完全重构按钮区域，解决闪烁问题 */}
          <div style={styles.buttonContainer}>
            <div style={styles.buttonWrapper}>
              {selectedRowKeys.length > 0 ? (
                <Popconfirm
                  title="确定要批量删除选中的题目吗？"
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                  placement="topRight"
                  open={confirmVisible}
                  onOpenChange={setConfirmVisible}
                  trigger="click"
                >
                  <Button 
                    loading={batchDeleteLoading}
                    style={styles.deleteButton}
                  >
                    批量删除
                  </Button>
                </Popconfirm>
              ) : (
                <Button 
                  disabled={true}
                  style={styles.deleteButton}
                >
                  批量删除
                </Button>
              )}
            </div>
            
            <div style={styles.addButtonWrapper}>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="1" onClick={handleAdd}>普通出题</Menu.Item>
                    <Menu.Item key="2" onClick={handleAIGenerate}>AI生成题目</Menu.Item>
                  </Menu>
                }
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={styles.addButton}
                >
                  出题 <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
        
        {/* 题目表格 */}
        <Table
          rowKey="id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={questions}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 添加/编辑题目表单 */}
      <QuestionForm
        visible={isFormVisible}
        onCancel={() => setIsFormVisible(false)}
        onSuccess={handleFormSuccess}
        question={editQuestion}
      />
    </div>
  );
};

export default QuestionBankExample; 