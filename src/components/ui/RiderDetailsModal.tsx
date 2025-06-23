"use client";

import React from "react";
import { X, User, Mail, Phone, Bike, MapPin, Clock } from "lucide-react";

interface RiderDetailsModalProps {
  rider: any;
  onClose: () => void;
  isLoading?: boolean;
}

export default function RiderDetailsModal({
  rider,
  onClose,
  isLoading = false,
}: RiderDetailsModalProps) {
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

  // Normalize vehicle type
  const vehicleType = rider?.vehicle_type || rider?.vehicletype || "N/A";

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
          <h2 className="text-xl font-bold text-color1">Rider Details</h2>
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
          ) : rider?.error ? (
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
                Failed to Load Rider
              </h3>
              <p className="text-gray-500 mb-4">
                {rider.error ||
                  "There was an error loading rider details. Please try again."}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-color1 text-white rounded"
              >
                Close
              </button>
            </div>
          ) : rider ? (
            <div>
              <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="mr-3 bg-color1 rounded-full p-3 text-white">
                  {rider.facial_picture_url ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <img
                        src={rider.facial_picture_url}
                        alt={rider.name || "Rider"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <Bike size={32} />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium">
                    {rider.name ||
                      `${rider.firstname || ""} ${
                        rider.lastname || ""
                      }`.trim() ||
                      "N/A"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                      {vehicleType}
                    </span>
                    {rider.is_online !== undefined && (
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          rider.is_online
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rider.is_online ? "Online" : "Offline"}
                      </span>
                    )}
                  </div>
                </div>
                {rider.phone && (
                  <a
                    href={`tel:${rider.phone}`}
                    className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
                    title="Call rider"
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
                      {rider.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone size={18} className="mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">
                      {rider.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {rider.emergency_contact_name && (
                  <div className="flex items-center">
                    <Phone size={18} className="mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-medium">
                        {rider.emergency_contact_name}:{" "}
                        {rider.emergency_contact_phone || "No phone provided"}
                      </p>
                    </div>
                  </div>
                )}

                {rider.location && (
                  <div className="flex items-start">
                    <MapPin size={18} className="mr-2 mt-0.5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Last Known Location
                      </p>
                      <p className="font-medium">
                        {typeof rider.location === "string"
                          ? rider.location
                          : "Location coordinates available"}
                      </p>
                    </div>
                  </div>
                )}

                {rider.status && (
                  <div className="flex items-center">
                    <Clock size={18} className="mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Current Status</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                          rider.status === "active" || rider.status === "online"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {rider.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Additional details if available */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {(rider.created_at || rider.date_joined) && (
                    <div>
                      <p className="text-sm text-gray-500">Registered On</p>
                      <p className="font-medium">
                        {new Date(
                          rider.created_at || rider.date_joined
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {(rider.last_active ||
                    rider.last_activity ||
                    rider.last_online) && (
                    <div>
                      <p className="text-sm text-gray-500">Last Active</p>
                      <p className="font-medium">
                        {new Date(
                          rider.last_active ||
                            rider.last_activity ||
                            rider.last_online
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Vehicle details if available */}
                {(rider.vehicle_type || rider.vehicle_picture_url) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Vehicle Information</h4>
                    <div className="flex items-center gap-3">
                      {rider.vehicle_picture_url && (
                        <img
                          src={rider.vehicle_picture_url}
                          alt="Vehicle"
                          className="h-20 w-20 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium capitalize">
                          {rider.vehicle_type || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment account details if available */}
                {(rider.accountbank ||
                  rider.accountname ||
                  rider.accountnumber) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Payment Information</h4>
                    {rider.accountbank && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">Bank</p>
                        <p className="font-medium">{rider.accountbank}</p>
                      </div>
                    )}
                    {rider.accountname && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">Account Name</p>
                        <p className="font-medium">{rider.accountname}</p>
                      </div>
                    )}
                    {rider.accountnumber && (
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-medium">{rider.accountnumber}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery statistics if available */}
                {(rider.total_deliveries !== undefined ||
                  rider.completed_deliveries !== undefined) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Delivery Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {rider.total_deliveries !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Deliveries
                          </p>
                          <p className="font-medium">
                            {rider.total_deliveries}
                          </p>
                        </div>
                      )}
                      {rider.completed_deliveries !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Completed</p>
                          <p className="font-medium">
                            {rider.completed_deliveries}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating if available */}
                {rider.rating !== undefined && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={i < Math.round(rider.rating) ? "gold" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-yellow-500"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                      <span className="ml-2 font-medium">
                        {rider.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Rider details not available</p>
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
