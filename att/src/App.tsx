import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UploadPage } from './pages/UploadPage';
import { ReviewPage } from './pages/ReviewPage';
import { PlannerPage } from './pages/PlannerPage';
import { SummaryPage } from './pages/SummaryPage';
import { ReportPage } from './pages/ReportPage';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-primary transition-all duration-300">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen md:flex">
                      <Navbar />
                      <main className="flex-1 md:ml-64">
                        <Routes>
                          <Route path="/" element={<UploadPage />} />
                          <Route path="/review" element={<ReviewPage />} />
                          <Route path="/planner" element={<PlannerPage />} />
                          <Route path="/summary" element={<SummaryPage />} />
                        </Routes>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
