"use client";

// Import the enhanced version of the page
import EnhancedOfflineDeliveriesPage from "./enhanced-page";

// This is just a wrapper to ensure we don't break existing routing
// We've moved all the implementation to the enhanced-page.tsx file
// for better performance and maintainability

export default function OfflineDeliveriesPage() {
  return <EnhancedOfflineDeliveriesPage />;
}
