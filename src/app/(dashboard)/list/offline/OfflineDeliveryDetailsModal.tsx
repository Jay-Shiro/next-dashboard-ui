import { OfflineDelivery } from "./types";

interface OfflineDeliveryModalProps {
  delivery: OfflineDelivery;
  onClose: () => void;
}

export const OfflineDeliveryDetailsModal = ({
  delivery,
  onClose,
}: OfflineDeliveryModalProps) => {
  const formatDate = (dateString: string) => {
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

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "N/A";
    return `₦${amount.toLocaleString("en-NG")}`;
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-color1">
            Offline Delivery Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-color1">
                  Basic Information
                </h3>
                <div className="space-y-2">
                  {/* Removed delivery_id display as requested */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Date:</span>
                    <span className="font-medium">
                      {formatDate(delivery.completion_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created At:</span>
                    <span className="font-medium">
                      {formatDate(delivery.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-color1">
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {delivery.user?.name || "N/A"}
                    </span>
                  </div>
                  {delivery.user?.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{delivery.user.email}</span>
                    </div>
                  )}
                  {delivery.user?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <a
                        href={`tel:${delivery.user.phone}`}
                        className="font-medium text-blue-600"
                      >
                        {delivery.user.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-color1">
                  Rider Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {delivery.rider?.name || "N/A"}
                    </span>
                  </div>
                  {delivery.rider?.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">
                        {delivery.rider.email}
                      </span>
                    </div>
                  )}
                  {delivery.rider?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <a
                        href={`tel:${delivery.rider.phone}`}
                        className="font-medium text-blue-600"
                      >
                        {delivery.rider.phone}
                      </a>
                    </div>
                  )}
                  {(delivery.rider?.vehicletype ||
                    delivery.rider?.vehicle_type) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Type:</span>
                      <span className="font-medium">
                        {delivery.rider?.vehicle_type ||
                          delivery.rider?.vehicletype}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-color1">
                  Delivery Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{delivery.distance}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">Start Point:</span>
                    <span className="font-medium text-right">
                      {safeRenderLocation(delivery.startpoint)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">End Point:</span>
                    <span className="font-medium text-right">
                      {safeRenderLocation(delivery.endpoint)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-medium">{delivery.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Size:</span>
                    <span className="font-medium">{delivery.package_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Speed:</span>
                    <span className="font-medium">
                      {delivery.delivery_speed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-color1">
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">
                      {formatCurrency(delivery.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span
                      className={`font-medium ${
                        delivery.payment_status === "paid"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {delivery.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Type:</span>
                    <span className="font-medium">
                      {delivery.transaction_type}
                    </span>
                  </div>
                  {delivery.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Reference:</span>
                      <span className="font-medium">
                        {delivery.payment_reference}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineDeliveryDetailsModal;
