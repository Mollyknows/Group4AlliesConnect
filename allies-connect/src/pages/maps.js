import React, { useState } from "react";
import { Container, Form } from "react-bootstrap";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import mapPins from "../data/mapPins.json";
import '../App.css';

const API_KEY = process.env.REACT_APP_MAP_API_KEY || "";
// Set the center of the map to the middle of Atlanta
const DEFAULT_CENTER = { lat: 33.7490, lng: -84.3880 };

function Maps() {
    const [filters, setFilters] = useState({
        yellow: true,
        green: true,
        blue: true,
        pink: true
    });

    const handleFilterChange = (color) => {
        setFilters((prev) => ({
            ...prev,
            [color]: !prev[color]
        }));
    };

    const filteredPins = mapPins.filter((pin) => filters[pin.color]);

    return (
        <Container fluid style={{ height: "calc(100vh - 80px)", padding: 0, position: "relative" }}>

            {/* Filter Overlay UI */}
            <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: "200px"
            }}>
                <h5 className="mb-3" style={{ color: "var(--gold)" }}>Filters</h5>

                <Form>
                    <div className="d-flex align-items-center mb-2">
                        <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#fff579", borderRadius: "50%", marginRight: "10px" }}></span>
                        <Form.Check
                            type="checkbox"
                            label="Events"
                            checked={filters.yellow}
                            onChange={() => handleFilterChange("yellow")}
                            id="filter-yellow"
                            className="mb-0"
                        />
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#00e85f", borderRadius: "50%", marginRight: "10px" }}></span>
                        <Form.Check
                            type="checkbox"
                            label="Food Assistance"
                            checked={filters.green}
                            onChange={() => handleFilterChange("green")}
                            id="filter-green"
                            className="mb-0"
                        />
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#5d94f8", borderRadius: "50%", marginRight: "10px" }}></span>
                        <Form.Check
                            type="checkbox"
                            label="Housing"
                            checked={filters.blue}
                            onChange={() => handleFilterChange("blue")}
                            id="filter-blue"
                            className="mb-0"
                        />
                    </div>
                    <div className="d-flex align-items-center">
                        <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#e95daa", borderRadius: "50%", marginRight: "10px" }}></span>
                        <Form.Check
                            type="checkbox"
                            label="Legal"
                            checked={filters.pink}
                            onChange={() => handleFilterChange("pink")}
                            id="filter-pink"
                            className="mb-0"
                        />
                    </div>
                    <div className="d-flex align-items-center mt-3">
                        <Form.Label className="mb-0 me-2" style={{ fontWeight: 500 }}>Distance</Form.Label>
                        <Form.Control
                            type="number"
                            min="0"
                            max="999"
                            style={{ width: "70px", padding: "0.25rem 0.5rem" }}
                            className="me-2 text-center"
                        />
                        <span style={{ fontWeight: 500 }}>miles</span>
                    </div>
                </Form>
            </div>

            <APIProvider apiKey={API_KEY}>
                <Map
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={10}
                    gestureHandling={"greedy"}
                >
                    {filteredPins.map((pin) => (
                        <Marker
                            key={pin.id}
                            position={pin.position}
                            title={pin.name}
                            icon={{
                                url: `http://maps.google.com/mapfiles/ms/icons/${pin.color}-dot.png`
                            }}
                        />
                    ))}
                </Map>
            </APIProvider>
        </Container>
    );
}

export default Maps;