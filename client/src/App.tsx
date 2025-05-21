import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, HeartOutlined, DatabaseOutlined } from '@ant-design/icons';
import StudyNote from './pages/StudyNote';
import QuestionBank from './pages/QuestionBank';
import AIQuestionPage from './pages/AIQuestionPage';

const { Header, Sider } = Layout;

// 金山办公SVG图标组件
const KingsoftLogo = () => (
  <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.3671 31.6121H0.602534C0.219583 31.6121 -0.0589257 31.264 0.0107016 30.9158L4.11871 9.08769C4.15353 8.84399 4.36241 8.66992 4.6061 8.66992H24.3803L20.1678 30.9507C20.0982 31.3336 19.75 31.6121 19.3671 31.6121Z"
      fill="#D20029" />
    <path
      d="M37.9577 4.70102C38.0621 4.56176 37.9577 4.3877 37.8184 4.3877H17.0695C16.791 4.3877 16.5473 4.59658 16.5125 4.84027L12.5089 26.0766L12.3696 26.7381C12.4741 26.5292 12.683 26.2507 13.1355 26.2507C13.24 26.2507 13.2052 26.2507 13.2052 26.2507H33.7104C33.8845 26.2507 34.0237 26.0766 33.9541 25.9025L29.8809 15.6673C29.8113 15.4584 29.8461 15.2147 29.9853 15.0059L37.9577 4.70102Z"
      fill="#FF0040" />
    <path
      d="M20.4113 29.7672L21.0728 26.251H13.1005C12.1605 26.251 11.9516 27.5739 12.8568 27.8872L19.541 30.0109C19.9587 30.1501 20.2373 30.5679 20.1328 31.0204L20.4113 29.7672Z"
      fill="#831A2D" />
    <path
      d="M81.8499 18.4478V9.58324L84.1874 9.20864V20.1709C84.1874 20.2938 84.0885 20.3927 83.9657 20.3927H70.8277C69.9526 20.3927 69.2454 19.6824 69.2454 18.8104V9.58324L71.5799 9.20864V18.241C71.5799 18.3549 71.6728 18.4478 71.7867 18.4478H75.5477V7.3746L77.8822 7V18.4478H81.8499Z"
      fill="white" />
    <path d="M104.665 13.9586L107.691 7.47051H110.296L107.269 13.9586H104.665Z" fill="white" />
    <path
      d="M117.236 15.0854H114.632L116.193 18.4268H109.106L111.644 13.0146H109.034L106.352 18.7415C105.992 19.5086 106.553 20.3927 107.401 20.3927H117.901C118.75 20.3927 119.31 19.5116 118.95 18.7415L117.236 15.0854Z"
      fill="white" />
    <path d="M117.611 7.47052L120.638 13.9586H118.03L115.007 7.47052H117.611Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd"
      d="M94.8111 22.5325C95.6023 22.5325 96.2765 22.8142 96.8339 23.3746C97.3913 23.9409 97.67 24.6212 97.67 25.4184C97.67 25.9368 97.5442 26.4193 97.2895 26.8658C97.0287 27.3213 96.6811 27.675 96.2466 27.9237C95.812 28.1784 95.3325 28.3043 94.8141 28.3043C94.0289 28.3043 93.3577 28.0226 92.8002 27.4622C92.2488 26.8958 91.9731 26.2155 91.9731 25.4184C91.9731 24.8999 92.102 24.4174 92.3567 23.9709C92.6114 23.5244 92.9561 23.1738 93.3906 22.913C93.8281 22.6583 94.3016 22.5325 94.8111 22.5325ZM93.2048 25.4184C93.2048 25.9008 93.3547 26.3084 93.6573 26.6411C93.96 26.9737 94.3436 27.1415 94.8111 27.1415C95.2786 27.1415 95.6652 26.9737 95.9739 26.6411C96.2825 26.3174 96.4354 25.9098 96.4354 25.4184C96.4354 24.9269 96.2825 24.5163 95.9739 24.1927C95.6652 23.86 95.2786 23.6922 94.8111 23.6922C94.3496 23.6922 93.966 23.86 93.6663 24.1927C93.3577 24.5163 93.2048 24.9239 93.2048 25.4184Z"
      fill="white" />
    <path
      d="M54.7349 22.6432L52.4124 25.4273H52.4064L54.7349 28.2113H53.2156L51.2347 25.8408V28.2113H50V22.6462H51.2347V25.0167L53.2216 22.6432H54.7349Z"
      fill="white" />
    <path d="M55.4841 28.2113V22.6493H56.7068V28.2113H55.4841Z" fill="white" />
    <path
      d="M61.4807 22.6523V26.3203L59.1013 22.6523H57.8486V28.2143H59.0204V24.5642L61.4058 28.2143H62.6525V22.6523H61.4807Z"
      fill="white" />
    <path
      d="M71.6639 23.6023C71.4481 23.6023 71.2503 23.6562 71.1125 23.7611C70.9866 23.869 70.9267 24.0008 70.9267 24.1597C70.9267 24.3365 70.9986 24.4653 71.1394 24.5522C71.2863 24.6421 71.559 24.762 71.9606 24.9119C72.5779 25.1366 73.0094 25.3854 73.2552 25.6641C73.4889 25.9398 73.6058 26.2934 73.6058 26.7189C73.6058 27.1655 73.417 27.549 73.0364 27.8697C72.6558 28.1784 72.1584 28.3342 71.538 28.3342C71.1964 28.3342 70.8308 28.2653 70.4382 28.1274C70.0576 27.9956 69.7369 27.8158 69.4762 27.591L70.1685 26.7489C70.648 27.0995 71.1065 27.2643 71.568 27.2643C71.8347 27.2643 72.0355 27.2164 72.1703 27.1205C72.3052 27.0246 72.3741 26.9047 72.3741 26.7609C72.3741 26.5691 72.2992 26.4252 72.1464 26.3293C72.0205 26.2394 71.8077 26.1375 71.5021 26.0267C71.1275 25.8888 70.8158 25.754 70.5671 25.6281C70.3183 25.4902 70.1085 25.3044 69.9407 25.0767C69.7729 24.8369 69.689 24.5433 69.689 24.1986C69.689 23.7251 69.8748 23.3266 70.2434 23.0089C70.612 22.6942 71.0885 22.5384 71.6669 22.5384C72.3082 22.5384 72.8926 22.6942 73.426 23.0089L72.9016 23.9229C72.4221 23.6712 72.0505 23.6023 71.6639 23.6023Z"
      fill="white" />
    <path fillRule="evenodd" clipRule="evenodd"
      d="M77.0191 22.5325C77.8133 22.5325 78.4905 22.8142 79.0509 23.3805C79.6113 23.9499 79.8901 24.6362 79.8901 25.4334C79.8901 25.9548 79.7612 26.4403 79.5065 26.8868C79.2457 27.3453 78.8951 27.6989 78.4576 27.9507C78.02 28.2054 77.5406 28.3343 77.0161 28.3343C76.228 28.3343 75.5507 28.0526 74.9933 27.4862C74.4389 26.9168 74.1602 26.2305 74.1602 25.4334C74.1602 24.9119 74.289 24.4264 74.5438 23.9799C74.7985 23.5334 75.1461 23.1798 75.5837 22.916C76.0302 22.6613 76.5067 22.5325 77.0191 22.5325ZM75.4039 25.4333C75.4039 25.9188 75.5567 26.3294 75.8594 26.665C76.1621 27.0007 76.5486 27.1685 77.0191 27.1685C77.4896 27.1685 77.8792 27.0007 78.1879 26.665C78.4966 26.3414 78.6524 25.9308 78.6524 25.4333C78.6524 24.9389 78.4966 24.5283 78.1879 24.2016C77.8792 23.866 77.4896 23.6982 77.0191 23.6982C76.5546 23.6982 76.1711 23.866 75.8684 24.2016C75.5567 24.5283 75.4039 24.9359 75.4039 25.4333Z"
      fill="white" />
    <path
      d="M81.9219 24.8969H84.1935L83.9927 25.9517H81.9219V28.2113H80.7022V22.6493H84.3823L84.1815 23.7191H81.9219V24.8969Z"
      fill="white" />
    <path
      d="M99.6659 24.8969V23.7191H101.926L102.126 22.6493H98.4462V28.2113H99.6659V25.9517H101.737L101.938 24.8969H99.6659Z"
      fill="white" />
    <path
      d="M104.107 24.8969H106.379L106.178 25.9517H104.107V28.2113H102.887V22.6493H106.568L106.367 23.7191H104.107V24.8969Z"
      fill="white" />
    <path d="M87.6068 28.2113V23.7221H89.0783L89.285 22.6523H84.9307V23.7221H86.3871V28.2113H87.6068Z" fill="white" />
    <path d="M107.323 28.2113V22.6493H108.542V28.2113H107.323Z" fill="white" />
    <path
      d="M109.412 25.4483C109.412 27.0576 110.64 28.3313 112.294 28.3313C113.379 28.3313 114.024 27.9477 114.599 27.3303L113.862 26.5871C113.421 26.9887 112.975 27.1925 112.333 27.1925C111.368 27.1925 110.682 26.3923 110.682 25.4304V25.4154C110.682 24.4534 111.386 23.6682 112.333 23.6682C112.897 23.6682 113.376 23.8421 113.841 24.2316L114.56 23.3985C114.039 22.8861 113.403 22.5325 112.342 22.5325C110.616 22.5325 109.412 23.8391 109.412 25.4334V25.4483Z"
      fill="white" />
    <path
      d="M115.279 28.2083V22.6493H119.13L118.908 23.7191H116.502V24.8939H119.025L118.803 25.9487H116.502V27.1385H119.013V28.2083H115.279Z"
      fill="white" />
    <path
      d="M63.5605 25.4483C63.5605 27.1056 64.7083 28.3313 66.4614 28.3313C67.5043 28.3313 68.3134 27.9327 68.9038 27.4442V25.0078H66.6831L66.4224 26.0747H67.6871V26.8748C67.3694 27.0996 66.9618 27.2105 66.5033 27.2105C65.4904 27.2105 64.7382 26.4583 64.7382 25.4334V25.4184C64.7382 24.4654 65.4245 23.6563 66.4794 23.6563C67.2316 23.6563 67.6211 23.8451 68.1216 24.1687L68.697 23.3026C68.1006 22.8052 67.4263 22.5325 66.4524 22.5325C64.7202 22.5325 63.5605 23.8391 63.5605 25.4334V25.4483Z"
      fill="white" />
    <path
      d="M100.868 12.586L103.061 13.1554V15.4959L100.868 14.9355V20.1709C100.868 20.2938 100.769 20.3927 100.646 20.3927H95.1798L95.6413 18.4418H98.5212V10.6021C98.5212 10.4823 98.4253 10.3864 98.3054 10.3864H94.2238L91.6495 20.3927H89.1862L91.7604 10.3864H88.1103V8.42647H92.2639L92.6295 7.00299H95.0929L94.7273 8.42647H99.4112C100.217 8.42647 100.868 9.07977 100.868 9.88291V12.586Z"
      fill="white" />
    <path d="M86.501 17.0603L87.8855 11.639H90.1211L88.7366 17.0603H86.501Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd"
      d="M65.1938 11.2674L66.3116 11.621V9.58321L58.3071 7.04792C58.2082 7.01795 58.1034 7.01795 58.0075 7.04792L50.003 9.58621V11.624L51.1268 11.2674V12.8827H56.9346V14.0574H51.1268V15.9304H56.9346V18.4897H54.2944L53.5722 16.6946H51.1268L51.849 18.4897H50.003V20.3957H66.3056V18.4897H64.4715L65.1938 16.6946H62.7484L62.0262 18.4897H59.374V15.9304H65.1938V14.0574H59.374V12.8827H65.1938V11.2674ZM58.1573 9.03783L64.3726 11.0097H51.9449L58.1573 9.03783Z"
      fill="white" />
  </svg>
);

