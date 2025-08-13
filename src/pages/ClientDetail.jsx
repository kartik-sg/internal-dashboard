import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { keyService } from "../api";

function Badge({ children, variant = "default" }) {
  const variants = {
    default:
      "px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300",
    success:
      "px-2 py-1 rounded bg-green-900/30 border border-green-700 text-xs text-green-300",
    warning:
      "px-2 py-1 rounded bg-yellow-900/30 border border-yellow-700 text-xs text-yellow-300",
    danger:
      "px-2 py-1 rounded bg-red-900/30 border border-red-700 text-xs text-red-300",
  };
  return <span className={variants[variant]}>{children}</span>;
}

function Section({ title, children, right }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function KeyBlock({ label, value, onCopy }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-300">{label}</div>
      <div className="relative group">
        <pre className="whitespace-pre-wrap break-words text-xs bg-black/40 text-gray-200 p-4 rounded-lg border border-gray-800 max-h-72 overflow-auto font-mono leading-relaxed">
          {value || "No key available"}
        </pre>
        <button
          onClick={onCopy}
          disabled={!value}
          className="absolute top-3 right-3 px-3 py-1.5 text-xs rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-white transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-gray-700 rounded-full animate-spin"></div>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}

function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Core state
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState({
    subscriptionEnds: "",
    services: { aws: false, azure: false, monitoring: false, backup: false },
    tiedTo: { awsAccountID: "", azureAccountID: "" },
  });

  // UI state
  const [copied, setCopied] = useState(false);

  // Load client data
  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      setLoading(true);
      setError("");

      try {
        const data = await keyService.fetchClientById(id);
        if (!mounted) return;

        const clientData = data?.client || null;
        setClient(clientData);

        if (clientData) {
          initializeForm(clientData);
        }
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load client details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadClient();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Initialize form with client data
  const initializeForm = (clientData) => {
    const services = clientData.services || {};
    const tied = (() => {
      if (!clientData.tiedTo) return { awsAccountID: "", azureAccountID: "" };
      if (Array.isArray(clientData.tiedTo)) {
        const aws = clientData.tiedTo.find((t) => t.awsAccountID)?.awsAccountID || "";
        const azure = clientData.tiedTo.find((t) => t.azureAccountID)?.azureAccountID || "";
        return { awsAccountID: aws, azureAccountID: azure };
      }
      return {
        awsAccountID: clientData.tiedTo.awsAccountID || clientData.tiedTo.aws || "",
        azureAccountID: clientData.tiedTo.azureAccountID || clientData.tiedTo.azure || "",
      };
    })();
    setForm({
      subscriptionEnds: isoToLocalInput(clientData.subscriptionEnds),
      services: {
        aws: !!services.aws,
        azure: !!services.azure,
        monitoring: !!services.monitoring,
        backup: typeof services.backup === "boolean" ? services.backup : false,
      },
      tiedTo: tied,
    });
  };

  // Service badges with better styling
  const serviceBadges = useMemo(() => {
    const services = client?.services || {};
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant={services.aws ? "success" : "default"}>
          AWS: {services.aws ? "Active" : "Inactive"}
        </Badge>
        <Badge variant={services.azure ? "success" : "default"}>
          Azure: {services.azure ? "Active" : "Inactive"}
        </Badge>
        <Badge variant={services.monitoring ? "success" : "default"}>
          Monitoring: {services.monitoring ? "Active" : "Inactive"}
        </Badge>
        {typeof services.backup === "boolean" && (
          <Badge variant={services.backup ? "success" : "default"}>
            Backup: {services.backup ? "Active" : "Inactive"}
          </Badge>
        )}
      </div>
    );
  }, [client]);

  // Days left badge variant
  const getDaysLeftVariant = (daysLeft) => {
    if (daysLeft <= 7) return "danger";
    if (daysLeft <= 30) return "warning";
    return "success";
  };

  // Utility functions
  function isoToLocalInput(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function copyKey() {
    if (!client?.publicKey) return;

    try {
      await navigator.clipboard.writeText(client.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy key:", e);
    }
  }

  // Form handlers
  const updateService = (key, value) => {
    setForm((prev) => ({
      ...prev,
      services: { ...prev.services, [key]: value },
    }));
  };

  const updateTiedTo = (key, value) => {
    setForm((prev) => ({
      ...prev,
      tiedTo: { ...prev.tiedTo, [key]: value },
    }));
  };

  const addTiedTo = () => {};
  const removeTiedTo = () => {};

  const startEditing = () => {
    setIsEditing(true);
    setActionError("");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setActionError("");
    if (client) {
      initializeForm(client);
    }
  };

  const saveEdits = async () => {
    setActionError("");
    setSaving(true);

    try {
      const payload = {
        subscriptionEnds: form.subscriptionEnds
          ? new Date(form.subscriptionEnds).toISOString()
          : null,
        services: { ...form.services },
        tiedTo: {
          ...(form.tiedTo.awsAccountID && { awsAccountID: form.tiedTo.awsAccountID }),
          ...(form.tiedTo.azureAccountID && { azureAccountID: form.tiedTo.azureAccountID, azure: form.tiedTo.azureAccountID }),
        },
      };

      const result = await keyService.patchClient(id, payload);

      if (result?.client) {
        setClient(result.client);
        setIsEditing(false);
      } else {
        // Fallback: refresh client data
        const refreshed = await keyService.fetchClientById(id);
        if (refreshed?.client) {
          setClient(refreshed.client);
          setIsEditing(false);
        } else {
          throw new Error("Failed to update client");
        }
      }
    } catch (e) {
      setActionError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
          <div className="text-red-400 text-lg font-medium mb-2">Error</div>
          <div className="text-red-300">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-gray-400 text-lg">Client not found</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">
              {client.clientName || "Unnamed Client"}
            </h1>
            <div className="text-gray-400 text-sm font-mono">
              ID: {client._id || id}
            </div>
            {client.daysLeft !== undefined && (
              <Badge variant={getDaysLeftVariant(client.daysLeft)}>
                {client.daysLeft} days remaining
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              Back
            </button>

            {!isEditing ? (
              <button
                onClick={startEditing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg inline-flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M16.862 3.487a1.5 1.5 0 0 1 2.121 0l1.53 1.53a1.5 1.5 0 0 1 0 2.122l-9.8 9.8a1.5 1.5 0 0 1-.53.35l-4.238 1.413a.75.75 0 0 1-.949-.949l1.414-4.238a1.5 1.5 0 0 1 .35-.53l9.8-9.8z" />
                  <path d="M18 14v4.25A2.75 2.75 0 0 1 15.25 21H4.5A2.5 2.5 0 0 1 2 18.5V7.75A2.75 2.75 0 0 1 4.75 5H9" />
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  disabled={saving}
                  onClick={saveEdits}
                  className="px-4 py-2 rounded-lg text-white transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  Save Changes
                </button>
                <button
                  disabled={saving}
                  onClick={cancelEditing}
                  className="px-4 py-2 rounded-lg text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600 hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {actionError && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <div className="text-red-400">{actionError}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Overview Section */}
        <Section title="Client Overview" right={serviceBadges}>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Name
                    </span>
                    <span className="text-gray-200 font-medium">
                      {client.name || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Display Name
                    </span>
                    <span className="text-gray-200 font-medium">
                      {client.clientName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      File Name
                    </span>
                    <span className="text-gray-200 font-mono text-xs">
                      {client.fileName || "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Subscription Start
                    </span>
                    <span className="text-gray-200 text-xs">
                      {client.subscriptionStarts
                        ? new Date(client.subscriptionStarts).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Subscription End
                    </span>
                    <span className="text-gray-200 text-xs">
                      {client.subscriptionEnds
                        ? new Date(client.subscriptionEnds).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                      Backup Path
                    </span>
                    <span className="text-gray-200 font-mono text-xs break-all">
                      {client.backupFilePath || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tied Accounts */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                  Linked Accounts
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">AWS:</span>
                        <span className="text-gray-200 ml-2 font-mono">
                          {(() => {
                            const t = client.tiedTo;
                            if (!t) return "-";
                            if (Array.isArray(t)) return t.find((x) => x.awsAccountID)?.awsAccountID || "-";
                            return t.awsAccountID || t.aws || "-";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Azure:</span>
                        <span className="text-gray-200 ml-2 font-mono">
                          {(() => {
                            const t = client.tiedTo;
                            if (!t) return "-";
                            if (Array.isArray(t)) return t.find((x) => x.azureAccountID)?.azureAccountID || "-";
                            return t.azureAccountID || t.azure || "-";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription End Date */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium">
                  Subscription End Date
                </label>
                <input
                  type="datetime-local"
                  value={form.subscriptionEnds}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      subscriptionEnds: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Services */}
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-medium">
                  Services
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(form.services).map(([service, enabled]) => (
                    <label
                      key={service}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          updateService(service, e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-200 capitalize">
                        {service}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm font-medium">
                    Linked Accounts
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        placeholder="AWS Account ID"
                        value={form.tiedTo.awsAccountID}
                        onChange={(e) => updateTiedTo("awsAccountID", e.target.value)}
                        className="px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      <input
                        placeholder="Azure Account ID"
                        value={form.tiedTo.azureAccountID}
                        onChange={(e) => updateTiedTo("azureAccountID", e.target.value)}
                        className="px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Public Key Section */}
        <Section
          title="Public Key"
          right={
            copied ? (
              <span className="text-green-400 text-sm font-medium animate-fade-in">
                ✓ Copied to clipboard
              </span>
            ) : null
          }
        >
          <KeyBlock
            label="PEM Format"
            value={client.publicKey}
            onCopy={copyKey}
          />
        </Section>
      </div>
    </div>
  );
}

export default ClientDetail;
