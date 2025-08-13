import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { get } from "../api";

function Layout() {
  const [isHealthy, setIsHealthy] = useState(false);
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/client", label: "Client" },
    { path: "/logs", label: "Logs" },
    { path: "/config", label: "Config" },
  ];

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await get("HEALTH");
        if (!isMounted) return;
        setIsHealthy(data?.status === "ok");
      } catch (_) {
        if (!isMounted) return;
        setIsHealthy(false);
      }
    };

    checkHealth();
    const id = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 p-6 flex flex-col overflow-y-auto">
        <h1 className="text-2xl font-bold mb-8 text-white">sentinel</h1>
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gray-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-6">
          <div className="flex items-center text-sm text-gray-300">
            <span
              className={`inline-block h-4 w-4 rounded-full mr-2 ${
                isHealthy ? "bg-green-500 animate-heartbeat" : "bg-red-500"
              }`}
            />

            <span>{isHealthy ? "Online" : "Offline"}</span>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
