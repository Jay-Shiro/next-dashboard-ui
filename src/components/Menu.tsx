"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; // Import usePathname

// Define type for menu items
interface MenuItem {
  icon: string;
  label: string;
  href: string;
  visible: string[];
  onClick?: () => Promise<void>;
  customIcon?: boolean;
}

const handleLogout = async () => {
  await signOut({ callbackUrl: "/login" });
};

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/admin",
        visible: ["admin", "account", "support"],
      },
      {
        icon: "/riders.png",
        label: "Riders",
        href: "/list/riders",
        visible: ["admin"],
      },
      {
        icon: "/broadcast.png",
        label: "Broadcast",
        href: "/list/broadcast",
        visible: ["admin"],
      },
      {
        icon: "/tracking.png",
        label: "Tracking",
        href: "/list/tracking",
        visible: ["admin", "support"],
      },
      {
        icon: "/transactions.png",
        label: "Transactions",
        href: "/list/transactions",
        visible: ["admin", "account", "support"],
      },
      {
        icon: "/offline-wifi-icon.svg",
        label: "Offline",
        href: "/list/offline",
        visible: ["admin", "account"],
      },
      {
        icon: "/delivery.png",
        label: "Archived",
        href: "/list/archived",
        visible: ["admin"],
      },
      {
        icon: "/delivery.png",
        label: "Deliveries",
        href: "/list/deliveries",
        visible: ["account"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "account", "support"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "#",
        visible: ["admin", "account", "support"],
        onClick: handleLogout, // Attach the handleLogout function
      },
    ],
  },
];

const Menu = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";
  const pathname = usePathname(); // Get the current route

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-500 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(userRole)) {
              const isActive = pathname === item.href; // Check if the current route matches the item's href

              // Special case for Logout
              if (item.label === "Logout") {
                return (
                  <div
                    key={item.label}
                    onClick={item.onClick} // Trigger handleLogout
                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-2 md:px-2 rounded-md hover:bg-color1lite cursor-pointer"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="hidden lg:block">{item.label}</span>
                  </div>
                );
              }

              {
                /* Remove special case for Offline - use standard item rendering */
              }

              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-2 md:px-2 rounded-md hover:bg-color1lite ${
                    isActive ? "bg-color1 text-white" : ""
                  }`}
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
