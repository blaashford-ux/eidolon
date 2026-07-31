import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AuthGate } from './components/AuthGate';
import { PersonaGate } from './components/PersonaGate';
import { PersonaProvider } from './components/PersonaProvider';
import { DashboardPage } from './pages/DashboardPage';
import { FeaturePlaceholderPage } from './pages/FeaturePlaceholderPage';
import { GraphPage } from './pages/GraphPage';
import { ModerationDetailPage } from './pages/ModerationDetailPage';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { SearchPage } from './pages/SearchPage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { SubmissionFormPage } from './pages/SubmissionFormPage';
import { SubmissionsPage } from './pages/SubmissionsPage';

export default function App() {
  return (
    <PersonaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />} path="/">
            <Route element={<DashboardPage />} index />

            <Route
              element={
                <AuthGate>
                  <PersonaGate allowed={['contributor', 'curator']} title="Submissions">
                    <SubmissionsPage />
                  </PersonaGate>
                </AuthGate>
              }
              path="submissions"
            />
          <Route
            element={
              <AuthGate>
                <PersonaGate allowed={['contributor']} title="New submission">
                  <SubmissionFormPage />
                </PersonaGate>
              </AuthGate>
            }
            path="submissions/new"
          />
          <Route element={<SubmissionDetailPage />} path="submissions/:id" />

            <Route
              element={
                <PersonaGate allowed={['reader', 'contributor', 'curator', 'authority-owner']} title="Search">
                  <SearchPage />
                </PersonaGate>
              }
              path="search"
            />
            <Route
              element={
                <PersonaGate allowed={['reader', 'contributor']} title="Graph explorer">
                  <GraphPage />
                </PersonaGate>
              }
              path="graph"
            />
            <Route element={<Navigate replace to="/graph" />} path="features/graph-expansion" />

          <Route
            element={
              <AuthGate>
                <PersonaGate allowed={['curator']} title="Moderation queue">
                  <ModerationQueuePage />
                </PersonaGate>
              </AuthGate>
            }
            path="moderation"
          />
          <Route
            element={
              <AuthGate>
                <PersonaGate allowed={['curator']} title="Moderation review">
                  <ModerationDetailPage />
                </PersonaGate>
              </AuthGate>
            }
            path="moderation/:id"
          />

          <Route
            element={
              <AuthGate>
                <PersonaGate allowed={['authority-owner']} title="Authority profiles">
                  <ProfilesPage />
                </PersonaGate>
              </AuthGate>
            }
            path="authority"
          />
          <Route
            element={
              <AuthGate>
                <PersonaGate allowed={['authority-owner']} title="Authority profile detail">
                  <ProfileDetailPage />
                </PersonaGate>
              </AuthGate>
            }
            path="authority/:id"
          />

            <Route element={<FeaturePlaceholderPage />} path="features/:feature" />
            <Route element={<Navigate replace to="/" />} path="home" />
            <Route element={<NotFoundPage />} path="*" />
          </Route>
        </Routes>
      </BrowserRouter>
    </PersonaProvider>
  );
}
