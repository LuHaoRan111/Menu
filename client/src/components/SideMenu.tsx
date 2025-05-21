import React from 'react';
import { Menu } from 'antd';
import { HeartOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const SideMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      key: '/',
      icon: <HeartOutlined />,
      label: '学习心得',
    },
    {
      key: '/question-bank',
      icon: <DatabaseOutlined />,
      label: '题库管理',
    },
  ];

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={items}
      onClick={({ key }) => navigate(key)}
    />
  );
};

export default SideMenu; 