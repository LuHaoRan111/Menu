import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, HeartOutlined, DatabaseOutlined } from '@ant-design/icons';
import StudyNote from './pages/StudyNote';
import QuestionBank from './pages/QuestionBank';
import AIQuestionPage from './pages/AIQuestionPage';

const { Header, Sider } = Layout;

// 创建一个内部组件来使用路由钩子
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // ... existing code ...
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />} />
        <Route path="/study-note" element={<StudyNote />} />
        <Route path="/question-bank" element={<QuestionBank />} />
        <Route path="/ai-question-page" element={<AIQuestionPage />} />
      </Routes>
    </Router>
  );
};

export default App; 