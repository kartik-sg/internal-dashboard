import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { keyService } from "../api";

function StatusPill({ active }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        active ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
      }`}
    >
      {active ? "On" : "Off"}
    </span>
  );
}

function Client() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await keyService.fetchClients();
        const clients = Array.isArray(data?.clients) ? data.clients : [];
        if (!mounted) return;
        setRows(clients);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load clients");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.clientName, r.id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-white">Clients</h1>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="px-3 py-2 rounded-md bg-gray-800 text-gray-100 placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => navigate("/client/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Days Left</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">AWS</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Azure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Monitoring</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>No clients</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-800/40 cursor-pointer"
                    onClick={() => navigate(`/client/${c.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-100">{c.clientName}</td>
                    <td className="px-4 py-3 text-gray-200">
                      <span className={`${c.daysLeft <= 7 ? "text-red-400" : c.daysLeft <= 30 ? "text-yellow-300" : "text-green-300"}`}>{c.daysLeft}</span>
                    </td>
                    <td className="px-4 py-3"><StatusPill active={c.services?.aws} /></td>
                    <td className="px-4 py-3"><StatusPill active={c.services?.azure} /></td>
                    <td className="px-4 py-3"><StatusPill active={c.services?.monitoring} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/${c.id}`);
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Client;
