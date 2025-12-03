import React from "react";
import dayjs from "dayjs";
import { FaCalendarAlt } from "react-icons/fa";
import SectionHeader from "../common/SectionHeader"; // Assuming this is an existing component
import CalendarDay from "../common/CalendarDay"; // Assuming this is an existing component

const CalendarWidget = ({
  calendarDays = [],
  calendarEvents = [],
  todayDate,
  navigate,
}) => {
  return (
    // 1. OUTER CARD: Consistent p-5 padding and h-full for matching height
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-5 h-full">
      {/* 2. FLEX CONTAINER: Forces content distribution vertically */}
      <div className="flex flex-col h-full">
        <SectionHeader
          icon={FaCalendarAlt}
          title={dayjs().format("MMMM YYYY")}
          iconBg="bg-blue-100 text-blue-700"
          action
          actionLabel="View Full"
          onAction={() => navigate && navigate("/admin/calendar")}
        />

        {/* 3. DAY HEADERS: Minimal top margin (mt-1) */}
        <div className="grid grid-cols-7 gap-1 mt-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center text-xs font-semibold text-slate-500 uppercase py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* 4. CALENDAR GRID: flex-grow ensures this grid takes up all available vertical space */}
        <div className="grid grid-cols-7 gap-1 flex-grow">
          {calendarDays.map((day, i) => {
            const event = calendarEvents.find((e) => e.date === day);
            return (
              <CalendarDay
                key={i}
                day={day}
                isToday={day === todayDate}
                hasEvent={!!event}
                eventColor={event?.color}
                // Assuming CalendarDay is a small square/circle element
              />
            );
          })}
        </div>

        {/* 5. EVENT LEGEND: Reduced top margin (mt-3) and minimal internal styling */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-md" />
            Exams
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-md" />
            Events
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-md" />
            Holidays
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-md" />
            PTM
          </span>
        </div>
      </div>
    </section>
  );
};

export default React.memo(CalendarWidget);
