import React, { useState, useEffect } from 'react';
import { Card, Spin, Result, Typography } from 'antd';
import { marked } from 'marked';
import { getStudyNote } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface StudyNoteProps {
  hideHeader?: boolean;
}

const StudyNote: React.FC<StudyNoteProps> = ({ hideHeader = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudyNote = async () => {
      try {
        setLoading(true);
        const response = await getStudyNote();
        if (response.data.code === 0) {
          setContent(response.data.data);
        } else {
          setError(response.data.msg || '获取学习心得失败');
        }
      } catch (err) {
        console.error('获取学习心得失败:', err);
        setError('获取学习心得失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyNote();
  }, []);

  // 使用marked将Markdown转换为HTML
  const renderMarkdown = (): { __html: string } => {
    if (!content) return { __html: '' };
    return { __html: marked.parse(content) as string };
  };

  // 处理导航到题库管理
  const handleNavigateToQuestionBank = () => {
    navigate('/question-bank');
  };

  // 渲染页面内容
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      );
    }

    if (error) {
      return <Result status="error" title="加载失败" subTitle={error} />;
    }

    if (!content) {
      return (
        <div className="study-note-placeholder">
          <div style={{ textAlign: 'center' }}>
            <div style={{ border: '2px solid #eee', width: '300px', height: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#666', fontSize: '16px' }}>
                这里放学习心得，至少100字
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="markdown-content" 
        dangerouslySetInnerHTML={renderMarkdown()} 
      />
    );
  };

  return (
    <div className="question-bank-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 金山WPS风格标题栏，根据hideHeader属性决定是否显示 */}
      {!hideHeader && (
        <>
          <div className="kingsoft-header">
            <div className="logo-container">
              <img src="https://www.wps.cn/favicon.ico" alt="logo" style={{ height: '24px', marginRight: '8px' }} />
              <span style={{ fontWeight: 'bold' }}>金山办公</span>
              <span style={{ marginLeft: '20px', fontWeight: 'normal' }}>武汉科技大学 张三 大作业</span>
            </div>
          </div>
          
          {/* 学习心得选项卡 */}
          <div className="kingsoft-tab">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="kingsoft-tab-item kingsoft-tab-active">
                学习心得
              </div>
              <div 
                className="kingsoft-tab-item kingsoft-tab-inactive"
                onClick={handleNavigateToQuestionBank}
              >
                题库管理
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 主内容区域 */}
      <div className="kingsoft-content" style={{ overflow: 'auto' }}>
        <Card 
          bordered={false} 
          bodyStyle={{ padding: '20px', overflow: 'visible' }}
          title={<Title level={4} style={{ margin: 0 }}>学习心得</Title>}
        >
          {renderContent()}
        </Card>
      </div>
    </div>
  );
};

export default StudyNote; 