// 创建一个内部组件来使用路由钩子
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [lastRoutes, setLastRoutes] = useState<{[key: string]: string}>({
    '/question-bank': '/question-bank',
    '/study-note': '/study-note'
  });
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 当路径变化时更新选中的菜单项和上次访问路径
  React.useEffect(() => {
    // 根据当前路径设置选中的菜单项
    if (location.pathname === '/' || location.pathname === '/study-note') {
      setSelectedKey('/study-note');
    } else if (location.pathname === '/question-bank' || location.pathname === '/ai-question') {
      setSelectedKey('/question-bank');
      
      // 如果当前在AI页面，记录最后访问的题库相关页面
      if (location.pathname === '/ai-question') {
        setLastRoutes(prev => ({...prev, '/question-bank': '/ai-question'}));
      } else {
        setLastRoutes(prev => ({...prev, '/question-bank': '/question-bank'}));
      }
    }
  }, [location.pathname]);

  // 处理菜单项点击，根据上次访问路径决定跳转位置
  const handleMenuClick = (key: string) => {
    // 如果有记录的上次访问路径，则跳转到该路径，否则使用默认路径
    const targetPath = lastRoutes[key] || key;
    navigate(targetPath);
  };

  return (
    <div className={collapsed ? 'layout-container sider-collapsed' : 'layout-container'}>
      {/* 注入自定义样式 */}
      <style>{`
        /* 全局固定布局样式 */
        body {
          margin: 0;
          padding: 0;
          overflow: auto !important;
        }
        
        /* 动画统一控制 - 优化过渡效果 */
        :root {
          --transition-speed: 0.4s;
          --transition-type: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* 固定顶部栏 */
        .fixed-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          width: 100%;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        }
        
        /* 固定侧边栏 - 优化过渡效果 */
        .fixed-sider {
          position: fixed;
          top: 64px;
          left: 0;
          bottom: 0;
          overflow: auto;
          z-index: 999;
          transition: all var(--transition-speed) var(--transition-type) !important;
          transform-origin: left;
          will-change: width, transform;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* 内容区域过渡效果优化 */
        .main-content {
          margin-top: 64px;
          margin-left: 200px;
          transition: margin-left var(--transition-speed) var(--transition-type) !important;
          height: calc(100vh - 64px);
          overflow: auto !important;
          will-change: margin-left;
          padding: 8px !important;
        }
        
        .sider-collapsed .main-content {
          margin-left: 80px;
        }
        
        /* 菜单整体过渡效果 */
        .ant-menu {
          transition: width var(--transition-speed) var(--transition-type) !important;
        }
        
        /* 菜单项基础样式 */
        .ant-menu-item {
          transition: all var(--transition-speed) var(--transition-type) !important;
          position: relative;
          overflow: hidden !important;
          white-space: nowrap;
        }
        
        /* 收起状态下菜单项样式 */
        .ant-menu-inline-collapsed .ant-menu-item {
          padding: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          width: 100% !important;
          box-sizing: border-box !important;
          height: 40px !important;
          position: relative !important;
          transition: all var(--transition-speed) var(--transition-type) !important;
        }
        
        /* 展开状态下的文字样式 */
        .ant-menu-inline .ant-menu-item .ant-menu-title-content {
          display: inline-block;
          vertical-align: middle;
          max-width: 150px; /* 根据实际文字长度调整 */
          width: auto;
          transition: max-width var(--transition-speed) var(--transition-type),
                      opacity var(--transition-speed) var(--transition-type),
                      transform var(--transition-speed) var(--transition-type) !important;
          opacity: 1;
          transform: translateX(0);
          will-change: opacity, transform, max-width;
          margin-left: 10px;
        }
        
        /* 收起状态下的文字样式 - 慢慢淡出 */
        .ant-menu-inline-collapsed .ant-menu-item .ant-menu-title-content {
          max-width: 0;
          opacity: 0;
          transform: translateX(-20px);
          margin-left: 0;
          position: absolute;
          white-space: nowrap;
          display: block !important;
          pointer-events: none;
          z-index: -1;
        }
        
        /* 展开状态下的图标位置 */
        .ant-menu-inline .ant-menu-item .anticon {
          margin-right: 10px;
          position: relative;
          transition: all var(--transition-speed) var(--transition-type) !important;
        }
        
        /* 收起状态下的图标位置 */
        .ant-menu-inline-collapsed .ant-menu-item .anticon {
          margin: 0 !important;
          position: absolute !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          line-height: 1 !important;
          font-size: 18px !important;
          transition: all var(--transition-speed) var(--transition-type) !important;
          will-change: transform;
        }
        
        /* 选中菜单项的高亮样式 */
        .ant-menu-dark .ant-menu-item-selected {
          background-color: #0066ff !important;
          color: white !important;
          font-weight: bold !important;
          border-radius: 0 !important;
          transition: all var(--transition-speed) var(--transition-type) !important;
        }
        
        /* 悬浮样式 */
        .ant-menu-item:hover {
          color: white !important;
          background-color: rgba(0, 102, 255, 0.5) !important;
        }
        
        /* 底部折叠按钮容器 */
        .collapse-button-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40px;
          z-index: 10;
        }
        
        /* 底部折叠按钮样式 */
        .collapse-button-container button {
          transition: all var(--transition-speed) var(--transition-type) !important;
          transform: none !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .collapse-button-container button:hover {
          background-color: #333 !important;
        }
        
        .collapse-button-container button .anticon {
          font-size: 18px !important;
          margin: 0 !important;
        }
        
        /* 给底部留出空间 */
        .menu-container {
          height: calc(100% - 40px) !important; 
          overflow-y: auto !important;
          overflow-x: hidden !important;
          position: relative !important;
        }
        
        /* 移除默认滚动条 */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          display: block !important;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 3px;
          display: block !important;
        }
        
        ::-webkit-scrollbar-track {
          background: #f5f5f5;
          display: block !important;
        }
        
        /* 图标动画效果 */
        .anticon {
          transition: all var(--transition-speed) var(--transition-type) !important;
          will-change: transform;
        }
        
        /* 彻底禁用Tooltip */
        .ant-tooltip {
          display: none !important;
        }
        .ant-tooltip-open {
          display: none !important;
        }
      `}</style>
      
      {/* 顶部标题栏 - 黑色背景 */}
      <Header className="kingsoft-header fixed-header" style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', height: 64 }}>
        <div className="logo-container">
          <KingsoftLogo />
          <span style={{ marginLeft: '20px', fontWeight: 'normal', color: '#fff' }}>中南民族大学 鲁浩然 大作业</span>
        </div>
      </Header>
      
      {/* 可收纳侧边栏 - 黑色背景 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="dark" 
        style={{ 
          borderRight: '1px solid #1f1f1f',
          backgroundColor: '#000',
          boxShadow: '1px 0 5px rgba(0, 0, 0, 0.1)'
        }}
        width={200}
        collapsedWidth={80}
        className="fixed-sider"
      >
        {/* 菜单容器 - 不包含底部按钮 */}
        <div className="menu-container">
          <Menu
            mode="inline"
            defaultSelectedKeys={[selectedKey]}
            selectedKeys={[location.pathname === '/ai-question' ? '/question-bank' : location.pathname]}
            style={{ 
              borderRight: 0, 
              backgroundColor: '#000'
            }}
            theme="dark"
            inlineCollapsed={collapsed}
            _internalDisableMenuItemTitleTooltip={true}
            items={[
              {
                key: '/study-note',
                icon: <HeartOutlined style={{ display: 'block' }} />,
                label: '学习心得',
                onClick: () => handleMenuClick('/study-note')
              },
              {
                key: '/question-bank',
                icon: <DatabaseOutlined style={{ display: 'block' }} />,
                label: '题库管理',
                onClick: () => handleMenuClick('/question-bank')
              }
            ]}
          />
        </div>
        
        {/* 底部折叠按钮 - 单独放置 */}
        <div className="collapse-button-container">
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined style={{ color: '#fff', fontSize: '18px' }} /> : 
              <MenuFoldOutlined style={{ color: '#fff', fontSize: '18px' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%',
              height: '40px',
              borderRadius: 0,
              borderTop: '1px solid #333',
              backgroundColor: '#1f1f1f',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              bottom: 0,
              left: 0,
              padding: 0,
              transition: 'all var(--transition-speed) var(--transition-type)'
            }}
          />
        </div>
      </Sider>
      
      {/* 主内容区域 */}
      <div className="main-content" style={{ background: colorBgContainer, padding: '8px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/study-note" replace />} />
          <Route path="/study-note" element={<StudyNote hideHeader={true} />} />
          <Route path="/question-bank" element={<QuestionBank hideHeader={true} />} />
          <Route path="/ai-question" element={<AIQuestionPage />} />
        </Routes>
      </div>
    </div>
  );
};

// 主App组件
const App: React.FC = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App; 