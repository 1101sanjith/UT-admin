"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for editing/adding
  const [editForm, setEditForm] = useState({
    name: "",
    icon: "",
    color: "",
    price: "",
    what_we_do: [] as string[],
    what_we_dont: [] as string[],
    how_its_done: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch services");
      }

      // Transform the data to match the UI format
      const transformedData = (result.data || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        icon: service.icon,
        color: service.color,
        price: parseFloat(service.price),
        weDo: service.what_we_do || [],
        weDont: service.what_we_dont || [],
        howItsDone: service.how_its_done || [],
        isActive: service.is_active,
        status: service.is_active ? "Active" : "Inactive",
        displayOrder: service.display_order,
      }));

      setServices(transformedData);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      alert(`Failed to load services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManageService = (service: any) => {
    setSelectedService(service);
    setEditForm({
      name: service.name,
      icon: service.icon,
      color: service.color,
      price: service.price.toString(),
      what_we_do: service.weDo || [],
      what_we_dont: service.weDont || [],
      how_its_done: service.howItsDone || [],
      is_active: service.isActive,
    });
    setIsEditMode(false);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setEditForm({
      name: "",
      icon: "",
      color: "#4CAF50",
      price: "",
      what_we_do: [""],
      what_we_dont: [""],
      how_its_done: [""],
      is_active: true,
    });
    setIsAddMode(true);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (
    field: string,
    index: number,
    value: string
  ) => {
    setEditForm((prev) => {
      const newArray = [...(prev[field as keyof typeof prev] as string[])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddArrayField = (field: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }));
  };

  const handleRemoveArrayField = (field: string, index: number) => {
    setEditForm((prev) => {
      const newArray = [...(prev[field as keyof typeof prev] as string[])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleSaveService = async () => {
    // Validation
    if (!editForm.name.trim()) {
      alert("Please enter a service name");
      return;
    }
    if (!editForm.icon.trim()) {
      alert("Please enter an icon");
      return;
    }
    if (!editForm.price || parseFloat(editForm.price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    try {
      // Filter out empty strings from arrays
      const cleanedData = {
        name: editForm.name.trim(),
        icon: editForm.icon.trim(),
        color: editForm.color || "#4CAF50",
        price: parseFloat(editForm.price),
        what_we_do: editForm.what_we_do.filter((item) => item.trim() !== ""),
        what_we_dont: editForm.what_we_dont.filter(
          (item) => item.trim() !== ""
        ),
        how_its_done: editForm.how_its_done.filter(
          (item) => item.trim() !== ""
        ),
        is_active: editForm.is_active,
      };

      console.log("Saving service data:", cleanedData);

      if (isAddMode) {
        // Creating new service
        const response = await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanedData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || result.details || "Failed to create service"
          );
        }

        alert("Service created successfully!");
        setIsModalOpen(false);
        setIsAddMode(false);
      } else {
        // Updating existing service
        if (!selectedService) return;

        const response = await fetch("/api/services", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedService.id,
            ...cleanedData,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || result.details || "Failed to update service"
          );
        }

        setIsEditMode(false);
        alert("Service updated successfully!");
      }

      await fetchServices();
    } catch (error: any) {
      console.error("Error saving service:", error);
      alert(
        `Failed to ${isAddMode ? "create" : "update"} service: ${error.message}`
      );
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedService) return;

    try {
      const newStatus = !editForm.is_active;

      const response = await fetch("/api/services", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedService.id,
          is_active: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update service status");
      }

      setEditForm((prev) => ({ ...prev, is_active: newStatus }));
      await fetchServices();
      alert(`Service ${newStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error: any) {
      console.error("Error toggling service status:", error);
      alert(`Failed to update service status: ${error.message}`);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/services?id=${selectedService.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete service");
      }

      await fetchServices();
      setIsModalOpen(false);
      alert("Service deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting service:", error);
      alert(`Failed to delete service: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="danger">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Service Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage services and track performance
          </p>
        </div>
        <Button onClick={handleAddService}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : services.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              🛠️
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {loading
                  ? "..."
                  : services.filter((s) => s.status === "Active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Services</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {loading
                  ? "..."
                  : services.filter((s) => s.status === "Inactive").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
              ⛔
            </div>
          </div>
        </div>
      </div>

      {/* Service Analytics Table with Search */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Service Analytics
            </h2>
            <div className="w-96">
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading services...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Service
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Icon
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No services found
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {service.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-2xl">{service.icon}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          ₹{service.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(service.status)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleManageService(service)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Service Management Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setIsAddMode(false);
        }}
        title={
          isAddMode
            ? "Add New Service"
            : isEditMode
            ? "Edit Service"
            : "Service Details"
        }
        size="lg"
      >
        {(selectedService || isAddMode) && (
          <div className="space-y-5">
            {/* Add/Edit Mode - Form Style */}
            {isAddMode || isEditMode ? (
              <>
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service name:
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Enter service name"
                  />
                </div>

                {/* Service Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service icon:
                  </label>
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={(e) => handleInputChange("icon", e.target.value)}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Enter emoji icon (e.g., 🧹)"
                    maxLength={4}
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background color:
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                      placeholder="#4CAF50"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price:
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Enter price"
                    min="0"
                  />
                </div>

                {/* What We Do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What We do:
                  </label>
                  <div className="space-y-2">
                    {editForm.what_we_do.map((item: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-green-500 text-lg">✓</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleArrayFieldChange(
                              "what_we_do",
                              index,
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                          placeholder="Enter what we do"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddArrayField("what_we_do")}
                          className="px-3 py-1 text-sm"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRemoveArrayField("what_we_do", index)
                          }
                          className="px-3 py-1 text-sm text-red-600 border-red-300 hover:border-red-400"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What We Don't Do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What We don't do:
                  </label>
                  <div className="space-y-2">
                    {editForm.what_we_dont.map(
                      (item: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-red-500 text-lg">✗</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                "what_we_dont",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                            placeholder="Enter what we don't do"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddArrayField("what_we_dont")}
                            className="px-3 py-1 text-sm"
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRemoveArrayField("what_we_dont", index)
                            }
                            className="px-3 py-1 text-sm text-red-600 border-red-300 hover:border-red-400"
                          >
                            Remove
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* How It's Work */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How it's Work:
                  </label>
                  <div className="space-y-2">
                    {editForm.how_its_done.map(
                      (item: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-blue-600 font-semibold">
                            {index + 1}.
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                "how_its_done",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 bg-white"
                            placeholder="Enter step"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddArrayField("how_its_done")}
                            className="px-3 py-1 text-sm"
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRemoveArrayField("how_its_done", index)
                            }
                            className="px-3 py-1 text-sm text-red-600 border-red-300 hover:border-red-400"
                          >
                            Remove
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSaveService}
                  >
                    {isAddMode ? "Create" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (isAddMode) {
                        setIsModalOpen(false);
                        setIsAddMode(false);
                      } else {
                        handleEditToggle();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              /* View Mode - Display Style */
              <>
                {/* Service Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                    style={{
                      backgroundColor: selectedService?.color || "#4CAF50",
                    }}
                  >
                    {selectedService?.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedService?.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant={editForm.is_active ? "success" : "danger"}
                      >
                        {editForm.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Color: {selectedService?.color}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Starting Price</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      ₹{selectedService?.price}
                    </p>
                  </div>
                </div>

                {/* What We Do */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    What We Do
                  </h3>
                  <ul className="space-y-2">
                    {(selectedService.weDo || []).map(
                      (item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* What We Don't Do */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    What We Don't Do
                  </h3>
                  <ul className="space-y-2">
                    {(selectedService.weDont || []).map(
                      (item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* How It's Done */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How It's Done
                  </h3>
                  <ol className="space-y-2">
                    {(selectedService.howItsDone || []).map(
                      (item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold mt-1">
                            {index + 1}.
                          </span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      )
                    )}
                  </ol>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleEditToggle}
                  >
                    Edit Service
                  </Button>
                  <Button
                    variant={editForm.is_active ? "outline" : "success"}
                    className="flex-1"
                    onClick={handleToggleStatus}
                  >
                    {editForm.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="danger" onClick={handleDeleteService}>
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
