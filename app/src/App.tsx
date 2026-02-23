import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import ProtectedView from "./pages/dashboard/ProtectedView";
import { ROUTE_ROLES } from "./pages/dashboard/routeRoles";
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
  const { isAuthenticated, isLoading } = useAuth();

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
      <Route
        path="/esqueci-senha"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />
      <Route
        path="/dashboard/*"
        element={
          isLoading ? (
            <div
              style={{
                width: "100vw",
                height: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Carregando...
            </div>
          ) : isAuthenticated ? (
            <Dashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["overview"]}>
              <Overview />
            </ProtectedView>
          }
        />
        <Route
          path="schools"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["schools"]}>
              <Schools />
            </ProtectedView>
          }
        />
        <Route
          path="global-users"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["global-users"]}>
              <GlobalUsers />
            </ProtectedView>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["reports"]}>
              <Reports />
            </ProtectedView>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["audit"]}>
              <Audit />
            </ProtectedView>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["users"]}>
              <Users />
            </ProtectedView>
          }
        />
        <Route
          path="classrooms"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["classrooms"]}>
              <Classrooms />
            </ProtectedView>
          }
        />
        <Route
          path="enrollments"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["enrollments"]}>
              <Enrollments />
            </ProtectedView>
          }
        />
        <Route
          path="grades-view"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["grades-view"]}>
              <GradesView />
            </ProtectedView>
          }
        />
        <Route
          path="reset-password"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["reset-password"]}>
              <ResetPassword />
            </ProtectedView>
          }
        />
        <Route
          path="my-classrooms"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["my-classrooms"]}>
              <MyClassrooms />
            </ProtectedView>
          }
        />
        <Route
          path="my-students"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["my-students"]}>
              <MyStudents />
            </ProtectedView>
          }
        />
        <Route
          path="schedule"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["schedule"]}>
              <Schedule />
            </ProtectedView>
          }
        />
        <Route
          path="assessments"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["assessments"]}>
              <Assessments />
            </ProtectedView>
          }
        />
        <Route
          path="grades"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["grades"]}>
              <Grades />
            </ProtectedView>
          }
        />
        <Route
          path="progress"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["progress"]}>
              <Progress />
            </ProtectedView>
          }
        />
        <Route
          path="my-grades"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["my-grades"]}>
              <MyGrades />
            </ProtectedView>
          }
        />
        <Route
          path="my-assessments"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["my-assessments"]}>
              <MyAssessments />
            </ProtectedView>
          }
        />
        <Route
          path="my-progress"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["my-progress"]}>
              <MyProgress />
            </ProtectedView>
          }
        />
        <Route
          path="student-classrooms"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["student-classrooms"]}>
              <StudentClassrooms />
            </ProtectedView>
          }
        />
        <Route
          path="student-grades"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["student-grades"]}>
              <StudentGrades />
            </ProtectedView>
          }
        />
        <Route
          path="student-assessments"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["student-assessments"]}>
              <StudentAssessments />
            </ProtectedView>
          }
        />
        <Route
          path="student-progress"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["student-progress"]}>
              <StudentProgress />
            </ProtectedView>
          }
        />
        <Route
          path="student-health"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["student-health"]}>
              <StudentHealth />
            </ProtectedView>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["profile"]}>
              <Profile />
            </ProtectedView>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedView allowedRoles={ROUTE_ROLES["settings"]}>
              <Settings />
            </ProtectedView>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
