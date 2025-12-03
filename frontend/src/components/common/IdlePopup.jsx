import React from "react";
import PropTypes from "prop-types";
// import axios from "../../utils/axios"; // Assuming axios is correctly configured

export default function IdlePopup({ open, countdown, onClose, onLogout }) {
  if (!open) return null;

  const handleExtend = async () => {
    // try {
    //   // Optional: heartbeat request to backend to extend session
    //   await axios.post("/auth/heartbeat", {}, { withCredentials: true });
    // } catch (err) {
    //   console.error("Session extend failed:", err);
    // } finally {
    onClose();
    // }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div
        // ✨ MODERN UI: Applied standard card styling to the modal
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-slate-200 transform scale-100 transition-transform duration-300"
      >
        <h3 className="text-2xl font-extrabold mb-3 text-slate-900">
          Session Expiring Soon ⚠️
        </h3>

        <p className="text-slate-600 mb-6 text-base">
          You will be logged out in{" "}
          <strong className="text-red-600 font-extrabold text-xl">
            {countdown}
          </strong>{" "}
          seconds due to inactivity.
        </p>

        <div className="flex flex-col gap-3 justify-center">
          <button
            // Primary Action
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30"
            onClick={handleExtend}
          >
            Stay Logged In
          </button>
          <button
            // Secondary Action
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
            onClick={onLogout}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}

IdlePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  countdown: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

IdlePopup.defaultProps = {
  countdown: 120, // default to 2 min
};
