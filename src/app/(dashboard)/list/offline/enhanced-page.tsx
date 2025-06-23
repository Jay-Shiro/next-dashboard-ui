"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  Search,
  Plus,
  Filter,
  Download,
  X,
  ChevronDown,
  User,
  Bike,
  Phone,
} from "lucide-react";
import { OfflineWifi } from "@/components/ui/icons/OfflineWifi";
import { OfflineDelivery } from "./types";
import OfflineDeliveryDetailsModal from "./OfflineDeliveryDetailsModal";
import AddOfflineDeliveryModal from "./AddOfflineDeliveryModal";
import UserDetailsModal from "@/components/ui/UserDetailsModal";
import RiderDetailsModal from "@/components/ui/RiderDetailsModal";
import Card from "@/components/ui/Card";
import useOfflineDeliveries from "@/hooks/useOfflineDeliveries";

export default function OfflineDeliveriesPage() {
  const { data: session } = useSession();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<OfflineDelivery | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showRiderModal, setShowRiderModal] = useState<boolean>(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState<boolean>(false);
  const [loadingRiderDetails, setLoadingRiderDetails] =
    useState<boolean>(false);

  // User and rider data
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [riders, setRiders] = useState<Array<{ id: string; name: string }>>([]);

  // Maps for user and rider details
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [riderMap, setRiderMap] = useState<Record<string, any>>({});

  // Function to fetch and cache user details
  const fetchUserDetails = useCallback(
    async (userId: string) => {
      if (!userId || userMap[userId]) return;

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          setUserMap((prev) => ({
            ...prev,
            [userId]: userData,
          }));
        }
      } catch (error) {
        console.error(`Error fetching user details for ID ${userId}:`, error);
      }
    },
    [userMap]
  );

  // Function to fetch and cache rider details
  const fetchRiderDetails = useCallback(
    async (riderId: string) => {
      if (!riderId || riderMap[riderId]) return;

      try {
        const response = await fetch(`/api/riders/${riderId}`);
        if (response.ok) {
          const riderData = await response.json();
          setRiderMap((prev) => ({
            ...prev,
            [riderId]: riderData,
          }));
        }
      } catch (error) {
        console.error(`Error fetching rider details for ID ${riderId}:`, error);
      }
    },
    [riderMap]
  );

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();

      // Handle different response formats
      const usersArray =
        data.users || data.data || (Array.isArray(data) ? data : []);

      const formattedUsers = usersArray.map((user: any) => {
        // Create consistent name field
        const name =
          user.name ||
          `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
          "Unknown User";

        // Normalize ID field
        const id = user.id || user._id;

        return { id, _id: id, name };
      });

      setUsers(formattedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  // Fetch riders data
  const fetchRiders = useCallback(async () => {
    try {
      const response = await fetch("/api/riders");
      if (!response.ok) {
        throw new Error("Failed to fetch riders");
      }
      const data = await response.json();

      // Handle different response formats
      const ridersArray =
        data.riders || data.data || (Array.isArray(data) ? data : []);

      const formattedRiders = ridersArray.map((rider: any) => {
        // Create consistent name field
        const name =
          rider.name ||
          `${rider.firstname || ""} ${rider.lastname || ""}`.trim() ||
          "Unknown Rider";

        // Normalize ID field
        const id = rider.id || rider._id;

        return {
          id,
          _id: id,
          name,
          vehicle_type: rider.vehicle_type || rider.vehicletype || "Unknown",
        };
      });

      setRiders(formattedRiders);
    } catch (err) {
      console.error("Error fetching riders:", err);
    }
  }, []);

  // Use our custom hook for offline deliveries but with caching disabled
  const {
    deliveries,
    isLoading,
    error,
    totalCount,
    hasMoreData,
    isAutoRefresh,
    filters,
    loadMore,
    refresh,
    setFilters,
    resetFilters,
    setIsAutoRefresh,
  } = useOfflineDeliveries({
    pageSize: 10,
    autoRefreshInterval: 30000, // 30 seconds
    initialLoad: true,
    onUserLoad: fetchUserDetails,
    onRiderLoad: fetchRiderDetails,
    userMap,
    riderMap,
  });

  // Load users and riders data on mount
  useEffect(() => {
    fetchUsers();
    fetchRiders();
  }, [fetchUsers, fetchRiders]);

  // Handler for viewing user details
  const handleViewUserDetails = async (userId: string) => {
    try {
      setLoadingUserDetails(true);
      setSelectedUser(null);
      setShowUserModal(true); // Show modal immediately with loading state

      // Fetch user details - first check the userMap cache
      if (userMap[userId]) {
        // Format name from firstname/lastname if available
        const userData = userMap[userId];
        if (!userData.name && (userData.firstname || userData.lastname)) {
          userData.name = `${userData.firstname || ""} ${
            userData.lastname || ""
          }`.trim();
        }
        setSelectedUser(userData);
        setLoadingUserDetails(false);
        return;
      }

      // If not in cache, fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user details. Status: ${response.status}`
          );
        }

        const userData = await response.json();

        // Format name from firstname/lastname if available
        if (!userData.name && (userData.firstname || userData.lastname)) {
          userData.name = `${userData.firstname || ""} ${
            userData.lastname || ""
          }`.trim();
        }

        // Ensure ID consistency
        if (userData._id && !userData.id) {
          userData.id = userData._id;
        } else if (userData.id && !userData._id) {
          userData._id = userData.id;
        }

        // Update the cache
        setUserMap((prev) => ({
          ...prev,
          [userId]: userData,
        }));

        // Show the user details
        setSelectedUser(userData);
      } catch (fetchError) {
        // If timeout or network error, use any cached data or show error
        console.error("Fetch error:", fetchError);
        if (userMap[userId]) {
          // Use cached data if available despite fetch error
          setSelectedUser(userMap[userId]);
          toast.error("Using cached user data due to network error");
        } else {
          toast.error("Failed to load user details. Network error or timeout.");
          setSelectedUser({
            name: "Unknown User",
            id: userId,
            _id: userId,
            error: "Failed to load details",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
      setSelectedUser({ name: "Error", error: "Failed to load user details" });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handler for viewing rider details
  const handleViewRiderDetails = async (riderId: string) => {
    try {
      setLoadingRiderDetails(true);
      setSelectedRider(null);
      setShowRiderModal(true); // Show modal immediately with loading state

      // Fetch rider details - first check the riderMap cache
      if (riderMap[riderId]) {
        // Format name from firstname/lastname if available
        const riderData = riderMap[riderId];
        if (!riderData.name && (riderData.firstname || riderData.lastname)) {
          riderData.name = `${riderData.firstname || ""} ${
            riderData.lastname || ""
          }`.trim();
        }
        setSelectedRider(riderData);
        setLoadingRiderDetails(false);
        return;
      }

      // If not in cache, fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      try {
        const response = await fetch(`/api/riders/${riderId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch rider details. Status: ${response.status}`
          );
        }

        const riderData = await response.json();

        // Format name from firstname/lastname if available
        if (!riderData.name && (riderData.firstname || riderData.lastname)) {
          riderData.name = `${riderData.firstname || ""} ${
            riderData.lastname || ""
          }`.trim();
        }

        // Ensure ID consistency
        if (riderData._id && !riderData.id) {
          riderData.id = riderData._id;
        } else if (riderData.id && !riderData._id) {
          riderData._id = riderData.id;
        }

        // Update the cache
        setRiderMap((prev) => ({
          ...prev,
          [riderId]: riderData,
        }));

        // Show the rider details
        setSelectedRider(riderData);
      } catch (fetchError) {
        // If timeout or network error, use any cached data or show error
        console.error("Fetch error:", fetchError);
        if (riderMap[riderId]) {
          // Use cached data if available despite fetch error
          setSelectedRider(riderMap[riderId]);
          toast.error("Using cached rider data due to network error");
        } else {
          toast.error(
            "Failed to load rider details. Network error or timeout."
          );
          setSelectedRider({
            name: "Unknown Rider",
            id: riderId,
            _id: riderId,
            error: "Failed to load details",
            vehicle_type: "Unknown",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching rider details:", error);
      toast.error("Failed to load rider details");
      setSelectedRider({
        name: "Error",
        error: "Failed to load rider details",
      });
    } finally {
      setLoadingRiderDetails(false);
    }
  };

  // Filter deliveries based on search query
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const deliveryId = (delivery.id || delivery._id || "").toLowerCase();
    const userName = (delivery.user?.name || "").toLowerCase();
    const riderName = (delivery.rider?.name || "").toLowerCase();
    const startLocation = safeRenderLocation(delivery.startpoint).toLowerCase();
    const endLocation = safeRenderLocation(delivery.endpoint).toLowerCase();

    return (
      deliveryId.includes(searchLower) ||
      userName.includes(searchLower) ||
      riderName.includes(searchLower) ||
      startLocation.includes(searchLower) ||
      endLocation.includes(searchLower)
    );
  });

  // Handle filter form changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Apply filters and close filter panel
  const applyFilters = () => {
    refresh();
    setShowFilters(false);
  };

  // Export to CSV functionality
  const handleExportCSV = () => {
    const filename = `offline-deliveries-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    // Create CSV headers
    const headers = [
      "Customer",
      "Rider",
      "Price",
      "Distance",
      "Start Point",
      "End Point",
      "Vehicle Type",
      "Package Size",
      "Delivery Speed",
      "Payment Status",
      "Completion Date",
      "Created At",
    ];

    // Create CSV data rows
    const rows = deliveries.map((delivery) => [
      delivery.user?.name || "Unknown",
      delivery.rider?.name || "Unknown",
      `₦${delivery.price.toLocaleString()}`,
      delivery.distance,
      typeof delivery.startpoint === "string"
        ? delivery.startpoint
        : JSON.stringify(delivery.startpoint),
      typeof delivery.endpoint === "string"
        ? delivery.endpoint
        : JSON.stringify(delivery.endpoint),
      delivery.vehicle_type,
      delivery.package_size,
      delivery.delivery_speed,
      delivery.payment_status,
      new Date(delivery.completion_date).toLocaleDateString(),
      new Date(delivery.created_at).toLocaleDateString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((value) => `"${value || ""}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to safely display location objects
  const safeRenderLocation = (location: any) => {
    if (!location) return "N/A";

    // If it's a string, just return it
    if (typeof location === "string") return location;

    // If it's an object, try to extract the most useful information
    if (typeof location === "object") {
      // First preference: return the address if available
      if (location.address) return location.address;

      // Second preference: return lat/long formatted nicely
      if (location.latitude !== undefined && location.longitude !== undefined) {
        // Format to 6 decimal places
        const lat = parseFloat(location.latitude).toFixed(6);
        const lng = parseFloat(location.longitude).toFixed(6);
        return `${lat}, ${lng}`;
      }

      // For any other object format, try to make a readable string representation
      try {
        return JSON.stringify(location);
      } catch (e) {
        return "Complex location object";
      }
    }

    // Fallback for any other type
    return String(location);
  };

  // Helper function for consistent date formatting
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Helper function for consistent currency formatting
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "N/A";
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  // Check if user has the right role
  if (
    !session?.user?.role ||
    (session.user.role !== "admin" && session.user.role !== "account")
  ) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
        <p className="mt-2">
          You do not have permission to view offline deliveries.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <OfflineWifi size={26} className="text-color1" />
          <h1 className="text-2xl font-bold text-color1">Offline Deliveries</h1>
          <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
            {totalCount} {totalCount === 1 ? "record" : "records"}
          </span>
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`ml-2 text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              isAutoRefresh
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
            title={
              isAutoRefresh ? "Auto-refresh on (30s)" : "Turn on auto-refresh"
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAutoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></span>
            {isAutoRefresh ? "Auto-refreshing" : "Auto-refresh"}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 md:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search deliveries..."
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            title="Filter"
          >
            <Filter size={18} />
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            title="Export to CSV"
          >
            <Download size={18} />
          </button>

          {session.user.role === "admin" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-color1 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Offline Delivery</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-color1">
              Filter Deliveries
            </h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                name="user_id"
                value={filters.user_id || ""}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-color1"
              >
                <option value="">All Customers</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rider
              </label>
              <select
                name="rider_id"
                value={filters.rider_id || ""}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-color1"
              >
                <option value="">All Riders</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                name="payment_status"
                value={filters.payment_status || ""}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-color1"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                name="from_date"
                value={filters.from_date || ""}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-color1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                name="to_date"
                value={filters.to_date || ""}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-color1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 bg-color1 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-32"></div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-sm">
            Try refreshing the page or contact the administrator if this issue
            persists.
            <br />
            Current role: {session?.user?.role || "Unknown"}
          </p>
          <button
            onClick={refresh}
            className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* No results */}
      {!isLoading && !error && filteredDeliveries.length === 0 && (
        <div className="text-center py-8">
          <OfflineWifi size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">
            No offline deliveries found
          </h3>
          {searchQuery && (
            <p className="text-gray-500">Try adjusting your search terms</p>
          )}
          {!searchQuery && (
            <p className="text-gray-500">
              Add your first offline delivery to get started
            </p>
          )}
        </div>
      )}

      {/* Deliveries list */}
      {!isLoading && !error && filteredDeliveries.length > 0 && (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <Card
              key={delivery.id || delivery._id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedDelivery(delivery)}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-start gap-2">
                    <OfflineWifi size={18} className="mt-1 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(delivery.completion_date)}
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">From</p>
                        <p className="font-medium">
                          {safeRenderLocation(delivery.startpoint)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">To</p>
                        <p className="font-medium">
                          {safeRenderLocation(delivery.endpoint)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium">
                    {formatCurrency(delivery.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Distance</p>
                  <p className="font-medium">{delivery.distance || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <div className="flex items-center gap-1 mb-1">
                    <User size={14} className="text-gray-400" />
                    <p className="font-medium">
                      {delivery.user?.name ||
                      (delivery.user?.firstname && delivery.user?.lastname)
                        ? `${delivery.user?.firstname || ""} ${
                            delivery.user?.lastname || ""
                          }`.trim()
                        : "Unknown"}
                    </p>
                    <div className="flex ml-auto space-x-2">
                      {delivery.user?.phone && (
                        <a
                          href={`tel:${delivery.user.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800"
                          title="Call customer"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {delivery.user_id && (
                        <button
                          className="text-gray-500 hover:text-color1 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUserDetails(delivery.user_id);
                          }}
                          title="View customer details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-more-horizontal"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">Rider</p>
                  <div className="flex items-center gap-1">
                    <Bike size={14} className="text-gray-400" />
                    <p className="font-medium">
                      {delivery.rider?.name ||
                      (delivery.rider?.firstname && delivery.rider?.lastname)
                        ? `${delivery.rider?.firstname || ""} ${
                            delivery.rider?.lastname || ""
                          }`.trim()
                        : "Unknown"}
                    </p>
                    <div className="flex ml-auto space-x-2">
                      {delivery.rider?.phone && (
                        <a
                          href={`tel:${delivery.rider.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800"
                          title="Call rider"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {delivery.rider_id && (
                        <button
                          className="text-gray-500 hover:text-color1 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRiderDetails(delivery.rider_id);
                          }}
                          title="View rider details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-more-horizontal"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Details</p>
                  <p className="font-medium capitalize">
                    {delivery.vehicle_type} • {delivery.package_size}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        delivery.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {delivery.payment_status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {delivery.delivery_speed}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load More button with better loading indicator */}
      {hasMoreData && filteredDeliveries.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-4 py-2 border border-gray-300 bg-white text-color1 rounded-md hover:bg-gray-50 flex items-center gap-2 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-t-color1 border-r-color1 border-b-color1 border-l-transparent animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>Load More</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Details Modal */}
      {selectedDelivery && (
        <OfflineDeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      )}

      {/* Add Offline Delivery Modal */}
      {showAddModal && (
        <AddOfflineDeliveryModal
          onClose={() => setShowAddModal(false)}
          onDeliveryAdded={refresh}
          users={users}
          riders={riders}
        />
      )}

      {/* User Details Modal */}
      {showUserModal && (
        <UserDetailsModal
          user={selectedUser}
          isLoading={loadingUserDetails}
          onClose={() => setShowUserModal(false)}
        />
      )}

      {/* Rider Details Modal */}
      {showRiderModal && (
        <RiderDetailsModal
          rider={selectedRider}
          isLoading={loadingRiderDetails}
          onClose={() => setShowRiderModal(false)}
        />
      )}
    </div>
  );
}
