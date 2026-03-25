import { useState, ReactNode, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import EnterpriseDashboard from './EnterpriseDashboard';
import Courses from './Courses';
import Community from './Community';
import SpinWheel from './SpinWheel';
import EduxBot from './EduxBot';
import Notes from './Notes';
import Certificates from './Certificates';
import Leaderboard from './Leaderboard';
import Settings from './Settings';
import CreatorStudio from './CreatorStudio';
import Analytics from './Analytics';
import { View } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface LayoutProps {
  children?: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'EduX - Smart Learning Platform' }: LayoutProps) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { darkMode, toggleTheme } = useTheme();

  // Handle tab query parameter
  useEffect(() => {
    if (router.query.tab) {
      const tab = router.query.tab as string;
      if (tab === 'certificates') {
        setCurrentView(View.CERTIFICATES);
      }
      // Clear the query parameter
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router.query.tab]);

  const renderCurrentView = () => {
    if (children) {
      return children;
    }
    
    switch (currentView) {
      case View.DASHBOARD:
        return <EnterpriseDashboard setView={setCurrentView} />;
      case View.COURSES:
        return <Courses />;
      case View.COMMUNITY:
        return <Community />;
      case View.REWARDS:
        return <SpinWheel />;
      case View.NOTES:
        return <Notes />;
      case View.BOT:
        return <EduxBot />;
      case View.CERTIFICATES:
        return <Certificates />;
      case View.LEADERBOARD:
        return <Leaderboard />;
      case View.SETTINGS:
        return <Settings />;
      case View.CREATOR:
        return <CreatorStudio />;
      case View.ANALYTICS:
        return <Analytics />;
      default:
        return <EnterpriseDashboard />;
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <Sidebar
            currentView={currentView}
            setView={setCurrentView}
            expanded={sidebarExpanded}
            setExpanded={setSidebarExpanded}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
          />
          <main
            className={`flex-1 transition-all duration-300 ${
              sidebarExpanded ? 'ml-64' : 'ml-16'
            }`}
          >
            <div className="p-6">
              {renderCurrentView()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}