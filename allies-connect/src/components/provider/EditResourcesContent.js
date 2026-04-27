import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import "../../App.css";
import { API_URL, useTableDataProcessing } from "./providerHelpers";

function EditResourcesContent({ onViewDetails, providerId }) {
  const [resources, setResources] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(resources, "name");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_URL}/api/resources`);
      const data = await response.json();
      const providerResources = Array.isArray(data)
        ? data.filter((r) => r.provider_id === providerId)
        : [];
      setResources(providerResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by resource name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("name")}
              aria-label="Sort by name">
              Name {sortSymbol("name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("category_name")}
              aria-label="Sort by category">
              Category {sortSymbol("category_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("city")}
              aria-label="Sort by location">
              Location {sortSymbol("city")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-muted">
                No resources found.
              </td>
            </tr>
          ) : (
            sortedData.map((resource) => (
              <tr
                key={resource.resource_id}
                className="text-center align-middle"
              >
                <td>{resource.name}</td>
                <td>{resource.category_name}</td>
                <td>
                  {resource.city}, {resource.state}
                </td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("editResources", resource)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}

export default EditResourcesContent;