declare module '*.tsx';
declare module '*.ts';
declare module '*.jsx';
declare module '*.js';

// 特别声明项目中的具体模块
declare module './components/SideMenu' {
  const SideMenu: React.FC;
  export default SideMenu;
}

declare module './pages/StudyNote' {
  const StudyNote: React.FC;
  export default StudyNote;
}

declare module './pages/QuestionBank' {
  const QuestionBank: React.FC;
  export default QuestionBank;
}

declare module './App' {
  const App: React.FC;
  export default App;
} 