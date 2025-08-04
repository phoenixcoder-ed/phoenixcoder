// React及相关库
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// 第三方库
import { Admin, Resource, ListGuesser } from 'react-admin';

// 本地组件
import { Layout } from './Layout';
import EnvInfo from './shared/components/EnvInfo';
import Dashboard from './app/Dashboard';
import UserManagement from './features/UserManagement';
import InterviewQuestions from './features/interviewQuestions/InterviewQuestions';
import KnowledgeBase from './features/KnowledgeBase';

// 认证相关
import { authProvider, LoginPage } from './features/auth';

// 主题相关
import { ThemeProviderWrapper } from './theme';

export const App = () => (
  <Router>
    <ThemeProviderWrapper>
      <Admin
        layout={Layout}
        authProvider={authProvider}
        loginPage={LoginPage}
        dashboard={Dashboard}
      >
        {/* 这里可以添加更多资源 */}
        <Resource name="users" list={UserManagement} />
        <Resource name="interview_questions" list={InterviewQuestions} />
        <Resource name="knowledge_base" list={KnowledgeBase} />
        <EnvInfo />
      </Admin>
    </ThemeProviderWrapper>
  </Router>
);
