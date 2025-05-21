import React from 'react';
import { Tag } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { Question, QuestionType } from '../types';

interface QuestionPreviewContentProps {
  question: Question;
}

const QuestionPreviewContent: React.FC<QuestionPreviewContentProps> = ({ question }) => {
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

  return (
    <div className="question-preview">
      <div style={{ marginBottom: '16px' }}>
        <Tag color={
          question.type === QuestionType.SINGLE_CHOICE ? 'blue' :
          question.type === QuestionType.MULTIPLE_CHOICE ? 'purple' :
          question.type === QuestionType.PROGRAMMING ? 'green' : 'default'
        }>
          {formatQuestionType(question.type)}
        </Tag>
        
        {/* 添加难度等级标签 */}
        {question.difficulty && (
          <Tag color={
            question.difficulty === 1 ? 'green' :
            question.difficulty === 2 ? 'cyan' :
            question.difficulty === 3 ? 'blue' :
            question.difficulty === 4 ? 'orange' :
            question.difficulty === 5 ? 'red' : 'default'
          } style={{ marginLeft: '8px' }}>
            难度: {
              question.difficulty === 1 ? '简单' :
              question.difficulty === 2 ? '较简单' :
              question.difficulty === 3 ? '中等' :
              question.difficulty === 4 ? '较难' :
              question.difficulty === 5 ? '困难' : '未知'
            }
          </Tag>
        )}
        
        {/* 添加语言标签 */}
        {question.language && (
          <Tag color="geekblue" style={{ marginLeft: '8px' }}>
            语言: {question.language}
          </Tag>
        )}
        
        {question.creator && (
          <Tag color="cyan" style={{ marginLeft: '8px' }}>创建人: {question.creator}</Tag>
        )}
      </div>
      
      <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>{question.title}</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{question.content}</div>
      </div>
      
      {question.options && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>选项：</div>
          {renderOptions(question.options)}
        </div>
      )}
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>答案：</div>
        {question.type === QuestionType.PROGRAMMING ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <CodeOutlined style={{ marginRight: '8px' }} /> 代码实现（{question.language || '未知语言'}）
            </div>
            {renderCode(question.answer)}
          </div>
        ) : (
          <div>{question.answer}</div>
        )}
      </div>
      
      {question.analysis && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>解析：</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{question.analysis}</div>
        </div>
      )}
    </div>
  );
};

export default QuestionPreviewContent; 