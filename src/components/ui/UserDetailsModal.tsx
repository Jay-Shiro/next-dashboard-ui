"use client";

import React from "react";
import { X, User, Mail, Phone } from "lucide-react";

interface UserDetailsModalProps {
  user: any;
  onClose: () => void;
  isLoading?: boolean;
}

export default function UserDetailsModal({
  user,
  onClose,
  isLoading = false,
}: UserDetailsModalProps) {
  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Handle click outside to close
  const modalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold text-color1">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ) : user?.error ? (
            <div className="text-center py-6">
              <div className="mb-4 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Failed to Load User
              </h3>
              <p className="text-gray-500 mb-4">
                {user.error ||
                  "There was an error loading user details. Please try again."}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-color1 text-white rounded"
              >
                Close
              </button>
            </div>
          ) : user ? (
            <div>
              <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="mr-3 bg-color1 rounded-full p-3 text-white">
                  {user.profile_picture_url ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <img
                        src={user.profile_picture_url}
                        alt={user.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium">
                    {user.name ||
                      `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
                      "N/A"}
                  </h3>
                  {/* We removed the User ID display as requested */}
                </div>
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
                    title="Call customer"
                  >
                    <Phone size={18} />
                  </a>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail size={18} className="mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">
                      {user.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone size={18} className="mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* More user details */}
                {user.address && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{user.address}</p>
                  </div>
                )}

                {/* Additional details if available */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {(user.created_at || user.date_joined) && (
                    <div>
                      <p className="text-sm text-gray-500">Registered On</p>
                      <p className="font-medium">
                        {new Date(
                          user.created_at || user.date_joined
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {user.last_login && (
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium">
                        {new Date(user.last_login).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order statistics if available */}
                {(user.total_orders !== undefined ||
                  user.completed_orders !== undefined) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Order Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {user.total_orders !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Total Orders</p>
                          <p className="font-medium">{user.total_orders}</p>
                        </div>
                      )}
                      {user.completed_orders !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Completed Orders
                          </p>
                          <p className="font-medium">{user.completed_orders}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">User details not available</p>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end">
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
}
