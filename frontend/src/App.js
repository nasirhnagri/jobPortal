import "./App.css"; // relative path
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { JobListings } from "./pages/jobs/JobListings";
import { JobDetails } from "./pages/jobs/JobDetails";
import { BlogList } from "./pages/blog/BlogList";
import { BlogPost } from "./pages/blog/BlogPost";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { SubAdminManagement } from "./pages/admin/SubAdminManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { JobManagement } from "./pages/admin/JobManagement";
import { EmployerManagement } from "./pages/admin/EmployerManagement";
import { Analytics } from "./pages/admin/Analytics";
// import { BlogManagement } from "./pages/admin/BlogManagement";
import BlogManagement from './pages/admin/BlogManagement';
// import { BlogPostEdit } from "./pages/admin/BlogPostEdit";
// import BlogEditor from './pages/admin/BlogEditor';
import BlogEditor from './pages/admin/BlogPostEdit';


// Employer Pages
import { EmployerDashboard } from "./pages/employer/EmployerDashboard";
import { CompanyProfile } from "./pages/employer/CompanyProfile";
import { EmployerJobs } from "./pages/employer/EmployerJobs";
import { PostJob } from "./pages/employer/PostJob";
import { JobApplicants } from "./pages/employer/JobApplicants";
import { EmployerPending } from "./pages/employer/EmployerPending";

// Candidate Pages
import { CandidateDashboard } from "./pages/candidate/CandidateDashboard";
import { CandidateProfile } from "./pages/candidate/CandidateProfile";
import { CandidateApplications } from "./pages/candidate/CandidateApplications";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subadmins"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <SubAdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]}>
                <JobManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employers"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]}>
                <EmployerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]} permissions={["MANAGE_BLOG"]}>
                <BlogManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blogs"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]} permissions={["MANAGE_BLOG"]}>
                <BlogManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog/new"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]} permissions={["MANAGE_BLOG"]}>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog/edit/:id"
            element={
              <ProtectedRoute roles={["superadmin", "subadmin"]} permissions={["MANAGE_BLOG"]}>
                <BlogEditor />
              </ProtectedRoute>
            }
          />

          {/* Employer Routes */}
          <Route
            path="/employer"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/pending"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerPending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/profile"
            element={
              <ProtectedRoute roles={["employer"]}>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/new"
            element={
              <ProtectedRoute roles={["employer"]}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/:jobId/applicants"
            element={
              <ProtectedRoute roles={["employer"]}>
                <JobApplicants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/applications"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerJobs />
              </ProtectedRoute>
            }
          />

          {/* Candidate Routes */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute roles={["candidate"]}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute roles={["candidate"]}>
                <CandidateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute roles={["candidate"]}>
                <CandidateApplications />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
