import { useCallback, useEffect, useState } from "react";
import "../../App.css";
import AddressAutocomplete from "./AddressAutocomplete";
import SocialMediaLinks from "./SocialMediaLinks";
import { API_URL, DAYS_OF_WEEK, TIME_OPTIONS } from "./providerHelpers";

function CreateResourceContent({ onViewDetails, providerId, userId }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    street_address: "",
    city: "",
    state: "GA",
    zip: "",
    phone: "",
    website: "",
    languages: "",
    social_media_links: [],
    description: "",
    eligibility_requirements: "",
    image_url: "",
    latitude: null,
    longitude: null,
  });
  const [hours, setHours] = useState(() => {
    const init = {};
    DAYS_OF_WEEK.forEach((day, i) => {
      init[day.toLowerCase()] = {
        closed: i >= 5,
        open: i < 5 ? "09:00" : "",
        close: i < 5 ? "17:00" : "",
      };
    });
    return init;
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Called when the user selects a Places Autocomplete suggestion
  const handleAddressSelect = useCallback((addressData) => {
    setFormData((prev) => ({
      ...prev,
      street_address: addressData.street_address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    }));
  }, []);

  const handleHoursChange = (day, field, value) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleClosedToggle = (day) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed,
        open: !prev[day].closed ? "" : prev[day].open,
        close: !prev[day].closed ? "" : prev[day].close,
      },
    }));
  };

  const handleAddCategory = (e) => {
    const categoryId = e.target.value;
    if (!categoryId) return;
    const category = categories.find(
      (c) => String(c.category_id) === String(categoryId),
    );
    if (
      category &&
      !selectedCategories.find((c) => c.category_id === category.category_id)
    ) {
      setSelectedCategories((prev) => [...prev, category]);
    }
    e.target.value = "";
  };

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.filter((c) => c.category_id !== categoryId),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.street_address ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (selectedCategories.length === 0) {
      alert("Please select at least one resource type.");
      return;
    }

    // Validate hours: each non-closed day needs open & close
    for (const day of DAYS_OF_WEEK) {
      const dayKey = day.toLowerCase();
      const d = hours[dayKey];
      if (!d.closed) {
        if (!d.open || !d.close) {
          alert(
            `Please set open and close times for ${day}, or mark it as closed.`,
          );
          return;
        }
        if (d.close <= d.open) {
          alert(`Close time must be after open time for ${day}.`);
          return;
        }
      }
    }

    const payload = {
      provider_id: providerId,
      name: formData.name,
      street_address: formData.street_address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      hours: JSON.stringify(hours),
      category_ids: selectedCategories.map((c) => c.category_id),
      contact_phone: formData.phone.replace(/\D/g, ""),
      website: formData.website || null,
      languages_spoken: formData.languages || null,
      social_media_links:
        formData.social_media_links.length > 0
          ? JSON.stringify(formData.social_media_links)
          : null,
      description: formData.description || null,
      eligibility_requirements: formData.eligibility_requirements || null,
      image_url: formData.image_url || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    try {
      const response = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to create resource.");
        return;
      }

      alert("Resource created successfully!");
      setFormData({
        name: "",
        street_address: "",
        city: "",
        state: "GA",
        zip: "",
        phone: "",
        website: "",
        languages: "",
        social_media_links: [],
        description: "",
        eligibility_requirements: "",
        image_url: "",
        latitude: null,
        longitude: null,
      });
      setSelectedCategories([]);
      setHours(() => {
        const init = {};
        DAYS_OF_WEEK.forEach((day, i) => {
          init[day.toLowerCase()] = {
            closed: i >= 5,
            open: i < 5 ? "09:00" : "",
            close: i < 5 ? "17:00" : "",
          };
        });
        return init;
      });
    } catch (err) {
      console.error("Error creating resource:", err);
      alert("An error occurred while creating the resource.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Resource Name */}
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Resource Name <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="name"
          placeholder="Enter resource name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <AddressAutocomplete
        formData={formData}
        onChange={handleChange}
        onAddressSelect={handleAddressSelect}
      />

      {/* Hours of Operation */}
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Days and Hours of Operation <span className="text-danger">*</span>
          </strong>
        </label>
        {DAYS_OF_WEEK.map((day) => {
          const dayKey = day.toLowerCase();
          const dayData = hours[dayKey];
          return (
            <div key={day} className="row align-items-center mb-2">
              <div className="col-3 col-md-2">
                <strong>{day.slice(0, 3)}</strong>
              </div>
              <div className="col-3 col-md-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`closed-${dayKey}`}
                    checked={dayData.closed}
                    onChange={() => handleClosedToggle(dayKey)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`closed-${dayKey}`}
                  >
                    Closed
                  </label>
                </div>
              </div>
              <div className="col-3 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={dayData.open}
                  disabled={dayData.closed}
                  onChange={(e) =>
                    handleHoursChange(dayKey, "open", e.target.value)
                  }
                >
                  <option value="">Open</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-3 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={dayData.close}
                  disabled={dayData.closed}
                  onChange={(e) =>
                    handleHoursChange(dayKey, "close", e.target.value)
                  }
                >
                  <option value="">Close</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Type of Resource */}
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Type of Resource <span className="text-danger">*</span>
          </strong>
        </label>
        {selectedCategories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat.category_id}
                className="badge rounded-pill d-flex align-items-center"
                style={{
                  backgroundColor: "#c5a24d",
                  color: "#fff",
                  fontSize: "0.9rem",
                  padding: "0.4em 0.8em",
                }}
              >
                {cat.name}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => handleRemoveCategory(cat.category_id)}
                  aria-label="Remove"
                />
              </span>
            ))}
          </div>
        )}
        <select
          className="form-select"
          onChange={handleAddCategory}
          defaultValue=""
        >
          <option value="">Select resource type(s)</option>
          {categories
            .filter(
              (cat) =>
                (cat.type === "resource" || cat.type === "both") &&
                !selectedCategories.find(
                  (sc) => sc.category_id === cat.category_id,
                ),
            )
            .map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
        </select>
      </div>

      {/* Phone Number */}
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Phone Number <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="tel"
          className="form-control"
          name="phone"
          placeholder="(555) 555-5555"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      {/* Website URL */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Website URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="website"
          placeholder="https://example.com"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      {/* Languages */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Languages</strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="languages"
          placeholder="e.g., English, Spanish, Vietnamese"
          value={formData.languages}
          onChange={handleChange}
        />
      </div>

      {/* Social Media Links */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Social Media Links</strong>
        </label>
        <SocialMediaLinks
          links={formData.social_media_links}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, social_media_links: val }))
          }
        />
      </div>

      {/* Image URL */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Image URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="image_url"
          placeholder="https://example.com/image.jpg"
          value={formData.image_url}
          onChange={handleChange}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Resource Description</strong>
        </label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          placeholder="Describe the resource..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* Eligibility */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Resource Eligibility Details</strong>
        </label>
        <textarea
          className="form-control"
          name="eligibility_requirements"
          rows="3"
          placeholder="Describe eligibility requirements..."
          value={formData.eligibility_requirements}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn-gold">
        Create Resource
      </button>
    </form>
  );
}

export default CreateResourceContent;
