import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// --- CUSTOM HOOK IMPORT ---
import { useDashboardData } from "../../hooks/useDashboardData";

// COMPONENTS (Removed unnecessary Fa imports as they are now in the hook/components)
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardQuickActions from "../../components/dashboard/DashboardQuickActions";
import UpcomingExams from "../../components/dashboard/UpcomingExams";
import NotificationsPanel from "../../components/dashboard/NotificationsPanel";
import BirthdaysToday from "../../components/dashboard/BirthdaysToday";
import AttendanceChart from "../../components/dashboard/AttendanceChart";
import GradeDistributionChart from "../../components/dashboard/GradeDistributionChart";
import SystemHealthPanel from "../../components/dashboard/SystemHealthPanel";
import StatusBarFooter from "../../components/dashboard/StatusBarFooter";
import LibraryStats from "../../components/dashboard/LibraryStats";
import FinanceOverview from "../../components/dashboard/FinanceOverview";
import CalendarWidget from "../../components/dashboard/CalendarWidget";
import PendingApprovals from "../../components/dashboard/PendingApprovals";
import ComplaintSummary from "../../components/dashboard/ComplaintSummary";
import DashboardQuickStats from "../../components/dashboard/DashboardQuickStats";
import ResultsOverview from "../../components/dashboard/ResultsOverview";
import RecentActivities from "../../components/dashboard/RecentActivities";

// --- Custom Wrapper for components that don't have built-in card style ---
// Kept here as it's a structural utility for the layout
const ModernWrapperCard = ({ children, className = "" }) => (
  <div
    className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-5 ${className}`}
  >
    {children}
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();

  // ⚡ USE THE CUSTOM HOOK to manage data, loading, and refresh logic
  const { dashboardData, loading, error, lastUpdated, handleRefresh } =
    useDashboardData();

  // --- EFFECT: Real-Time Clock Update (Kept for instant UI update) ---
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    // --- MODERN LOADING SCREEN (Moved from hook for visual control, but could be inside hook) ---
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-2xl"></div>
          <p className="text-xl font-bold text-slate-800">
            Initializing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-red-50/50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl border-l-4 border-red-500 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-3">
            Data Load Error!
          </h2>
          <p className="text-gray-600">
            {error || "Could not load dashboard data."}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Refreshing
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-8">
      <main className="space-y-6 max-w-7xl mx-auto">
        {/* 1. MODERN HEADER (Replaced the large JSX block with the component) */}
        <DashboardHeader
          userName={dashboardData.user.name.split(" ")[0]}
          currentTime={currentTime}
          lastUpdated={lastUpdated}
          isRefreshing={loading}
          handleRefresh={handleRefresh}
        />

        <hr className="border-slate-200/50" />

        {/* 2. Results Overview */}
        <ResultsOverview results={dashboardData.resultsOverview} />

        <hr className="border-slate-200/50" />

        {/* 3. Quick Actions */}
        <DashboardQuickActions navigate={navigate} />

        <hr className="border-slate-200/50" />

        {/* 4. Finance + Calendar Widget */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-full">
            <FinanceOverview
              financeOverview={dashboardData.finance.financeOverview}
              financialData={dashboardData.finance.financialData}
              lineChartOptions={dashboardData.finance.lineChartOptions}
              navigate={navigate}
            />
          </div>
          <CalendarWidget
            calendarDays={dashboardData.calendarDays}
            calendarEvents={dashboardData.calendarEvents}
            todayDate={dashboardData.todayDate}
            navigate={navigate}
          />
        </div>

        <hr className="border-slate-200/50" />

        {/* 5. Attendance & Grade Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernWrapperCard>
            <AttendanceChart
              attendanceChart={dashboardData.attendanceChart}
              barChartOptions={dashboardData.barChartOptions}
            />
          </ModernWrapperCard>
          <ModernWrapperCard>
            <GradeDistributionChart
              gradeDistribution={dashboardData.gradeDistribution}
              doughnutOptions={dashboardData.doughnutOptions}
            />
          </ModernWrapperCard>
        </div>

        <hr className="border-slate-200/50" />

        {/* 6. Upcoming Exams + Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingExams
            upcomingExams={dashboardData.upcomingExams}
            navigate={navigate}
          />
          <PendingApprovals
            pendingApprovals={dashboardData.pendingApprovals}
            navigate={navigate}
          />
        </div>

        <hr className="border-slate-200/50" />

        {/* ⭐ 7. Recent Activity + Notifications Panel (Harmonized) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivities
            recentActivities={dashboardData.recentActivities}
            navigate={navigate}
            loadingActivities={loading}
          />
          <NotificationsPanel
            notifications={dashboardData.notifications}
            navigate={navigate}
            loadingNotifications={loading}
          />
        </div>

        <hr className="border-slate-200/50" />

        {/* 8. Quick Stats + Library + Complaints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModernWrapperCard>
            <DashboardQuickStats
              stats={dashboardData.quickStats}
              navigate={navigate}
            />
          </ModernWrapperCard>
          <ModernWrapperCard>
            <LibraryStats
              libraryStats={dashboardData.libraryStats}
              navigate={navigate}
            />
          </ModernWrapperCard>
          <ModernWrapperCard>
            <ComplaintSummary
              complaints={dashboardData.complaintSummary}
              navigate={navigate}
            />
          </ModernWrapperCard>
        </div>

        <hr className="border-slate-200/50" />

        {/* 9. Birthdays + System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernWrapperCard>
            <BirthdaysToday
              birthdays={dashboardData.birthdays}
              navigate={navigate}
            />
          </ModernWrapperCard>
          <SystemHealthPanel systemHealth={dashboardData.systemHealth} />
        </div>
      </main>

      {/* 10. Status Bar Footer */}
      <div className="pt-6 max-w-7xl mx-auto">
        {/* Pass the updated time from the hook */}
        <StatusBarFooter lastUpdated={lastUpdated} />
      </div>
    </div>
  );
};

export default DashboardHome;
