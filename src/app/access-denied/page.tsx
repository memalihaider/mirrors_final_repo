'use client';

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
      <p className="text-gray-600">You don’t have permission to view this page.</p>
    </div>
  );
}
