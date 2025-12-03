import React from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday"; // Import plugins for modern use
import relativeTime from "dayjs/plugin/relativeTime";
import { FaRegClock, FaCalendarAlt, FaBookOpen } from "react-icons/fa"; // Added FaBookOpen
import SectionHeader from "../common/SectionHeader";
import { NotificationSkeleton } from "../common/Skeleton";
import EmptyState from "../common/EmptyState";

dayjs.extend(isToday);
dayjs.extend(relativeTime);

// Helper function to calculate time left
const getTimeLeft = (date) => {
  const diffDays = dayjs(date).diff(dayjs(), "day");
  if (dayjs(date).isToday()) {
    return "Today!";
  }
  if (diffDays === 1) {
    return "Tomorrow";
  }
  if (diffDays > 1) {
    return `in ${diffDays} days`;
  }
  return "Expired"; // Should ideally not show expired exams
};

const UpcomingExams = ({ upcomingExams, loadingExams, navigate }) => {
  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <SectionHeader
          icon={FaRegClock}
          title="Upcoming Exams"
          iconBg="bg-purple-100 text-purple-700"
          action
          actionLabel="View Calendar"
          onAction={() => navigate("/admin/calendar")}
        />
      </div>
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar shadow-inner-top">
        {loadingExams ? (
          Array(3)
            .fill(0)
            .map((_, i) => <NotificationSkeleton key={i} />)
        ) : upcomingExams.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FaCalendarAlt}
              title="No exams scheduled"
              description="Check the academic calendar for updates."
            />
          </div>
        ) : (
          upcomingExams.map((exam, i) => {
            const timeLeft = getTimeLeft(exam.date);
            const isUrgent = timeLeft === "Today!" || timeLeft === "Tomorrow";

            return (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-100 
                            hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 
                            cursor-pointer group shadow-md hover:shadow-lg"
                onClick={() => navigate(`/admin/exams/${exam.id || "details"}`)} // Added onClick action
              >
                {/* Date Box: Gradient and Prominent */}
                <div
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 
                            flex flex-col items-center justify-center text-white shadow-xl 
                            group-hover:scale-[1.05] transition-transform flex-shrink-0"
                >
                  <span className="text-xl font-extrabold leading-none">
                    {dayjs(exam.date).format("DD")}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    {dayjs(exam.date).format("MMM")}
                  </span>
                </div>

                {/* Exam Info */}
                <div className="flex-1 min-w-0">
                  {/* Title with Icon */}
                  <p className="font-bold text-slate-900 text-base truncate flex items-center gap-2">
                    <FaBookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {exam.title}
                  </p>
                  {/* Subtitle / Day & Time */}
                  <p className="text-sm text-slate-600 mt-0.5">
                    {dayjs(exam.date).format("dddd")} at{" "}
                    <span className="font-semibold">
                      {dayjs(exam.date).format("h:mm A")}
                    </span>
                  </p>
                </div>

                {/* Time Left Badge (New Feature) */}
                <div
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold 
                                ${
                                  isUrgent
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                >
                  {timeLeft}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default React.memo(UpcomingExams);
