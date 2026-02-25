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
// FIX #11 #12 #13: new configuration views
import AcademicYears from "./pages/dashboard/views/secretary/AcademicYears";
import GradeLevels from "./pages/dashboard/views/secretary/GradeLevels";
import Subjects from "./pages/dashboard/views/secretary/Subjects";
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
import Students from "./pages/dashboard/views/secretary/Students";
import { useAuth } from "./contexts/AuthContext";
import PagePlaceholder from "./pages/dashboard/PagePlaceholder";
import ToastContainer from "./components/ToastContainer";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
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
            ) : !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/forgot-password"
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

          {/* admin */}
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

          {/* secretary */}
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
            path="students"
            element={
              <ProtectedView allowedRoles={ROUTE_ROLES["students"]}>
                <Students />
              </ProtectedView>
            }
          />

          {/* FIX #11 #12 #13: new configuration routes */}
          <Route
            path="academic-years"
            element={
              <ProtectedView allowedRoles={ROUTE_ROLES["academic-years"]}>
                <AcademicYears />
              </ProtectedView>
            }
          />
          <Route
            path="grade-levels"
            element={
              <ProtectedView allowedRoles={ROUTE_ROLES["grade-levels"]}>
                <GradeLevels />
              </ProtectedView>
            }
          />
          <Route
            path="subjects"
            element={
              <ProtectedView allowedRoles={ROUTE_ROLES["subjects"]}>
                <Subjects />
              </ProtectedView>
            }
          />

          {/* teacher */}
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

          {/* student */}
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

          {/* guardian + student — FIX #23: student-classrooms now accessible to both roles */}
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

          {/* common */}
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

          <Route
            path="*"
            element={
              <div style={{ padding: 32 }}>
                <h2 style={{ marginTop: 0 }}>Página não encontrada</h2>
                <p style={{ color: "#6b7280" }}>
                  A rota requisitada não existe.
                </p>
                <PagePlaceholder pageId="overview" user={null} />
              </div>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
