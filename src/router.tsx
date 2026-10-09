import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';

import Dashboard from './pages/Dashboard';
import FlashcardSetup from './pages/FlashcardSetup';
import Flashcard from './pages/Flashcard';
import FlashcardHistory from './pages/FlashcardHistory';
import Kanji from './pages/Kanji';
import Kotoba from './pages/Kotoba';
import Bunpou from './pages/Bunpou';
import Renshuu from './pages/Renshuu';
import RenshuuSim from './pages/RenshuuSim';
import Settings from './pages/Settings';
import Ringkasan from './pages/Ringkasan';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminRenshuu from './pages/AdminRenshuu';
import AdminRenshuuEdit from './pages/AdminRenshuuEdit';
import AdminFlashcard from './pages/AdminFlashcard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/flashcard/setup', element: <FlashcardSetup /> },
      { path: '/flashcard', element: <Flashcard /> },
      { path: '/flashcard/history', element: <FlashcardHistory /> },
      { path: '/kanji', element: <Kanji /> },
      { path: '/kotoba', element: <Kotoba /> },
      { path: '/bunpou', element: <Bunpou /> },
      { path: '/renshuu', element: <Renshuu /> },
      { path: '/renshuu/:simId', element: <RenshuuSim /> },
      { path: '/settings', element: <Settings /> },
      { path: '/ringkasan', element: <Ringkasan /> },
      { path: '/adminadit', element: <AdminDashboard /> },
      { path: '/adminadit/login', element: <AdminLogin /> },
      { path: '/adminadit/flashcard', element: <AdminFlashcard /> },
      { path: '/adminadit/renshuu', element: <AdminRenshuu /> },
      { path: '/adminadit/renshuu/:simId', element: <AdminRenshuuEdit /> },
    ],
  },
]);
