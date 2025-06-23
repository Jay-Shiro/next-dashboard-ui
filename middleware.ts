import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type Role = "admin" | "account" | "support";
type AccessPaths =
  | "/admin"
  | "/settings"
  | "/list/riders"
  | "/list/deliveries"
  | "/list/tracking"
  | "/list/offline"
  | "/list"
  | "/support"
  | "/profile";
type AccessControlMap = Record<AccessPaths, Role[]>;

// Define access control map with exact paths and roles
const ACCESS_CONTROL: AccessControlMap = {
  // Admin-only routes
  "/admin": ["admin"],
  "/settings": ["admin"],
  "/list/riders": ["admin"],

  // Account-only routes
  "/list/deliveries": ["account"],

  // Shared admin & account routes
  "/list/tracking": ["admin", "account"],
  "/list/offline": ["admin", "account"],
  "/list": ["admin", "account"],

  // Support-only routes
  "/support": ["support"],

  // Shared routes
  "/profile": ["admin", "account", "support"],
};

// Type guard to check if a path exists in ACCESS_CONTROL
function isProtectedPath(path: string): path is AccessPaths {
  // More strict path validation
  const normalizedPath = path.toLowerCase();
  return Object.keys(ACCESS_CONTROL).some((protectedPath) =>
    normalizedPath.startsWith(protectedPath)
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("Middleware Check:", {
      path: pathname,
      userRole: token?.role,
      timestamp: new Date().toISOString(),
    });

    // Handle unauthenticated users
    if (!token) {
      console.log("No token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Handle authenticated users trying to access login
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Get full path for nested routes
    const fullPath = pathname.split("?")[0]; // Remove query params
    const basePath = "/" + fullPath.split("/").filter(Boolean)[0];

    // Check if path requires authorization
    if (isProtectedPath(basePath)) {
      const allowedRoles = ACCESS_CONTROL[basePath as AccessPaths];
      const userRole = token.role as Role;

      // Special case for /list/offline path
      if (fullPath.startsWith("/list/offline")) {
        console.log("Offline Access Check:", {
          path: fullPath,
          basePath: "/list/offline",
          userRole,
          allowedRoles: ACCESS_CONTROL["/list/offline"],
          hasAccess: ACCESS_CONTROL["/list/offline"].includes(userRole),
        });
      }

      console.log("Access Check:", {
        path: fullPath,
        basePath,
        userRole,
        allowedRoles,
        hasAccess: allowedRoles.includes(userRole),
      });

      if (!allowedRoles.includes(userRole)) {
        console.log(
          `Access denied: ${userRole} attempted to access ${fullPath}`
        );
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

// Make matcher more strict to catch all protected paths
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/settings/:path*",
    "/list/:path*",
    "/support/:path*",
    "/profile/:path*",
    "/login",
  ],
};
