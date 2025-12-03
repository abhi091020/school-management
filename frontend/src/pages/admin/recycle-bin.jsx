"use client";

import React, { useState, lazy, Suspense, memo } from "react";

const RecycleBinTabs = lazy(() =>
  import("../../components/recycle-bin/RecycleBinTabs.jsx")
);

const RecycleTable = lazy(() =>
  import("../../components/recycle-bin/RecycleTable.jsx")
);

const RecycleHistoryTable = lazy(() =>
  import("../../components/recycle-bin/RecycleHistoryTable.jsx")
);

function RecycleBinPage() {
  // FIX: Default to "user" instead of "all"
  const [selectedType, setSelectedType] = useState("user");
  const isHistory = selectedType === "history";

  return (
    <div className="p-6 w-full max-w-[1920px] mx-auto">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          🗑️ Recycle Bin
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          View, restore, or permanently delete soft-deleted records across all
          modules.
        </p>
      </header>

      {/* TABS */}
      <Suspense
        fallback={
          <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
        }
      >
        <RecycleBinTabs selected={selectedType} onChange={setSelectedType} />
      </Suspense>

      {/* TABLE AREA */}
      <section className="mt-6">
        <Suspense
          fallback={
            <div className="p-8 bg-gray-50 rounded-lg animate-pulse text-gray-500 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <div>Loading recycle data...</div>
            </div>
          }
        >
          {isHistory ? (
            <RecycleHistoryTable key="history" tabType={selectedType} />
          ) : (
            <RecycleTable key={selectedType} type={selectedType} />
          )}
        </Suspense>
      </section>
    </div>
  );
}

export default memo(RecycleBinPage);
