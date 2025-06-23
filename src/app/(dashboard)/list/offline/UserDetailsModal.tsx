"use client";

import React from "react";
import { X } from "lucide-react";

interface UserDetailsModalProps {
  user: any;
  onClose: () => void;
  isLoading?: boolean;
}

const UserDetailsModal = ({
  user,
  onClose,
  isLoading = false,
}: UserDetailsModalProps) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-color1">User Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-color1">User Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="py-6 text-center text-gray-500">
            No user details available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-color1">User Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {user.name && (
            <div>
              <h3 className="text-sm text-gray-500">Name</h3>
              <p className="font-medium">{user.name}</p>
            </div>
          )}

          {user.email && (
            <div>
              <h3 className="text-sm text-gray-500">Email</h3>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          {user.phone && (
            <div>
              <h3 className="text-sm text-gray-500">Phone</h3>
              <p className="font-medium">{user.phone}</p>
            </div>
          )}

          {user.address && (
            <div>
              <h3 className="text-sm text-gray-500">Address</h3>
              <p className="font-medium">{user.address}</p>
            </div>
          )}

          {user.created_at && (
            <div>
              <h3 className="text-sm text-gray-500">Joined</h3>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Display other user details as needed */}
          {user.id && (
            <div>
              <h3 className="text-sm text-gray-500">User ID</h3>
              <p className="font-medium text-xs break-all">{user.id}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
