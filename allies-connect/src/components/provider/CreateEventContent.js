import { useCallback, useEffect, useState } from "react";
import "../../App.css";
import AddressAutocomplete from "./AddressAutocomplete";
import ShiftBuilder from "./ShiftBuilder";
import { API_URL, TIME_OPTIONS } from "./providerHelpers";

function CreateEventContent({ onViewDetails, providerId }) {
  const [categories, setCategories] = useState([]);
  const [provider, setProvider] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    provider_id: providerId || "",
    street_address: "",
    city: "",
    state: "",
    zip: "",
    event_date: "",
    start_time: "",
    end_time: "",
    description: "",
    capacity: "",
    image_url: "",
    flyer_url: "",
    latitude: null,
    longitude: null,
    volunteer_only: false,
  });
  const [timeError, setTimeError] = useState("");
  const [dateError, setDateError] = useState("");
  const [shifts, setShifts] = useState([]);

  // Reset shifts to a single shift whenever event start/end times change
  useEffect(() => {
    if (
      formData.start_time &&
      formData.end_time &&
      formData.end_time > formData.start_time
    ) {
      setShifts([
        { start: formData.start_time, end: formData.end_time, capacity: "" },
      ]);
    } else {
      setShifts([]);
    }
  }, [formData.start_time, formData.end_time]);

  useEffect(() => {
    fetchCategories();
    if (providerId) {
      fetchProvider();
    }
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

  const fetchProvider = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/organizations/profile/${providerId}`,
      );
      const data = await response.json();
      setProvider(data);
      setFormData((prev) => ({ ...prev, provider_id: data.provider_id }));
    } catch (error) {
      console.error("Error fetching provider:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "start_time" || name === "end_time") {
        if (
          updated.start_time &&
          updated.end_time &&
          updated.end_time <= updated.start_time
        ) {
          setTimeError("End time must be after start time.");
        } else {
          setTimeError("");
        }
      }
      if (name === "event_date") {
        const today = new Date().toISOString().split("T")[0];
        if (value && value < today) {
          setDateError("Event date cannot be in the past.");
        } else {
          setDateError("");
        }
      }
      return updated;
    });
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
      !formData.title ||
      !formData.provider_id ||
      !formData.street_address ||
      !formData.city ||
      !formData.state ||
      !formData.zip ||
      !formData.event_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    if (formData.end_time <= formData.start_time) {
      setTimeError("End time must be after start time.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (formData.event_date < today) {
      setDateError("Event date cannot be in the past.");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one event type.");
      return;
    }

    // Convert a local date+time to a UTC MySQL datetime string.
    // new Date("YYYY-MM-DDTHH:mm:ss") is treated as LOCAL time by browsers.
    const toUTCMysql = (date, time) => {
      const d = new Date(`${date}T${time}:00`);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
    };

    // Bundle all form data for the backend
    const startDatetime = toUTCMysql(formData.event_date, formData.start_time);
    const endDatetime = toUTCMysql(formData.event_date, formData.end_time);

    const eventShifts = shifts.map((shift, index) => ({
      shift_number: index + 1,
      start_time: toUTCMysql(formData.event_date, shift.start),
      end_time: toUTCMysql(formData.event_date, shift.end),
      capacity:
        shift.capacity !== "" && shift.capacity != null
          ? Math.max(1, Number(shift.capacity))
          : 1,
    }));

    const payload = {
      title: formData.title,
      provider_id: formData.provider_id,
      street_address: formData.street_address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      event_date: formData.event_date,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      description: formData.description,
      capacity:
        formData.capacity !== "" && formData.capacity != null
          ? Number(formData.capacity)
          : null,
      category_ids: selectedCategories.map((c) => c.category_id),
      shifts: eventShifts,
      image_url: formData.image_url || null,
      flyer_url: formData.flyer_url || null,
      volunteer_only: formData.volunteer_only,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to create event.");
        return;
      }

      alert("Event created successfully!");
      // Reset form
      setFormData({
        title: "",
        provider_id: providerId || "",
        street_address: "",
        city: "",
        state: "",
        zip: "",
        event_date: "",
        start_time: "",
        end_time: "",
        description: "",
        capacity: "",
        image_url: "",
        flyer_url: "",
        latitude: null,
        longitude: null,
        volunteer_only: false,
      });
      setSelectedCategories([]);
      setShifts([]);
    } catch (err) {
      console.error("Error creating event:", err);
      alert("An error occurred while creating the event.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Event Name <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="title"
          placeholder="Enter event name"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Event Sponsor <span className="text-danger">*</span>
          </strong>
        </label>
        <div
          className="form-control-plaintext"
          style={{ paddingTop: "0.375rem" }}
        >
          {provider?.name || "Loading..."}
        </div>
      </div>
      <AddressAutocomplete
        formData={formData}
        onChange={handleChange}
        onAddressSelect={handleAddressSelect}
      />
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Date <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="date"
          className={`form-control${dateError ? " is-invalid" : ""}`}
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
          min={new Date().toISOString().split("T")[0]}
          required
        />
        {dateError && (
          <div className="invalid-feedback d-block">{dateError}</div>
        )}
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">
            <strong>
              Time Start <span className="text-danger">*</span>
            </strong>
          </label>
          <select
            className="form-select"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
          >
            <option value="">Select start time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <strong>
              Time End <span className="text-danger">*</span>
            </strong>
          </label>
          <select
            className="form-select"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            required
          >
            <option value="">Select end time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {timeError && (
        <div className="text-danger mb-3" style={{ marginTop: "-0.75rem" }}>
          {timeError}
        </div>
      )}
      <ShiftBuilder
        startTime={formData.start_time}
        endTime={formData.end_time}
        shifts={shifts}
        onShiftsChange={setShifts}
      />
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Type of Event <span className="text-danger">*</span>
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
          <option value="">Select event type(s)</option>
          {categories
            .filter(
              (cat) =>
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
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Capacity</strong>
        </label>
        <input
          type="number"
          className="form-control"
          name="capacity"
          placeholder="Leave empty for no limit"
          min="0"
          value={formData.capacity}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Description</strong>
        </label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          placeholder="Describe the event..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Image URL</strong>
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
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Flyer URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="flyer_url"
          placeholder="https://example.com/flyer.pdf"
          value={formData.flyer_url}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="volunteerOnly"
          checked={formData.volunteer_only}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              volunteer_only: e.target.checked,
            }))
          }
        />
        <label className="form-check-label" htmlFor="volunteerOnly">
          <strong>Volunteer Only</strong>
          <span className="text-muted ms-2" style={{ fontSize: "0.875rem" }}>
            (Only visible to volunteers, providers, and admins)
          </span>
        </label>
      </div>
      <button type="submit" className="btn-gold">
        Create Event
      </button>
    </form>
  );
}

export default CreateEventContent;
