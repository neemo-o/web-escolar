import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/dashboard/views/common/Overview";
import Schools from "./pages/dashboard/views/admin/Schools";
import GlobalUsers from "./pages/dashboard/views/admin/GlobalUsers";
import Reports from "./pages/dashboard/views/secretary/Reports";
import Audit from "./pages/dashboard/views/admin/Audit";
import Users from "./pages/dashboard/views/secretary/Users";
import Classrooms from "./pages/dashboard/views/secretary/Classrooms";
import Enrollments from "./pages/dashboard/views/secretary/Enrollments";
import GradesView from "./pages/dashboard/views/secretary/GradesView";
import ResetPassword from "./pages/dashboard/views/secretary/ResetPassword";
import MyClassrooms from "./pages/dashboard/views/teacher/MyClassrooms";
import MyStudents from "./pages/dashboard/views/teacher/MyStudents";
import Schedule from "./pages/dashboard/views/teacher/Schedule";
import Assessments from "./pages/dashboard/views/teacher/Assessments";
import Grades from "./pages/dashboard/views/teacher/Grades";
import Progress from "./pages/dashboard/views/teacher/Progress";
import MyGrades from "./pages/dashboard/views/student/MyGrades";
import MyAssessments from "./pages/dashboard/views/student/MyAssessments";
import MyProgress from "./pages/dashboard/views/student/MyProgress";
import StudentClassrooms from "./pages/dashboard/views/guardian/StudentClassrooms";
import StudentGrades from "./pages/dashboard/views/guardian/StudentGrades";
import StudentAssessments from "./pages/dashboard/views/guardian/StudentAssessments";
import StudentProgress from "./pages/dashboard/views/guardian/StudentProgress";
import StudentHealth from "./pages/dashboard/views/guardian/StudentHealth";
import Profile from "./pages/dashboard/views/common/Profile";
import Settings from "./pages/dashboard/views/common/Settings";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard/*"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="schools" element={<Schools />} />
        <Route path="global-users" element={<GlobalUsers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<Audit />} />
        <Route path="users" element={<Users />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="grades-view" element={<GradesView />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="my-classrooms" element={<MyClassrooms />} />
        <Route path="my-students" element={<MyStudents />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="grades" element={<Grades />} />
        <Route path="progress" element={<Progress />} />
        <Route path="my-grades" element={<MyGrades />} />
        <Route path="my-assessments" element={<MyAssessments />} />
        <Route path="my-progress" element={<MyProgress />} />
        <Route path="student-classrooms" element={<StudentClassrooms />} />
        <Route path="student-grades" element={<StudentGrades />} />
        <Route path="student-assessments" element={<StudentAssessments />} />
        <Route path="student-progress" element={<StudentProgress />} />
        <Route path="student-health" element={<StudentHealth />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
