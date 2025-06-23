import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_API_BASE_URL}/users/${id}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN || ""}`,
      },
      cache: "no-store", // Disable caching
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { error: "Failed to fetch user details", details: errorData },
        { status: response.status }
      );
    }

    const userData = await response.json();

    // If the response is directly the user object
    if (userData && (userData.id || userData._id)) {
      // Add name property for consistency if firstname and lastname exist
      if (userData.firstname || userData.lastname) {
        userData.name = `${userData.firstname || ""} ${
          userData.lastname || ""
        }`.trim();
      }

      // Ensure id is consistent (API sometimes returns _id)
      if (userData._id && !userData.id) {
        userData.id = userData._id;
      } else if (userData.id && !userData._id) {
        userData._id = userData.id;
      }

      return NextResponse.json(userData);
    }

    // If the user is wrapped in a 'user' property
    if (userData && userData.user) {
      const user = userData.user;
      // Add name property for consistency if firstname and lastname exist
      if (user.firstname || user.lastname) {
        user.name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
      }

      // Ensure id is consistent
      if (user._id && !user.id) {
        user.id = user._id;
      } else if (user.id && !user._id) {
        user._id = user.id;
      }

      return NextResponse.json(user);
    }

    // If the user is wrapped in a 'data' property
    if (userData && userData.data) {
      const user = userData.data;
      // Add name property for consistency if firstname and lastname exist
      if (user.firstname || user.lastname) {
        user.name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
      }

      // Ensure id is consistent
      if (user._id && !user.id) {
        user.id = user._id;
      } else if (user.id && !user._id) {
        user._id = user.id;
      }

      return NextResponse.json(user);
    }

    // Fallback to returning the raw response
    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
