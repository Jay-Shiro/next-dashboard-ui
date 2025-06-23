import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!("role" in session.user) || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse JSON request body instead of FormData
    const requestBody = await request.json();

    // Required fields validation
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

    // Check for missing fields
    const missingFields = requiredFields.filter((field) => !requestBody[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Generate a unique ID if none provided
    if (!requestBody._id) {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 10);
      requestBody._id = `OD-${timestamp}-${randomStr}`;
    }

    // Format startpoint and endpoint if they are strings
    if (typeof requestBody.startpoint === "string") {
      requestBody.startpoint = {
        address: requestBody.startpoint,
        latitude: 0,
        longitude: 0,
      };
    }

    if (typeof requestBody.endpoint === "string") {
      requestBody.endpoint = {
        address: requestBody.endpoint,
        latitude: 0,
        longitude: 0,
      };
    }

    // Ensure consistent API field names
    if (!requestBody.admin_notes) {
      requestBody.admin_notes = "Created via offline delivery interface";
    }

    // Make sure completion date is properly formatted
    if (
      requestBody.completion_date &&
      !requestBody.completion_date.includes(" ")
    ) {
      const date = new Date(requestBody.completion_date);
      requestBody.completion_date =
        date.toISOString().split("T")[0] +
        " " +
        date.getHours().toString().padStart(2, "0") +
        ":" +
        date.getMinutes().toString().padStart(2, "0");
    }

    // Add last_updated if not present
    if (!requestBody.last_updated) {
      requestBody.last_updated = new Date().toISOString();
    }

    // Set status if not provided
    if (!requestBody.status) {
      requestBody.status = {
        current: "completed",
        timestamp: new Date().toISOString(),
      };
    }

    console.log("Creating offline delivery - Request:", {
      url: `${process.env.NEXT_API_BASE_URL}/deliveries/offline`,
      body: requestBody,
    });

    const response = await fetch(
      `${process.env.NEXT_API_BASE_URL}/deliveries/offline`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.API_TOKEN || ""}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to create offline delivery", details: errorData },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error creating offline delivery:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or account role
    if (
      !("role" in session.user) ||
      (session.user.role !== "admin" && session.user.role !== "account")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const rider_id = searchParams.get("rider_id");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const payment_status = searchParams.get("payment_status");
    const forceRefresh = searchParams.has("_t");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Construct query string for backend API
    const queryParams = new URLSearchParams();
    if (user_id) queryParams.append("user_id", user_id);
    if (rider_id) queryParams.append("rider_id", rider_id);
    if (from_date) queryParams.append("from_date", from_date);
    if (to_date) queryParams.append("to_date", to_date);
    if (payment_status) queryParams.append("payment_status", payment_status);
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());

    // No caching - always fetch fresh data from backend API
    const apiUrl = `${
      process.env.NEXT_API_BASE_URL
    }/deliveries/offline?${queryParams.toString()}`;

    console.log("Fetching from backend API:", {
      url: apiUrl,
      page,
      limit,
    });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN || ""}`,
      },
      cache: "no-store", // Disable caching completely
      next: { revalidate: 0 }, // Disable revalidation cache
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      console.log("Offline deliveries API - Backend error:", {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });

      return NextResponse.json(
        { error: "Failed to fetch offline deliveries", details: errorData },
        { status: response.status }
      );
    }

    let data = await response.json();
    console.log("API raw response data structure:", {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: typeof data === "object" && data !== null ? Object.keys(data) : [],
      dataLength: Array.isArray(data) ? data.length : "N/A",
      hasDeliveries:
        typeof data === "object" && data !== null && "deliveries" in data,
      hasOfflineDeliveries:
        typeof data === "object" &&
        data !== null &&
        "offline_deliveries" in data,
    });

    // Normalize the response structure to ensure it matches what the frontend expects
    let responseData: any = { success: true };
    let deliveriesArray: any[] = [];

    // Handle different response formats from the backend API
    if (Array.isArray(data)) {
      // If the API returns an array directly, convert it to the expected format
      deliveriesArray = data;
      responseData.offline_deliveries = data;
      responseData.total = data.length;
      responseData.count = data.length;
    } else if (typeof data === "object" && data !== null) {
      if (data.offline_deliveries && Array.isArray(data.offline_deliveries)) {
        // Native format with offline_deliveries array
        deliveriesArray = data.offline_deliveries;
        responseData = data;
      } else if (data.deliveries && Array.isArray(data.deliveries)) {
        // Alternative format with deliveries array
        deliveriesArray = data.deliveries;
        responseData.offline_deliveries = data.deliveries;
        responseData.total = data.total || data.deliveries.length;
        responseData.count = data.count || data.deliveries.length;
      } else if (data.data && Array.isArray(data.data)) {
        // Nested data format
        deliveriesArray = data.data;
        responseData.offline_deliveries = data.data;
        responseData.total = data.total || data.data.length;
        responseData.count = data.count || data.data.length;
      } else {
        // Try to extract any array-like property
        const arrayProps = Object.keys(data).find((key) =>
          Array.isArray(data[key])
        );
        if (arrayProps) {
          deliveriesArray = data[arrayProps];
          responseData.offline_deliveries = data[arrayProps];
          responseData.total = deliveriesArray.length;
          responseData.count = deliveriesArray.length;
        } else {
          // Default to empty array if we can't find anything
          responseData.offline_deliveries = [];
          responseData.total = 0;
          responseData.count = 0;
        }
      }
    } else {
      // Fallback for unexpected data types
      responseData.offline_deliveries = [];
      responseData.total = 0;
      responseData.count = 0;
    }

    // Process and standardize field names based on the API documentation - optimized for performance
    const normalizedDeliveries = deliveriesArray.map((delivery) => {
      // Ensure consistent field naming between API response and frontend
      const normalizedDelivery = {
        _id: delivery._id || delivery.id,
        id: delivery._id || delivery.id, // Keep both for compatibility
        user_id: delivery.user_id,
        rider_id: delivery.rider_id,
        price: delivery.price || 0,
        distance: delivery.distance || "",
        startpoint: delivery.startpoint || {},
        endpoint: delivery.endpoint || {},
        // Map vehicle_type/vehicletype field accordingly
        vehicle_type: delivery.vehicle_type || delivery.vehicletype || "bike",
        // Map transaction_type/transactiontype field accordingly
        transaction_type:
          delivery.transaction_type || delivery.transactiontype || "cash",
        // Map package_size/packagesize field accordingly
        package_size: delivery.package_size || delivery.packagesize || "medium",
        // Map delivery_speed/deliveryspeed field accordingly
        delivery_speed:
          delivery.delivery_speed || delivery.deliveryspeed || "standard",
        completion_date: delivery.completion_date || delivery.created_at,
        created_at: delivery.created_at || new Date().toISOString(),
        payment_status: delivery.payment_status || "unpaid",
        payment_reference: delivery.payment_reference,
        admin_notes:
          delivery.admin_notes || "Created via offline delivery interface",
        status: delivery.status || {
          current: "completed",
          timestamp: delivery.last_updated || new Date().toISOString(),
        },
        is_offline_record: true,
      };

      // Only keep essential fields and normalized values to reduce payload size
      return normalizedDelivery;
    });

    // Update the response with normalized deliveries
    responseData.offline_deliveries = normalizedDeliveries;
    responseData.total = normalizedDeliveries.length;
    responseData.count = normalizedDeliveries.length;

    // Log some info about what we extracted
    console.log("Processed offline deliveries:", {
      count: normalizedDeliveries.length,
      firstItem:
        normalizedDeliveries.length > 0
          ? {
              id: normalizedDeliveries[0].id,
              user_id: normalizedDeliveries[0].user_id,
              rider_id: normalizedDeliveries[0].rider_id,
              startpoint: typeof normalizedDeliveries[0].startpoint,
            }
          : "No items",
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching offline deliveries:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
