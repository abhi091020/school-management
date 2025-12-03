// src/hooks/useDashboardData.js

import { useState, useEffect } from "react";
// Import icons needed for the mock data structure
import {
  FaCheckCircle,
  FaTrophy,
  FaTimesCircle,
  FaBuilding,
  FaDollarSign,
  FaBullhorn,
} from "react-icons/fa";

// Function to generate all the mock data
const generateMockDashboardData = () => {
  const generateCalendarDays = () => {
    const d = [];
    // Generates days 1 to 31 with some leading/trailing zeros for layout effect
    for (let i = 1; i <= 35; i++) d.push(i > 3 && i < 33 ? i - 3 : 0);
    return d;
  };

  return {
    user: { name: "Administrator", role: "School Admin" },

    resultsOverview: [
      {
        label: "Avg. Passing Score",
        value: "78%",
        icon: FaCheckCircle,
        gradient: "from-emerald-500 to-green-600",
        trend: "up",
        trendValue: "+1.2%",
      },
      {
        label: "Top Grade (A/A+)",
        value: "25%",
        icon: FaTrophy,
        gradient: "from-blue-500 to-cyan-600",
        trend: "up",
        trendValue: "+0.5%",
      },
      {
        label: "Highest Fail Rate",
        value: "Math (8%)",
        icon: FaTimesCircle,
        gradient: "from-red-500 to-pink-600",
        trend: "down",
        trendValue: "-0.1%",
      },
      {
        label: "Exams Conducted",
        value: 45,
        icon: FaBuilding,
        gradient: "from-purple-500 to-indigo-600",
        trend: "up",
        trendValue: "+5",
      },
      {
        label: "YOY Improvement",
        value: "+3.2%",
        icon: FaDollarSign,
        gradient: "from-yellow-500 to-amber-600",
        trend: "up",
        trendValue: "+3.2%",
      },
    ],

    quickStats: {
      totalClasses: 52,
      totalTeachers: 63,
      attendanceRate: "91%",
    },

    attendanceChart: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        {
          label: "Attendance",
          data: [92, 94, 89, 96, 91],
          backgroundColor: "rgba(59,130,246,0.7)",
          borderRadius: 8,
        },
      ],
    },

    barChartOptions: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },

    gradeDistribution: {
      labels: ["A+", "A", "B", "C", "D", "F"],
      datasets: [
        {
          data: [140, 310, 390, 260, 80, 15],
          backgroundColor: [
            "#4F46E5",
            "#0EA5E9",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#6B7280",
          ],
        },
      ],
    },

    doughnutOptions: { cutout: "60%" },
    libraryStats: { issued: 480, returned: 32, overdue: 14 },

    finance: {
      financeOverview: {
        collected: 7900000,
        pending: 230000,
        target: 9500000,
        expenses: 4100000,
      },
      financialData: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Revenue",
            data: [450000, 620000, 710000, 920000, 840000, 1020000],
            borderColor: "#10B981",
            backgroundColor: "rgba(16,185,129,0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      lineChartOptions: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    },

    notifications: [
      {
        message: "New admin approval request",
        time: "10 min ago",
        priority: "high",
      },
      {
        message: "Library book overdue alert",
        time: "25 min ago",
        priority: "medium",
      },
      {
        message: "System backup complete",
        time: "1 hr ago",
        priority: "low",
      },
    ],

    upcomingExams: [
      { title: "Math Final Exam", date: "2025-11-26" },
      { title: "Science Practical", date: "2025-11-29" },
    ],

    pendingApprovals: [
      { name: "Rohit Sharma", type: "Leave Request", date: "2025-11-25" },
      { name: "Class 9A", type: "New Schedule", date: "2025-11-26" },
    ],

    birthdays: [
      { name: "Sneha Kapoor", role: "Student" },
      { name: "Mr. Ajay Desai", role: "Teacher" },
    ],

    recentActivities: [
      {
        icon: FaCheckCircle,
        iconBg: "bg-emerald-500",
        title: "Attendance Submitted",
        description: "Class 10B attendance completed",
        time: "12 min ago",
      },
      {
        icon: FaBullhorn,
        iconBg: "bg-blue-500",
        title: "New Announcement",
        description: "Science Exhibition details released",
        time: "45 min ago",
      },
      {
        icon: FaTrophy,
        iconBg: "bg-yellow-500",
        title: "Grade Updated",
        description: "Maths final grades posted",
        time: "1 hr ago",
      },
    ],

    calendarDays: generateCalendarDays(),
    calendarEvents: [
      { date: 10, color: "bg-red-500" },
      { date: 21, color: "bg-blue-500" },
      { date: 25, color: "bg-emerald-500" },
    ],
    todayDate: 21,

    systemHealth: {
      server: "online",
      database: "online",
      api: "online",
      backup: "online",
    },

    complaintSummary: [
      { id: 1, type: "Academic", count: 5 },
      { id: 2, type: "Admin", count: 2 },
    ],
  };
};

export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Function to simulate fetching or refreshing data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network request delay (1.2 seconds)
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = generateMockDashboardData();
          setData(mockData);
          setLastUpdated(new Date()); // Set refresh time only after success
          resolve(mockData);
        }, 1200);
      });
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
      setError("Failed to load dashboard data. Check the server connection.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    dashboardData: data,
    loading,
    error,
    lastUpdated,
    handleRefresh: fetchData, // Expose the function to manually refresh
  };
};
