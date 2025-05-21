import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  InputNumber,
  Tag,
  message,
  Space,
  Divider,
  Card,
  Checkbox,
  Row,
  Col,
  Input
} from 'antd';
import { generateQuestions, addQuestion } from '../utils/api';
import { Question } from '../types';
import { RobotOutlined, ArrowRightOutlined, LoadingOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

// 自定义题目类型枚举（只保留单选、多选和编程题）
enum CustomQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE', // 单选题
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多选题
  PROGRAMMING = 'PROGRAMMING', // 编程题
}

// 支持的编程语言
const PROGRAMMING_LANGUAGES = [
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go语言' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
  { value: 'rust', label: 'Rust' },
];

interface AIGenerateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AIGenerateForm: React.FC<AIGenerateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [addingToBank, setAddingToBank] = useState(false);
  const [generationState, setGenerationState] = useState<'idle' | 'start' | 'generating' | 'success'>('idle');

  // 生成题目
  const handleGenerate = async () => {
    try {
      await form.validateFields()
        .then(async (values) => {
          setLoading(true);
          setGenerationState('start');
          message.loading({ content: '正在生成题目，请耐心等待...', key: 'aiGenerate', duration: 0 });
          
          // 模拟初始化阶段(500ms)
          setTimeout(() => {
            setGenerationState('generating');
          }, 500);
          
          try {
            console.log("提交生成请求:", values);
            const response = await generateQuestions({
              prompt: values.prompt || '通用题目',
              count: values.count || 3, // 默认生成3题
              type: values.type,
              language: values.language || 'java', // 添加语言参数
              difficulty: values.difficulty || 3 // 添加难度参数
            });
            
            console.log("生成请求响应:", response);
            
            if (response.data.code === 0) {
              // 设置成功状态，一小段延迟后再显示结果，让动画流畅
              setGenerationState('success');
              setTimeout(() => {
                message.success({ content: '生成成功！', key: 'aiGenerate', duration: 2 });
                // 确保每个题目都有难度值和语言值
                const processedQuestions = response.data.data.map((question: Question) => ({
                  ...question,
                  difficulty: question.difficulty || values.difficulty || 3,
                  language: values.language || 'java'
                }));
                setGeneratedQuestions(processedQuestions);
                setIsPreview(true);
                setSelectedQuestions([]);
                setGenerationState('idle');
              }, 800);
            } else {
              message.error({ content: response.data.msg || '生成题目失败', key: 'aiGenerate', duration: 2 });
              setGenerationState('idle');
            }
          } catch (apiError: any) {
            console.error("API调用失败:", apiError);
            message.error({ content: `生成题目失败: ${apiError.message}`, key: 'aiGenerate', duration: 2 });
            setGenerationState('idle');
          }
        })
        .catch(errorInfo => {
          console.error("表单验证失败:", errorInfo);
          const errorFields = errorInfo.errorFields || [];
          if (errorFields.length > 0) {
            message.error(`请检查以下字段: ${errorFields.map((f: any) => f.name[0]).join(', ')}`);
          } else {
            message.error('表单验证失败，请检查输入');
          }
          setGenerationState('idle');
        });
    } catch (error) {
      console.error('未知错误:', error);
      message.error('发生未知错误，请重试');
      setGenerationState('idle');
    } finally {
      setLoading(false);
    }
  };

  // 添加题目到题库
  const handleAddToBank = async () => {
    if (selectedQuestions.length === 0) {
      message.warning('请选择要添加的题目');
      return;
    }

    try {
      setAddingToBank(true);
      
      // 选择要添加的题目
      const questionsToAdd = generatedQuestions.filter((_, index) => 
        selectedQuestions.includes(index)
      );
      
      // 获取表单中设置的语言和难度
      const formLanguage = form.getFieldValue('language') || 'java';
      const formDifficulty = form.getFieldValue('difficulty') || 3;
      
      console.log('添加题目到题库，语言:', formLanguage, '难度:', formDifficulty);
      
      // 逐个添加题目
      const promises = questionsToAdd.map(question => {
        // 去除id等字段，但保留difficulty和language
        const { id, createdTime, updatedTime, ...questionData } = question as any;
        
        // 确保每个题目都有难度和语言信息
        const questionWithDetails = {
          ...questionData,
          difficulty: questionData.difficulty || formDifficulty, // 使用题目自身难度或表单设置的难度
          language: questionData.language || formLanguage // 使用题目自身语言或表单设置的语言
        };
        
        console.log('添加题目:', questionWithDetails);
        
        return addQuestion(questionWithDetails);
      });
      
      const results = await Promise.all(promises);
      
      if (results.every(result => result.data.code === 0)) {
        message.success(`成功添加 ${results.length} 个题目到题库`);
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        setIsPreview(false);
        form.resetFields();
        onSuccess();
      } else {
        message.error('部分题目添加失败');
      }
    } catch (error) {
      console.error('添加题目到题库失败:', error);
      message.error('添加题目到题库失败，请稍后再试');
    } finally {
      setAddingToBank(false);
    }
  };

  // 返回生成表单
  const handleBackToForm = () => {
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setIsPreview(false);
  };

  // 处理选择题目
  const handleSelectQuestion = (index: number) => {
    setSelectedQuestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // 全选/取消全选
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    } else {
      setSelectedQuestions([]);
    }
  };

  // 格式化题目类型显示
  const formatQuestionType = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return <Tag color="blue">单选题</Tag>;
      case 'MULTIPLE_CHOICE':
        return <Tag color="purple">多选题</Tag>;
      case 'PROGRAMMING':
        return <Tag color="green">编程题</Tag>;
      default:
        return <Tag>未知类型</Tag>;
    }
  };

  // 格式化难度显示
  const formatDifficulty = (difficulty: number) => {
    const colors = ['', 'green', 'cyan', 'blue', 'orange', 'red'];
    const levels = ['', '简单', '较简单', '中等', '较难', '困难'];
    return <Tag color={colors[difficulty]}>{levels[difficulty]}</Tag>;
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setIsPreview(false);
    setGenerationState('idle');
    message.destroy('aiGenerate'); // 清除所有加载消息
    onCancel();
  };

  // 样式定义
  const styles = {
    aiHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '24px',
    },
    aiIcon: {
      fontSize: '28px',
      marginRight: '12px',
      color: '#1890ff',
    },
    aiTitle: {
      fontSize: '22px',
      fontWeight: 500,
      marginRight: '12px',
    },
    aiLimits: {
      backgroundColor: '#f0f0f0',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '14px',
      color: '#666',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginTop: '28px',
      position: 'relative' as const,
    },
    generateButton: {
      width: '220px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
    },
    arrowIcon: {
      marginLeft: '10px',
      fontSize: '16px',
    },
    tipText: {
      color: '#999',
      fontSize: '14px',
      marginTop: '10px',
    },
    generateAnimation: {
      position: 'absolute' as const,
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '220px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1890ff',
      color: 'white',
      borderRadius: '2px',
      boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      opacity: 0,
      transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
      pointerEvents: 'none' as const,
      zIndex: 1,
    },
    startGeneration: {
      opacity: 1,
      transform: 'translateX(-50%) scale(1.05)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    generatingState: {
      opacity: 1, 
      transform: 'translateX(-50%)',
    },
    successState: {
      opacity: 1,
      transform: 'translateX(-50%) scale(1.05)',
      backgroundColor: '#52c41a',
    },
    iconSpin: {
      animation: 'spin 1.2s infinite linear',
      fontSize: '18px',
    },
    iconSuccess: {
      animation: 'bounce 0.5s',
      fontSize: '18px',
    },
    generationText: {
      marginLeft: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
    },
  };

  // 渲染生成表单
  const renderGenerateForm = () => (
    <div>
      <div style={styles.aiHeader}>
        <RobotOutlined style={styles.aiIcon} />
        <span style={styles.aiTitle}>AI 生成试题</span>
      </div>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{ count: 3, type: CustomQuestionType.SINGLE_CHOICE, difficulty: 3, language: 'java' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="type"
              label="题型："
              rules={[{ required: true, message: '请选择题型' }]}
            >
              <Select>
                <Option value={CustomQuestionType.SINGLE_CHOICE}>单选题</Option>
                <Option value={CustomQuestionType.MULTIPLE_CHOICE}>多选题</Option>
                <Option value={CustomQuestionType.PROGRAMMING}>编程题</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="count"
              label="题目数量："
              rules={[{ required: true, message: '请选择生成数量' }]}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="language"
              label="语言："
              rules={[{ required: true, message: '请选择编程语言' }]}
            >
              <Select defaultValue="java">
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <Option key={lang.value} value={lang.value}>{lang.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="difficulty"
              label="难度等级："
              rules={[{ required: true, message: '请选择难度等级' }]}
              initialValue={3}
            >
              <Select>
                <Option value={1}>简单</Option>
                <Option value={2}>较简单</Option>
                <Option value={3}>中等</Option>
                <Option value={4}>较难</Option>
                <Option value={5}>困难</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="prompt"
              label="提示词："
              tooltip="输入描述性文字，指导AI生成相关题目，例如：'Java面向对象编程基础'"
              rules={[{ required: false, message: '请输入提示词' }]}
            >
              <Input.TextArea
                placeholder="请输入提示词，描述你想要生成的题目内容，如：'Java面向对象编程基础'"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <div style={styles.buttonContainer}>
          <Button 
            type="primary" 
            onClick={handleGenerate} 
            loading={loading && generationState === 'idle'}
            style={{
              ...styles.generateButton,
              opacity: generationState !== 'idle' ? 0 : 1
            }}
          >
            生成并预览题库
            <ArrowRightOutlined style={styles.arrowIcon} />
          </Button>

          {/* 生成过程动画 */}
          <div 
            style={{
              ...styles.generateAnimation,
              ...(generationState === 'start' ? styles.startGeneration : {}),
              ...(generationState === 'generating' ? styles.generatingState : {}),
              ...(generationState === 'success' ? styles.successState : {})
            }}
          >
            {generationState === 'start' && (
              <>
                <ThunderboltOutlined style={{ fontSize: '18px' }} />
                <span style={styles.generationText}>初始化生成...</span>
              </>
            )}
            {generationState === 'generating' && (
              <>
                <LoadingOutlined style={{ ...styles.iconSpin, fontSize: '18px' }} />
                <span style={styles.generationText}>正在生成题目...</span>
              </>
            )}
            {generationState === 'success' && (
              <>
                <CheckCircleOutlined style={{ ...styles.iconSuccess, fontSize: '18px' }} />
                <span style={styles.generationText}>生成完成！</span>
              </>
            )}
          </div>
          
          <div style={styles.tipText}>点击调用ai接口，右侧查看结果</div>
        </div>
      </Form>

      {/* 添加一些CSS动画 */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  );

  // 渲染预览内容
  const renderPreview = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Checkbox
            onChange={handleSelectAll}
            checked={selectedQuestions.length === generatedQuestions.length}
            indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < generatedQuestions.length}
          >
            全选
          </Checkbox>
          <span>已选择 {selectedQuestions.length} 题</span>
        </Space>
        <Button type="primary" onClick={handleAddToBank} loading={addingToBank}>
          添加到题库
        </Button>
      </div>

      <Divider />

      {generatedQuestions.map((question, index) => (
        <Card
          key={index}
          style={{ 
            marginBottom: 16,
            animation: `fadeIn 0.5s ease-in-out ${0.1 + index * 0.1}s both`
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={selectedQuestions.includes(index)}
                onChange={() => handleSelectQuestion(index)}
                style={{ marginRight: 8 }}
              />
              <span>{question.title}</span>
            </div>
          }
          extra={
            <Space>
              {formatQuestionType(question.type)}
              {formatDifficulty(question.difficulty)}
            </Space>
          }
        >
          <div>
            <p><strong>题目内容：</strong>{question.content}</p>
            
            {/* 渲染选项 - 只显示ABCD四个选项 */}
            {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && 
              question.options && (
              <div style={{ marginTop: 8 }}>
                <p><strong>选项：</strong></p>
                <ul>
                  {JSON.parse(question.options)
                    .filter((option: any) => ['A', 'B', 'C', 'D'].includes(option.label))
                    .map((option: any, i: number) => (
                    <li key={i}>
                      {option.label}. {option.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ marginTop: 8 }}>
              <p><strong>答案：</strong>{question.answer}</p>
            </div>
            
            {question.analysis && (
              <div style={{ marginTop: 8 }}>
                <p><strong>解析：</strong>{question.analysis}</p>
              </div>
            )}
          </div>
        </Card>
      ))}

      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );

  return (
    <Modal
      title="生成题目"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={isPreview ? [
        <Button key="back" onClick={handleBackToForm}>
          返回修改
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="add"
          type="primary"
          loading={addingToBank}
          onClick={handleAddToBank}
          disabled={selectedQuestions.length === 0}
        >
          添加到题库
        </Button>,
      ] : [
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="generate"
          type="primary"
          loading={loading && generationState === 'idle'}
          onClick={handleGenerate}
          disabled={generationState !== 'idle'}
        >
          生成并预览题目
        </Button>,
      ]}
    >
      {isPreview ? renderPreview() : renderGenerateForm()}
    </Modal>
  );
};

export default AIGenerateForm; 