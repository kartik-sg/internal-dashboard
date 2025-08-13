import { useState } from "react";
import { createClient } from "../api/services/client.js";

function CreateClient() {
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    subscriptionStarts: "",
    subscriptionEnds: "",
  });

  const [services, setServices] = useState({
    serviceA: false,
    serviceB: false,
    serviceC: false,
  });

  const [tiedAccounts, setTiedAccounts] = useState({
    aws: {
      enabled: false,
      accountId: "",
    },
    azure: {
      enabled: false,
      accountId: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Unique client name is required";
    } else if (!/^[a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Only letters, numbers, and underscore (_) are allowed";
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client company name is required";
    }

    if (!formData.subscriptionStarts) {
      newErrors.subscriptionStarts = "Subscription start date is required";
    }

    if (!formData.subscriptionEnds) {
      newErrors.subscriptionEnds = "Subscription end date is required";
    }

    if (formData.subscriptionStarts && formData.subscriptionEnds) {
      const startDate = new Date(formData.subscriptionStarts);
      const endDate = new Date(formData.subscriptionEnds);

      if (endDate <= startDate) {
        newErrors.subscriptionEnds = "End date must be after start date";
      }
    }

    const hasEnabledAccount =
      tiedAccounts.aws.enabled || tiedAccounts.azure.enabled;
    if (!hasEnabledAccount) {
      newErrors.tiedAccounts = "At least one account must be configured";
    }

    if (tiedAccounts.aws.enabled && !tiedAccounts.aws.accountId.trim()) {
      newErrors.awsAccountId = "AWS Account ID is required when AWS is enabled";
    }

    if (tiedAccounts.azure.enabled && !tiedAccounts.azure.accountId.trim()) {
      newErrors.azureAccountId =
        "Azure Account ID is required when Azure is enabled";
    }

    if (
      tiedAccounts.aws.enabled &&
      tiedAccounts.aws.accountId &&
      !/^\d{12}$/.test(tiedAccounts.aws.accountId)
    ) {
      newErrors.awsAccountId = "AWS Account ID must be exactly 12 digits";
    }
    if (
      tiedAccounts.azure.enabled &&
      tiedAccounts.azure.accountId &&
      !/^\d{12}$/.test(tiedAccounts.azure.accountId)
    ) {
      newErrors.azureAccountId = "Azure Account ID must be exactly 12 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9_]*$/.test(value) || value === "") {
      handleInputChange("name", value);
    }
  };

  const handleServiceToggle = (service) => {
    setServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  const handleAccountToggle = (accountType) => {
    setTiedAccounts((prev) => ({
      ...prev,
      [accountType]: {
        ...prev[accountType],
        enabled: !prev[accountType].enabled,
        accountId: !prev[accountType].enabled
          ? prev[accountType].accountId
          : "",
      },
    }));

    // Clear errors when toggling
    if (errors.tiedAccounts) {
      setErrors((prev) => ({ ...prev, tiedAccounts: "" }));
    }
    if (errors[`${accountType}AccountId`]) {
      setErrors((prev) => ({ ...prev, [`${accountType}AccountId`]: "" }));
    }
  };

  const handleAccountIdChange = (accountType, value) => {
    setTiedAccounts((prev) => ({
      ...prev,
      [accountType]: {
        ...prev[accountType],
        accountId: value,
      },
    }));

    if (errors[`${accountType}AccountId`]) {
      setErrors((prev) => ({ ...prev, [`${accountType}AccountId`]: "" }));
    }
  };

  const formatDateTimeToUTC = (utcDateTime) => {
    if (!utcDateTime) return "";
    // Input is already treated as UTC, just ensure ISO format
    return new Date(utcDateTime + "Z").toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const tiedTo = {
        awsAccountID:
          tiedAccounts.aws.enabled && tiedAccounts.aws.accountId.trim()
            ? tiedAccounts.aws.accountId.trim()
            : "",
        azureAccountID:
          tiedAccounts.azure.enabled && tiedAccounts.azure.accountId.trim()
            ? tiedAccounts.azure.accountId.trim()
            : "",
      };

      const clientData = {
        services,
        name: formData.name.trim(),
        subscriptionStarts: formatDateTimeToUTC(formData.subscriptionStarts),
        subscriptionEnds: formatDateTimeToUTC(formData.subscriptionEnds),
        clientName: formData.clientName.trim(),
        tiedTo,
        killSwitch: false,
      };

      const result = await createClient(clientData);
      setResponse(result);
    } catch (err) {
      setErrors({ submit: "Failed to create client. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const resetForm = () => {
    setResponse(null);
    setFormData({
      name: "",
      clientName: "",
      subscriptionStarts: "",
      subscriptionEnds: "",
    });
    setServices({
      serviceA: false,
      serviceB: false,
      serviceC: false,
    });
    setTiedAccounts({
      aws: { enabled: false, accountId: "" },
      azure: { enabled: false, accountId: "" },
    });
    setErrors({});
  };

  if (response) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Client Created Successfully!
            </h1>
            <p className="text-gray-300 mt-2">
              Your client configuration has been saved
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="grid gap-6">
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Unique Name
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={response.name || formData.name}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(response.name || formData.name)
                    }
                    className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {response.publicKey && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Public Key
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={response.publicKey}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white font-mono text-sm focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => copyToClipboard(response.publicKey)}
                      className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                Create Another Client
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Create Client</h1>
          <p className="text-xl text-gray-300">
            Configure your new client with advanced settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Client Information
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Unique Client Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-gray-400"
                  }`}
                  placeholder="unique_client_name"
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-sm text-red-400">{errors.name}</p>
                )}
                <p className="text-xs text-gray-400">
                  Only letters, numbers, and underscore (_) are allowed
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-300"
                >
                  Client Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange("clientName", e.target.value)
                  }
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.clientName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-gray-400"
                  }`}
                  placeholder="My Client Company"
                  maxLength={100}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-400">{errors.clientName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Period */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Subscription Period
                </h2>
                <p className="text-sm text-gray-400">
                  Enter times in UTC format - they will be stored as UTC
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label
                  htmlFor="subscriptionStarts"
                  className="block text-sm font-medium text-gray-300"
                >
                  Subscription Starts <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="subscriptionStarts"
                  value={formData.subscriptionStarts}
                  onChange={(e) =>
                    handleInputChange("subscriptionStarts", e.target.value)
                  }
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.subscriptionStarts
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-gray-400"
                  }`}
                />
                {errors.subscriptionStarts && (
                  <p className="text-sm text-red-400">
                    {errors.subscriptionStarts}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="subscriptionEnds"
                  className="block text-sm font-medium text-gray-300"
                >
                  Subscription Ends <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="subscriptionEnds"
                  value={formData.subscriptionEnds}
                  onChange={(e) =>
                    handleInputChange("subscriptionEnds", e.target.value)
                  }
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.subscriptionEnds
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-gray-400"
                  }`}
                />
                {errors.subscriptionEnds && (
                  <p className="text-sm text-red-400">
                    {errors.subscriptionEnds}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services Configuration */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Services Configuration
                </h2>
                <p className="text-sm text-gray-400">
                  Enable or disable services for this client
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(services).map(([service, enabled]) => (
                <div
                  key={service}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                    enabled
                      ? "border-gray-400 bg-gray-800"
                      : "border-gray-600 bg-gray-850 hover:border-gray-500"
                  }`}
                  onClick={() => handleServiceToggle(service)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {service}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {enabled ? "Service enabled" : "Service disabled"}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        enabled ? "bg-gray-500" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 ${
                          enabled ? "translate-x-6 ml-1" : "translate-x-1"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tied Accounts */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tied Accounts</h2>
                <p className="text-sm text-gray-400">
                  Configure cloud account integrations (minimum one required)
                </p>
              </div>
            </div>

            {errors.tiedAccounts && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{errors.tiedAccounts}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* AWS Account */}
              <div
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  tiedAccounts.aws.enabled
                    ? "border-gray-400 bg-gray-800"
                    : "border-gray-600 bg-gray-850"
                }`}
                onClick={() => handleAccountToggle("aws")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AWS</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        AWS Account
                      </h3>
                      <p className="text-sm text-gray-400">
                        Amazon Web Services integration
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      tiedAccounts.aws.enabled ? "bg-gray-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 ${
                        tiedAccounts.aws.enabled
                          ? "translate-x-6 ml-1"
                          : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>

                {tiedAccounts.aws.enabled && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      AWS Account ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={tiedAccounts.aws.accountId}
                      onChange={(e) =>
                        handleAccountIdChange("aws", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        errors.awsAccountId
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-600 focus:ring-gray-400"
                      }`}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                    {errors.awsAccountId && (
                      <p className="text-sm text-red-400">
                        {errors.awsAccountId}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      12-digit AWS Account ID
                    </p>
                  </div>
                )}
              </div>
              {/* Azure Account */}
              <div
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  tiedAccounts.azure.enabled
                    ? "border-gray-400 bg-gray-800"
                    : "border-gray-600 bg-gray-850"
                }`}
                onClick={() => handleAccountToggle("azure")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        Azure
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Azure Account
                      </h3>
                      <p className="text-sm text-gray-400">
                        Amazon Web Services integration
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      tiedAccounts.azure.enabled ? "bg-gray-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 ${
                        tiedAccounts.azure.enabled
                          ? "translate-x-6 ml-1"
                          : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>

                {tiedAccounts.azure.enabled && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Azure Account ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={tiedAccounts.azure.accountId}
                      onChange={(e) =>
                        handleAccountIdChange("azure", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        errors.azureAccountId
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-600 focus:ring-gray-400"
                      }`}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                    {errors.azureAccountId && (
                      <p className="text-sm text-red-400">
                        {errors.azureAccountId}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      12-digit Azure Account ID
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin w-5 h-5"
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
                    <span>Creating Client...</span>
                  </div>
                ) : (
                  "Create Client"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClient;
