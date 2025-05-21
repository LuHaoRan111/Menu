import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
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
  Col
} from 'antd';
import { generateQuestions, addQuestion } from '../utils/api';
import { Question } from '../types';
import { RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Option } = Select;

// 自定义题目类型枚举（只保留单选、多选和编程题）
enum CustomQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE', // 单选题
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多选题
  PROGRAMMING = 'PROGRAMMING', // 编程题
}

// ... existing code ... 