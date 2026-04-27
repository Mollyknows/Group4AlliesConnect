describe("Map Distance Filter Flow", () => {
  beforeEach(() => {
    // Intercept the backend calls to make map pins deterministic
    // This allows us to exactly test the Haversine radius math without depending on live dynamic DB data!
    cy.intercept("GET", "**/api/categories", {
      statusCode: 200,
      body: [{ name: "Events" }, { name: "Food Assistance" }],
    }).as("getCategories");

    cy.intercept("GET", "**/api/events", {
      statusCode: 200,
      body: [
        {
          event_id: 1,
          title: "Close Event",
          // Approx 33.785, -84.388 (Midtown Atlanta, right on West Peachtree)
          latitude: "33.7855",
          longitude: "-84.3880",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T14:00:00Z",
          street_address_1: "1105 West Peachtree St NW",
          city: "Atlanta",
          state: "GA",
          zip: "30309",
        },
        {
          event_id: 2,
          title: "Far Event",
          // Marietta (approx 15 miles away)
          latitude: "33.9526",
          longitude: "-84.5499",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T14:00:00Z",
        },
      ],
    }).as("getEvents");

    cy.intercept("GET", "**/api/resources", {
      statusCode: 200,
      body: [
        {
          resource_id: 1,
          name: "Medium Distance Resource",
          category_name: "Food Assistance",
          // About 1 mile away from West Peachtree (Downtown)
          latitude: "33.765",
          longitude: "-84.390",
        },
      ],
    }).as("getResources");

    // Intercept the Google Geocoding API so the test doesn't need a real API key
    cy.intercept("GET", "https://maps.googleapis.com/maps/api/geocode/json*", {
      statusCode: 200,
      body: {
        status: "OK",
        results: [
          {
            geometry: {
              location: { lat: 33.7855, lng: -84.388 },
            },
            formatted_address: "1105 West Peachtree St NW, Atlanta, GA 30309",
          },
        ],
      },
    }).as("geocodeRequest");
  });

  it("filters out pins that are further than 2 miles away", () => {
    // Non-logged in user accesses maps page
    cy.visit("/maps");

    // Wait for the pins to load
    cy.wait("@getCategories");
    cy.wait("@getEvents");
    cy.wait("@getResources");

    // Initially, there should be 3 markers on the map
    // Initially, wait for the map UI to render
    cy.wait(500);

    // Click the Set My Location button if the modal isn't already automatically opened by the desktop environment
    cy.get("body").then(($body) => {
      if ($body.find(".modal.show").length === 0) {
        cy.get("button")
          .contains("Set my location", { matchCase: false })
          .click();
      }
    });

    // The address modal should be visible. User enters the address
    // force:true is required because the Maps API key may be restricted in CI,
    // which causes the Places Autocomplete to disable the input with an error state
    cy.get('input[placeholder*="Atlanta" i]')
      .should("be.visible")
      .type("1105 West Peachtree, Atlanta GA", { force: true });
    cy.get("button").contains("Center Map", { matchCase: false }).click();
    cy.wait("@geocodeRequest");

    // Now, user applies the distance filter for 2 miles
    cy.get('input[type="number"]').clear().type("2");

    // After filtering is applied, we expect the map to only have 2 markers left
    // The "Far Event" (15 miles out) should be dynamically stripped from the DOM or Google Maps cluster
    // Note: Map pins don't render raw text to the DOM, they use 'title' attributes!
    cy.get('[title="Far Event"]').should("not.exist");
    cy.get('[title="Close Event"]').should("exist");
  });
});
