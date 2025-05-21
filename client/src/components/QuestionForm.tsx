import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Radio,
  Checkbox,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { addQuestion, updateQuestion } from '../utils/api';
import { Question } from '../types';
import { useApi } from '../hooks/useApi';

const { Option } = Select;
const { TextArea } = Input;

// 题目类型枚举（只包含单选、多选、编程题）
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

interface QuestionFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (question?: Question) => void;
  question: Question | null;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  question,
}) => {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 使用API钩子处理添加操作
  const { execute: executeAdd } = useApi<Omit<Question, 'id' | 'createdTime' | 'updatedTime'>, Question>(addQuestion, {
    showSuccessMessage: false,
    onSuccess: (response) => {
      if (response.code === 0 && response.data) {
        message.success('添加题目成功');
        // 将新创建的题目数据传递给onSuccess回调
        onSuccess(response.data);
      }
    }
  });

  // 使用API钩子处理更新操作
  const { execute: executeUpdate } = useApi<{id: number, question: Partial<Omit<Question, 'id' | 'createdTime' | 'updatedTime'>>}, Question>(
    // 适配API函数类型
    (params) => updateQuestion(params.id, params.question),
    {
      showSuccessMessage: false,
      onSuccess: (response) => {
        if (response.code === 0 && response.data) {
          message.success('更新题目成功');
          // 将更新后的题目数据传递给onSuccess回调
          onSuccess(response.data);
        }
      }
    }
  );

  // 当编辑题目时，加载题目数据
  useEffect(() => {
    if (visible && question) {
      const formData = {
        ...question,
        options: question.options ? JSON.parse(question.options) : [],
      };
      form.setFieldsValue(formData);
      setQuestionType(question.type);
    } else if (visible) {
      form.resetFields();
      // 设置默认题型为单选题
      const defaultType = CustomQuestionType.SINGLE_CHOICE;
      setQuestionType(defaultType);
      form.setFieldsValue({ type: defaultType });
      
      // 为单选题初始化ABCD四个选项
      form.setFieldsValue({
        options: [
          { label: 'A', content: '' },
          { label: 'B', content: '' },
          { label: 'C', content: '' },
          { label: 'D', content: '' },
        ],
      });
    }
  }, [visible, question, form]);

  // 处理类型变化
  const handleTypeChange = (changedValues: any) => {
    if (changedValues.type) {
      setQuestionType(changedValues.type);
      
      // 如果变成了选择题，但options为空，则初始化ABCD四个选项
      if ((changedValues.type === CustomQuestionType.SINGLE_CHOICE || changedValues.type === CustomQuestionType.MULTIPLE_CHOICE) && 
          (!form.getFieldValue('options') || form.getFieldValue('options').length === 0)) {
        form.setFieldsValue({
          options: [
            { label: 'A', content: '' },
            { label: 'B', content: '' },
            { label: 'C', content: '' },
            { label: 'D', content: '' },
          ],
        });
      }
      
      // 确保有语言值
      if (!form.getFieldValue('language')) {
        form.setFieldValue('language', 'java');
      }
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 处理选项数据
      if (values.options) {
        values.options = JSON.stringify(values.options);
      }
      
      if (question) {
        // 更新题目
        await executeUpdate({ id: question.id, question: values });
      } else {
        // 添加题目
        await executeAdd(values);
      }
      // 不需要在这里手动调用 onSuccess，因为在 API 钩子的 onSuccess 回调中已经调用了
    } catch (error) {
      console.error('表单提交错误:', error);
      message.error('提交失败，请检查表单');
      setLoading(false);
    }
  };

  // 渲染不同题型的答案输入框
  const renderAnswerField = () => {
    if (!questionType) return null;

    switch (questionType) {
      case CustomQuestionType.SINGLE_CHOICE:
        const options = form.getFieldValue('options') || [];
        const singleAnswer = form.getFieldValue('answer');
        return (
          <Form.Item
            name="answer"
            label="答案"
            rules={[{ required: true, message: '请选择答案' }]}
          >
            <Radio.Group 
              onChange={(e) => {
                form.setFieldsValue({ answer: e.target.value });
              }}
              value={singleAnswer}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}
            >
              {options.map((option: { label: string, content: string }) => (
                <Radio key={option.label} value={option.label}>
                  {option.label}. {option.content}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
      case CustomQuestionType.MULTIPLE_CHOICE:
        const multiOptions = form.getFieldValue('options') || [];
        const multiAnswers = form.getFieldValue('answer') || [];
        return (
          <Form.Item
            name="answer"
            label="答案"
            rules={[{ required: true, message: '请选择答案' }]}
          >
            <Checkbox.Group 
              value={multiAnswers}
              onChange={(checkedValues) => {
                form.setFieldsValue({ answer: checkedValues });
              }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}
            >
              {multiOptions.map((option: { label: string, content: string }) => (
                <Checkbox key={option.label} value={option.label}>
                  {option.label}. {option.content}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        );
      case CustomQuestionType.PROGRAMMING:
        return (
          <Form.Item
            name="answer"
            label="代码实现"
            rules={[{ required: true, message: '请输入代码实现' }]}
          >
            <TextArea rows={8} placeholder="请输入代码实现" />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={question ? '编辑题目' : '添加题目'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          确定
        </Button>,
      ]}
      width={700}
      destroyOnClose
      className="question-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        className="animated-form"
        onValuesChange={handleTypeChange}
        initialValues={{ difficulty: 3, type: CustomQuestionType.SINGLE_CHOICE, language: 'java' }}
      >
        <Form.Item
          name="title"
          label="题目标题"
          rules={[{ required: true, message: '请输入题目标题' }]}
        >
          <Input placeholder="请输入题目标题" />
        </Form.Item>

        <Form.Item
          name="type"
          label="题目类型"
          rules={[{ required: true, message: '请选择题目类型' }]}
        >
          <Select placeholder="请选择题目类型" onChange={handleTypeChange}>
            <Option value={CustomQuestionType.SINGLE_CHOICE}>单选题</Option>
            <Option value={CustomQuestionType.MULTIPLE_CHOICE}>多选题</Option>
            <Option value={CustomQuestionType.PROGRAMMING}>编程题</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="language"
          label="编程语言"
          rules={[{ required: true, message: '请选择编程语言' }]}
          initialValue="java"
        >
          <Select placeholder="请选择编程语言" defaultValue="java">
            {PROGRAMMING_LANGUAGES.map(lang => (
              <Option key={lang.value} value={lang.value}>{lang.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="content"
          label="题目内容"
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <TextArea rows={4} placeholder="请输入题目内容" />
        </Form.Item>

        {(questionType === CustomQuestionType.SINGLE_CHOICE || questionType === CustomQuestionType.MULTIPLE_CHOICE) && (
          <Form.List name="options">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'label']}
                      rules={[{ required: true, message: '请输入选项标签' }]}
                    >
                      <Input placeholder="选项标签" style={{ width: 80 }} disabled />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'content']}
                      rules={[{ required: true, message: '请输入选项内容' }]}
                    >
                      <Input placeholder="选项内容" style={{ width: 350 }} />
                    </Form.Item>
                    {fields.length > 4 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )}
                  </Space>
                ))}
                {fields.length < 4 && (
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ label: String.fromCharCode(65 + fields.length), content: '' })}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加选项
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        )}

        {renderAnswerField()}

        <Form.Item
          name="analysis"
          label="题目解析"
        >
          <TextArea rows={3} placeholder="请输入题目解析（选填）" />
        </Form.Item>

        <Form.Item
          name="difficulty"
          label="难度系数"
          rules={[{ required: true, message: '请选择难度系数' }]}
        >
          <Select>
            <Option value={1}>简单</Option>
            <Option value={2}>较简单</Option>
            <Option value={3}>中等</Option>
            <Option value={4}>较难</Option>
            <Option value={5}>困难</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="creator"
          label="创建人"
        >
          <Input placeholder="请输入创建人（选填）" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionForm; 