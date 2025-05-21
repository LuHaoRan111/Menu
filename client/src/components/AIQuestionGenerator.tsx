import React, { useState } from 'react';
import {
  Form,
  Select,
  Button,
  InputNumber,
  Card,
  Row,
  Col,
  message,
  Input
} from 'antd';
import { generateQuestions } from '../utils/api';
import { RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// 题目类型枚举（只包含单选、多选、编程题）
enum QuestionType {
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

interface AIQuestionGeneratorProps {
  onGenerated?: (questions: any[]) => void;
}

const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({ onGenerated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理生成题目
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      try {
        // 获取选中的语言和题目类型
        const selectedLanguage = values.language;
        const selectedType = values.type;
        const selectedDifficulty = values.difficulty || 3; // 获取难度
        
        // 构建提示词，包含语言和题目类型信息
        let prompt = '';
        
        // 根据题目类型构建不同的提示词
        if (selectedType === QuestionType.SINGLE_CHOICE) {
          prompt = `请生成关于${selectedLanguage}的单选题，每个题目只有一个正确答案`;
        } else if (selectedType === QuestionType.MULTIPLE_CHOICE) {
          prompt = `请生成关于${selectedLanguage}的多选题，每个题目可能有多个正确答案`;
        } else if (selectedType === QuestionType.PROGRAMMING) {
          prompt = `请生成关于${selectedLanguage}的编程题，包含代码实现和详细解析`;
        }
        
        // 添加难度信息到提示词
        const difficultyText = ['', '简单', '较简单', '中等', '较难', '困难'][selectedDifficulty];
        prompt = `${prompt}，题目难度为${difficultyText}级别`;
        
        // 如果用户提供了自定义提示词，则合并使用
        if (values.prompt && values.prompt.trim()) {
          prompt = `${prompt}。具体要求：${values.prompt.trim()}`;
        }
        
        console.log("生成题目的提示词:", prompt);
        console.log("题目类型:", selectedType);
        console.log("题目难度:", selectedDifficulty);
        console.log("题目语言:", selectedLanguage);
        
        // 调用API生成题目
        const response = await generateQuestions({
          prompt: prompt,
          count: values.count || 3,
          type: selectedType,
          language: selectedLanguage,
          difficulty: selectedDifficulty
        });
        
        if (response.data.code === 0) {
          // 确保生成的题目类型和难度正确，强制设置语言和难度
          const questions = response.data.data.map((question: any) => {
            const processedQuestion = {
              ...question,
              type: selectedType, // 强制设置为选择的类型
              difficulty: selectedDifficulty, // 强制设置为选择的难度，忽略API返回的可能不准确的难度
              language: selectedLanguage // 强制设置为选择的语言
            };
            
            console.log("处理后的题目:", processedQuestion);
            return processedQuestion;
          });
          
          if (onGenerated) {
            onGenerated(questions);
          }
          message.success('题目生成成功！');
        } else {
          message.error(response.data.msg || '生成题目失败');
        }
      } catch (error) {
        console.error('生成题目失败:', error);
        message.error('生成题目失败，请稍后再试');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 样式定义
  const styles = {
    aiQuestionGenerator: {
      fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
      minWidth: '320px',
      overflow: 'visible'
    },
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
    }
  };

  return (
    <div style={styles.aiQuestionGenerator}>
      <Card bordered={false} style={{ minWidth: '320px' }}>
        <div style={styles.aiHeader}>
          <RobotOutlined style={styles.aiIcon} />
          <span style={styles.aiTitle}>生成试题</span>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: QuestionType.SINGLE_CHOICE,
            count: 10,
            language: 'java',
            difficulty: 3 // 默认中等难度
          }}
          style={{ minWidth: '320px' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="题型："
                rules={[{ required: true, message: '请选择题型' }]}
              >
                <Select>
                  <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                  <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                  <Option value={QuestionType.PROGRAMMING}>编程题</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="count"
                label="数量："
                rules={[{ required: true, message: '请输入数量' }]}
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
                <Select>
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
          
          <Form.Item
            name="prompt"
            label="自定义提示词（可选）："
          >
            <TextArea 
              placeholder="可以输入更具体的题目要求，如：Java面向对象编程、Go语言并发编程等" 
              rows={2}
            />
          </Form.Item>
          
          <div style={styles.buttonContainer}>
            <Button 
              type="primary" 
              onClick={handleGenerate} 
              loading={loading}
              style={styles.generateButton}
            >
              生成并预览题库
              <ArrowRightOutlined style={styles.arrowIcon} />
            </Button>
            <div style={styles.tipText}>点击调用ai接口，右侧查看结果</div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AIQuestionGenerator; 