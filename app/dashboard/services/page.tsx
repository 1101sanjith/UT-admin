"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

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
    service_image: "",
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Transform the data to match the UI format
      const transformedData = (data || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        icon: service.icon,
        color: service.color,
        price: parseFloat(service.price),
        weDo: service.what_we_do || [],
        weDont: service.what_we_dont || [],
        howItsDone: service.how_its_done || [],
        serviceImage: service.service_image,
        isActive: service.is_active,
        status: service.is_active ? "Active" : "Inactive",
        displayOrder: service.display_order,
      }));

      setServices(transformedData);
    } catch (error) {
      console.error("Error fetching services:", error);
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
      service_image: service.serviceImage || "",
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
      color: "#3B82F6",
      price: "",
      what_we_do: [""],
      what_we_dont: [""],
      how_its_done: [""],
      service_image: "",
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
        name: editForm.name,
        icon: editForm.icon,
        color: editForm.color,
        price: parseFloat(editForm.price),
        what_we_do: editForm.what_we_do.filter((item) => item.trim() !== ""),
        what_we_dont: editForm.what_we_dont.filter(
          (item) => item.trim() !== ""
        ),
        how_its_done: editForm.how_its_done.filter(
          (item) => item.trim() !== ""
        ),
        service_image: editForm.service_image,
        is_active: editForm.is_active,
      };

      if (isAddMode) {
        // Creating new service
        // Get the highest display_order and add 1
        const { data: maxOrderData } = await supabase
          .from("services")
          .select("display_order")
          .order("display_order", { ascending: false })
          .limit(1);

        const nextDisplayOrder =
          maxOrderData && maxOrderData.length > 0
            ? (maxOrderData[0].display_order || 0) + 1
            : 1;

        const { error } = await supabase.from("services").insert({
          ...cleanedData,
          display_order: nextDisplayOrder,
        });

        if (error) throw error;

        alert("Service created successfully!");
        setIsModalOpen(false);
        setIsAddMode(false);
      } else {
        // Updating existing service
        if (!selectedService) return;

        const { error } = await supabase
          .from("services")
          .update(cleanedData)
          .eq("id", selectedService.id);

        if (error) throw error;

        setIsEditMode(false);
        alert("Service updated successfully!");
      }

      await fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      alert(`Failed to ${isAddMode ? "create" : "update"} service`);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedService) return;

    try {
      const newStatus = !editForm.is_active;
      const { error } = await supabase
        .from("services")
        .update({ is_active: newStatus })
        .eq("id", selectedService.id);

      if (error) throw error;

      setEditForm((prev) => ({ ...prev, is_active: newStatus }));
      await fetchServices();
      alert(`Service ${newStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      console.error("Error toggling service status:", error);
      alert("Failed to update service status");
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
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", selectedService.id);

      if (error) throw error;

      await fetchServices();
      setIsModalOpen(false);
      alert("Service deleted successfully!");
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
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
          <div className="space-y-6">
            {/* Service Header */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-4xl">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={(e) => handleInputChange("icon", e.target.value)}
                    className="w-full h-full text-center text-4xl bg-transparent outline-none"
                    maxLength={2}
                    placeholder="🔧"
                  />
                ) : (
                  selectedService?.icon
                )}
              </div>
              <div className="flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-blue-500 outline-none w-full"
                    placeholder="Service Name"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedService?.name}
                  </h2>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={editForm.is_active ? "success" : "danger"}>
                    {editForm.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {isEditMode && (
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      className="text-sm px-2 py-1 border border-gray-300 rounded"
                      placeholder="Color code (e.g., #3B82F6)"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Starting Price</p>
                {isEditMode ? (
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-blue-600 mr-2">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      className="text-3xl font-bold text-blue-600 bg-transparent border-b-2 border-blue-300 outline-none flex-1"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    ₹{selectedService?.price}
                  </p>
                )}
              </div>
            </div>

            {/* Service Image URL */}
            {isEditMode && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Service Image URL
                </h3>
                <input
                  type="text"
                  value={editForm.service_image}
                  onChange={(e) =>
                    handleInputChange("service_image", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}

            {/* What We Do */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">What We Do</h3>
                {isEditMode && (
                  <button
                    onClick={() => handleAddArrayField("what_we_do")}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Add
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {(isEditMode
                  ? editForm.what_we_do
                  : selectedService.weDo || []
                ).map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {isEditMode ? (
                      <div className="flex-1 flex gap-2">
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
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() =>
                            handleRemoveArrayField("what_we_do", index)
                          }
                          className="text-red-600 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-700">{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* What We Don't Do */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  What We Don't Do
                </h3>
                {isEditMode && (
                  <button
                    onClick={() => handleAddArrayField("what_we_dont")}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Add
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {(isEditMode
                  ? editForm.what_we_dont
                  : selectedService.weDont || []
                ).map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    {isEditMode ? (
                      <div className="flex-1 flex gap-2">
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
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() =>
                            handleRemoveArrayField("what_we_dont", index)
                          }
                          className="text-red-600 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-700">{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* How It's Done */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">How It's Done</h3>
                {isEditMode && (
                  <button
                    onClick={() => handleAddArrayField("how_its_done")}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Add
                  </button>
                )}
              </div>
              <ol className="space-y-2">
                {(isEditMode
                  ? editForm.how_its_done
                  : selectedService.howItsDone || []
                ).map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold mt-1">
                      {index + 1}.
                    </span>
                    {isEditMode ? (
                      <div className="flex-1 flex gap-2">
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
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() =>
                            handleRemoveArrayField("how_its_done", index)
                          }
                          className="text-red-600 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-700">{item}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-3">
              {isEditMode ? (
                <>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSaveService}
                  >
                    {isAddMode ? "Create Service" : "Save Changes"}
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
