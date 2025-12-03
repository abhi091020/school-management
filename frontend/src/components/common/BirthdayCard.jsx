import React from "react";
import { FaBirthdayCake } from "react-icons/fa";

// Birthday Card
const BirthdayCard = ({ name, role, avatar, delay }) => (
  <div
    // Use opacity-100 or slightly less for robust background, keeping the pink/purple theme
    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 animate-fadeInUp shadow-md"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Avatar/Initial Container */}
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-xl flex-shrink-0">
      {/* Assuming avatar is a character or JSX element (otherwise use <img />) */}
      {avatar || name[0]}
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-bold text-slate-900 text-base truncate">{name}</p>
      <p className="text-sm text-slate-600">{role}</p>
    </div>

    {/* Bouncing Cake Icon */}
    <FaBirthdayCake className="text-pink-600 text-xl animate-bounce flex-shrink-0" />
  </div>
);

export default React.memo(BirthdayCard);
