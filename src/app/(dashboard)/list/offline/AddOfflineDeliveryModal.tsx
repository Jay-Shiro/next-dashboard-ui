import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { OfflineDelivery } from "./types";
import { X, Search, User, Bike } from "lucide-react";

interface AddDeliveryModalProps {
  onClose: () => void;
  onDeliveryAdded: () => void;
  users: Array<{ id: string; name: string }>;
  riders: Array<{ id: string; name: string }>;
}

// Helper function to generate a unique ID for deliveries
const generateDeliveryId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `OD-${timestamp}-${randomStr}`;
};

export const AddOfflineDeliveryModal = ({
  onClose,
  onDeliveryAdded,
  users,
  riders,
}: AddDeliveryModalProps) => {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<OfflineDelivery>>({
    user_id: "",
    rider_id: "",
    price: 0,
    distance: "",
    startpoint: "",
    endpoint: "",
    vehicle_type: "bike",
    transaction_type: "cash",
    package_size: "medium", // Updated to match API documentation
    delivery_speed: "standard",
    completion_date: new Date().toISOString().split("T")[0],
    payment_status: "paid",
  });

  // Search state
  const [userSearch, setUserSearch] = useState("");
  const [riderSearch, setRiderSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [allUsers, setAllUsers] = useState(users);
  const [allRiders, setAllRiders] = useState(riders);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedRider, setSelectedRider] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Filter users and riders based on search term
  const filteredUsers = useMemo(() => {
    if (!userSearch) return allUsers;
    const searchLower = userSearch.toLowerCase();
    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchLower)
    );
  }, [userSearch, allUsers]);

  const filteredRiders = useMemo(() => {
    if (!riderSearch) return allRiders;
    const searchLower = riderSearch.toLowerCase();
    return allRiders.filter((rider) =>
      rider.name.toLowerCase().includes(searchLower)
    );
  }, [riderSearch, allRiders]);

  // Fetch all users and riders if the initial list is small
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          if (data.users && Array.isArray(data.users)) {
            const formattedUsers = data.users.map((user: any) => {
              // Handle both possible ID field names
              const id = user.id || user._id;
              // Format name from separate fields or use existing name field
              const name =
                user.name ||
                (user.firstname && user.lastname
                  ? `${user.firstname} ${user.lastname}`.trim()
                  : user.email || "Unknown User");
              return { id, name };
            });
            setAllUsers(formattedUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const fetchAllRiders = async () => {
      try {
        setIsLoadingRiders(true);
        const response = await fetch("/api/riders");
        if (response.ok) {
          const data = await response.json();
          if (data.riders && Array.isArray(data.riders)) {
            const formattedRiders = data.riders.map((rider: any) => {
              // Handle both possible ID field names
              const id = rider.id || rider._id;
              // Format name from separate fields or use existing name field
              const name =
                rider.name ||
                (rider.firstname && rider.lastname
                  ? `${rider.firstname} ${rider.lastname}`.trim()
                  : rider.email || "Unknown Rider");
              return { id, name };
            });
            setAllRiders(formattedRiders);
          }
        }
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setIsLoadingRiders(false);
      }
    };

    fetchAllUsers();
    fetchAllRiders();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Special handling for location fields
    if (name === "startpoint" || name === "endpoint") {
      setFormData((prev: Partial<OfflineDelivery>) => ({
        ...prev,
        [name]: value, // Store as simple string for now, will be formatted before submission
      }));
    } else {
      setFormData((prev: Partial<OfflineDelivery>) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUserSelect = (user: { id: string; name: string }) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, user_id: user.id }));
    setUserSearch(user.name);
  };

  const handleRiderSelect = (rider: { id: string; name: string }) => {
    setSelectedRider(rider);
    setFormData((prev) => ({ ...prev, rider_id: rider.id }));
    setRiderSearch(rider.name);
  };

  const formatLocationData = (locationStr: string) => {
    try {
      // Try to parse as JSON in case it's already structured
      return JSON.parse(locationStr);
    } catch (e) {
      // If not JSON, return as address string
      return {
        address: locationStr,
        // Add default coordinates if needed
        latitude: 0,
        longitude: 0,
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validate required fields before submission
      const requiredFields = [
        "user_id",
        "rider_id",
        "price",
        "distance",
        "startpoint",
        "endpoint",
        "vehicle_type",
        "transaction_type",
        "package_size",
        "delivery_speed",
        "completion_date",
        "payment_status",
      ];

      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
      }

      // Generate a unique delivery ID
      const deliveryId = generateDeliveryId();

      // Format request according to API documentation
      const requestBody = {
        _id: deliveryId,
        user_id: formData.user_id,
        rider_id: formData.rider_id,
        price: Number(formData.price),
        distance: formData.distance,
        startpoint: formatLocationData(formData.startpoint as string),
        endpoint: formatLocationData(formData.endpoint as string),
        vehicle_type: formData.vehicle_type,
        transaction_type: formData.transaction_type,
        package_size: formData.package_size,
        delivery_speed: formData.delivery_speed,
        completion_date: formData.completion_date,
        payment_status: formData.payment_status,
        payment_reference:
          formData.payment_reference || `Payment-${deliveryId}`,
        admin_notes: "Created via offline delivery interface",
        last_updated: new Date().toISOString(),
        // Include status information
        status: {
          current: "completed",
          timestamp: new Date().toISOString(),
        },
      };

      console.log("Submitting offline delivery request:", requestBody);

      const response = await fetch("/api/deliveries/offline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "include", // Important for session cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        throw new Error(
          errorData.error ||
            errorData.detail ||
            "Failed to create offline delivery"
        );
      }

      const responseData = await response.json();
      console.log("Successfully added offline delivery:", responseData);

      // Log delivery details and check response structure
      console.log("Delivery details:", {
        id: deliveryId,
        responseId: responseData._id || responseData.id || "No ID returned",
        responseType: typeof responseData,
        hasDataProperty: !!responseData.data,
        dataStructure: responseData.data
          ? Object.keys(responseData.data)
          : "N/A",
      });

      setSubmitSuccess(true);

      // Enhanced success notification with delivery ID and action buttons
      toast.success(
        (t) => (
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">
                Offline delivery created successfully!
              </p>
              <p className="text-sm mt-1">ID: {deliveryId}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Refresh deliveries list to show the new entry
                    onDeliveryAdded();
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                >
                  Refresh List
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 } // Show for 6 seconds
      );

      onDeliveryAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding offline delivery:", error);
      toast.error(error.message || "Failed to add offline delivery");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {submitSuccess && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <svg
                  className="h-5 w-5 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="ml-2 text-sm text-green-800">
                Offline delivery created successfully!
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-green-500 hover:text-green-700"
            >
              <span className="sr-only">Close</span>
              <span className="text-sm">Close</span>
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          disabled={isSubmitting}
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-color1">
            Add Offline Delivery
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-color1 focus-within:border-color1 mb-2">
                    <Search className="h-4 w-4 text-gray-400 ml-2" />
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full p-2 border-0 focus:outline-none focus:ring-0"
                    />
                    {isLoadingUsers && (
                      <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-b-2 border-color1"></div>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md shadow-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
                            formData.user_id === user.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <User size={16} className="text-gray-400" />
                          <span>{user.name}</span>
                          {formData.user_id === user.id && (
                            <span className="ml-auto text-color1">✓</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500">
                        {isLoadingUsers
                          ? "Loading users..."
                          : "No customers found"}
                      </div>
                    )}
                  </div>

                  {selectedUser && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center">
                      <User size={16} className="text-color1 mr-2" />
                      <span className="text-sm font-medium">
                        {selectedUser.name}
                      </span>
                      <button
                        type="button"
                        className="ml-auto text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setSelectedUser(null);
                          setFormData((prev) => ({ ...prev, user_id: "" }));
                          setUserSearch("");
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="user_id"
                    value={formData.user_id}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rider
                </label>
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-color1 focus-within:border-color1 mb-2">
                    <Search className="h-4 w-4 text-gray-400 ml-2" />
                    <input
                      type="text"
                      placeholder="Search rider..."
                      value={riderSearch}
                      onChange={(e) => setRiderSearch(e.target.value)}
                      className="w-full p-2 border-0 focus:outline-none focus:ring-0"
                    />
                    {isLoadingRiders && (
                      <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-b-2 border-color1"></div>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md shadow-sm">
                    {filteredRiders.length > 0 ? (
                      filteredRiders.map((rider) => (
                        <div
                          key={rider.id}
                          className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
                            formData.rider_id === rider.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleRiderSelect(rider)}
                        >
                          <Bike size={16} className="text-gray-400" />
                          <span>{rider.name}</span>
                          {formData.rider_id === rider.id && (
                            <span className="ml-auto text-color1">✓</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500">
                        {isLoadingRiders
                          ? "Loading riders..."
                          : "No riders found"}
                      </div>
                    )}
                  </div>

                  {selectedRider && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center">
                      <Bike size={16} className="text-color1 mr-2" />
                      <span className="text-sm font-medium">
                        {selectedRider.name}
                      </span>
                      <button
                        type="button"
                        className="ml-auto text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setSelectedRider(null);
                          setFormData((prev) => ({ ...prev, rider_id: "" }));
                          setRiderSearch("");
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="rider_id"
                    value={formData.rider_id}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance
                </label>
                <input
                  type="text"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5.2 km"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Point
                </label>
                <textarea
                  name="startpoint"
                  value={
                    typeof formData.startpoint === "string"
                      ? formData.startpoint
                      : (formData.startpoint as any)?.address || ""
                  }
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="e.g. 24b Omorinre Johnson Street, Lagos"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Point
                </label>
                <textarea
                  name="endpoint"
                  value={
                    typeof formData.endpoint === "string"
                      ? formData.endpoint
                      : (formData.endpoint as any)?.address || ""
                  }
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="e.g. 7 Oluwadare Street, Lagos"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Size
                </label>
                <select
                  name="package_size"
                  value={formData.package_size}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra_large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Speed
                </label>
                <select
                  name="delivery_speed"
                  value={formData.delivery_speed}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="same_day">Same Day</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Date
                </label>
                <input
                  type="date"
                  name="completion_date"
                  value={formData.completion_date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  name="payment_reference"
                  value={formData.payment_reference || ""}
                  onChange={handleChange}
                  placeholder="e.g. CASH-PAYMENT-123"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-color1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center 
                  ${
                    submitSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-color1 hover:bg-blue-700"
                  } 
                  focus:outline-none focus:ring-2 focus:ring-color1`}
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isSubmitting
                  ? "Adding..."
                  : submitSuccess
                  ? "Added Successfully!"
                  : "Add Delivery"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddOfflineDeliveryModal;
