// frontend/src/layouts/Section.jsx

import React from "react";

/**
 * @typedef {object} SectionProps
 * @property {string} title - The title displayed at the top of the section.
 * @property {React.ReactNode} children - The content (form fields, etc.) inside the section.
 */

/**
 * A reusable container component for structuring forms and pages.
 * Provides a clean background, shadow, padding, and a title header.
 * * @param {SectionProps} props
 * @returns {JSX.Element}
 */
const Section = ({ title, children }) => (
  <section className="bg-white rounded-xl shadow p-4 md:p-6">
    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800">
      {title}
    </h3>
    {children}
  </section>
);

export default Section;
