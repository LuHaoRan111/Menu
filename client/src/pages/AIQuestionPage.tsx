import React, { useState } from 'react';
import { Card, Row, Col, Divider, Button, message, Checkbox, Space, Tag } from 'antd';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { addQuestion } from '../utils/api';
import { CodeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// 题目类型枚举（只包含单选、多选、编程题）
enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE', // 单选题
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多选题
  PROGRAMMING = 'PROGRAMMING', // 编程题
}

interface Question {
  id: number;
  title: string;
  type: string;
  content: string;
  options: string | null;
  answer: string;
  analysis: string | null;
}

const AIQuestionPage: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [addingToBank, setAddingToBank] = useState(false);
  const navigate = useNavigate();

  // 返回题库管理页面
  const handleBack = () => {
    navigate('/question-bank');
  };

  // 处理生成的题目
  const handleQuestionsGenerated = (questions: Question[]) => {
    console.log("接收到生成的题目:", questions);
    setGeneratedQuestions(questions);
    setSelectedQuestions([]); // 重置选择
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
      
      // 逐个添加题目
      const promises = questionsToAdd.map(question => {
        // 去除id等字段，添加创建人为"AI出题"
        const { id, createdTime, updatedTime, ...questionData } = question as any;
        return addQuestion({
          ...questionData,
          creator: 'AI出题'
        });
      });
      
      const results = await Promise.all(promises);
      
      if (results.every(result => result.data.code === 0)) {
        message.success(`成功添加 ${results.length} 个题目到题库`);
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

  // 渲染单选题内容
  const renderSingleChoiceContent = (question: Question) => {
    const options = question.options ? JSON.parse(question.options) : [];
    // 只保留ABCD四个选项
    const filteredOptions = options.filter((option: any) => 
      ['A', 'B', 'C', 'D'].includes(option.label)
    );
    
    return (
      <div>
        <div style={styles.questionContent}>{question.content}</div>
        <div style={styles.optionsContainer}>
          {filteredOptions.map((option: any, index: number) => (
            <div key={index} style={styles.optionItem}>
              <span style={styles.optionLabel}>{option.label}.</span>
              <span style={styles.optionContent}>{option.content}</span>
            </div>
          ))}
        </div>
        <div style={styles.answerSection}>
          <span style={styles.answerLabel}>答案：</span>
          <span style={styles.answerContent}>{question.answer}</span>
        </div>
        {question.analysis && (
          <div style={styles.analysisSection}>
            <span style={styles.analysisLabel}>解析：</span>
            <span style={styles.analysisContent}>{question.analysis}</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染多选题内容
  const renderMultipleChoiceContent = (question: Question) => {
    const options = question.options ? JSON.parse(question.options) : [];
    // 只保留ABCD四个选项
    const filteredOptions = options.filter((option: any) => 
      ['A', 'B', 'C', 'D'].includes(option.label)
    );
    
    return (
      <div>
        <div style={styles.questionContent}>{question.content}</div>
        <div style={styles.optionsContainer}>
          {filteredOptions.map((option: any, index: number) => (
            <div key={index} style={styles.optionItem}>
              <span style={styles.optionLabel}>{option.label}.</span>
              <span style={styles.optionContent}>{option.content}</span>
            </div>
          ))}
        </div>
        <div style={styles.answerSection}>
          <span style={styles.answerLabel}>答案：</span>
          <span style={styles.multiAnswerContent}>{question.answer}</span>
          <span style={styles.multiAnswerHint}>（多个选项）</span>
        </div>
        {question.analysis && (
          <div style={styles.analysisSection}>
            <span style={styles.analysisLabel}>解析：</span>
            <span style={styles.analysisContent}>{question.analysis}</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染编程题内容
  const renderProgrammingContent = (question: Question) => {
    return (
      <div>
        <div style={styles.questionContent}>{question.content}</div>
        <div style={styles.codeContainer}>
          <div style={styles.codeHeader}>
            <CodeOutlined style={{ marginRight: '8px' }} /> 代码实现
          </div>
          <pre style={styles.codeBlock}>
            <code>{question.answer}</code>
          </pre>
        </div>
        {question.analysis && (
          <div style={styles.analysisSection}>
            <span style={styles.analysisLabel}>解析：</span>
            <div style={styles.analysisContent}>{question.analysis}</div>
          </div>
        )}
      </div>
    );
  };

  // 渲染题目内容
  const renderQuestionContent = (question: Question) => {
    // 根据题目类型渲染不同的内容
    if (question.type === QuestionType.SINGLE_CHOICE) {
      return renderSingleChoiceContent(question);
    } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
      return renderMultipleChoiceContent(question);
    } else if (question.type === QuestionType.PROGRAMMING) {
      return renderProgrammingContent(question);
    }
    
    // 默认渲染
    return (
      <div>
        <div style={styles.questionContent}>{question.content}</div>
        <div style={styles.answerSection}>
          <span style={styles.answerLabel}>答案：</span>
          <span style={styles.answerContent}>{question.answer}</span>
        </div>
      </div>
    );
  };

  // 获取题目类型标签
  const getQuestionTypeTag = (type: string) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return <Tag color="blue">单选题</Tag>;
      case QuestionType.MULTIPLE_CHOICE:
        return <Tag color="purple">多选题</Tag>;
      case QuestionType.PROGRAMMING:
        return <Tag color="green">编程题</Tag>;
      default:
        return <Tag>未知类型</Tag>;
    }
  };

  const styles = {
    container: {
      padding: '20px',
      minWidth: '1200px',
      overflow: 'auto'
    },
    pageHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
    },
    backButton: {
      marginRight: '10px',
    },
    pageTitle: {
      fontSize: '18px',
      fontWeight: 500,
    },
    leftPanel: {
      marginRight: '20px',
      minWidth: '350px',
    },
    rightPanel: {
      background: '#f9f9f9',
      padding: '20px',
      borderRadius: '4px',
      minHeight: '600px',
      minWidth: '600px',
      overflow: 'visible'
    },
    resultTitle: {
      fontSize: '16px',
      fontWeight: 500,
      marginBottom: '16px',
    },
    questionCard: {
      marginBottom: '16px',
    },
    questionTitle: {
      fontSize: '16px',
      fontWeight: 500,
    },
    questionContent: {
      marginTop: '10px',
      lineHeight: '1.6',
    },
    optionsContainer: {
      marginTop: '12px',
    },
    optionItem: {
      marginTop: '8px',
    },
    optionLabel: {
      fontWeight: 500,
      marginRight: '8px',
    },
    optionContent: {
      lineHeight: '1.6',
    },
    answerSection: {
      marginTop: '16px',
      paddingTop: '12px',
      borderTop: '1px dashed #e8e8e8',
    },
    answerLabel: {
      fontWeight: 500,
      marginRight: '8px',
    },
    answerContent: {
      color: '#1890ff',
    },
    multiAnswerContent: {
      color: '#722ed1',
      fontWeight: 500,
    },
    multiAnswerHint: {
      marginLeft: '8px',
      fontSize: '12px',
      color: '#888',
    },
    codeContainer: {
      marginTop: '16px',
      border: '1px solid #e8e8e8',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    codeHeader: {
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #e8e8e8',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
    },
    codeBlock: {
      backgroundColor: '#f8f8f8',
      padding: '12px',
      margin: 0,
      overflow: 'visible',
      maxHeight: '400px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
      borderRadius: '0 0 4px 4px',
    },
    analysisSection: {
      marginTop: '12px',
    },
    analysisLabel: {
      fontWeight: 500,
      marginRight: '8px',
    },
    analysisContent: {
      color: '#52c41a',
    },
    aiGeneratedRegion: {
      color: '#999',
      textAlign: 'center' as const,
      padding: '40px 0',
      fontSize: '16px',
    },
    actionBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    selectedCount: {
      marginLeft: '8px',
      color: '#666',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={styles.backButton}
        >
          返回题库
        </Button>
        <div style={styles.pageTitle}>AI智能出题</div>
      </div>
      <Row gutter={24} style={{ minWidth: '1200px' }}>
        {/* 左侧面板 - AI生成控制器 */}
        <Col span={8} style={{ minWidth: '350px' }}>
          <div style={styles.leftPanel}>
            <AIQuestionGenerator onGenerated={handleQuestionsGenerated} />
          </div>
        </Col>
        
        {/* 右侧面板 - 生成结果 */}
        <Col span={16} style={{ minWidth: '600px' }}>
          <div style={styles.rightPanel}>
            {generatedQuestions.length > 0 ? (
              <div>
                <div style={styles.actionBar}>
                  <div style={styles.resultTitle}>AI生成题目结果</div>
                  <div>
                    <Space>
                      <div style={styles.checkboxContainer}>
                        <Checkbox
                          onChange={handleSelectAll}
                          checked={selectedQuestions.length === generatedQuestions.length}
                          indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < generatedQuestions.length}
                        >
                          全选
                        </Checkbox>
                        <span style={styles.selectedCount}>已选择 {selectedQuestions.length} 题</span>
                      </div>
                      <Button 
                        type="primary" 
                        onClick={handleAddToBank} 
                        loading={addingToBank}
                        disabled={selectedQuestions.length === 0}
                      >
                        添加到题库
                      </Button>
                    </Space>
                  </div>
                </div>
                <Divider />
                
                {/* 题目列表 */}
                {generatedQuestions.map((question, index) => (
                  <Card 
                    key={index} 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={selectedQuestions.includes(index)}
                          onChange={() => handleSelectQuestion(index)}
                          style={{ marginRight: 8 }}
                        />
                        <div style={styles.questionTitle}>{`${index + 1}. ${question.title}`}</div>
                      </div>
                    }
                    style={styles.questionCard}
                    extra={getQuestionTypeTag(question.type)}
                  >
                    {renderQuestionContent(question)}
                  </Card>
                ))}
              </div>
            ) : (
              <div style={styles.aiGeneratedRegion}>
                AI 生成区域
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AIQuestionPage; 