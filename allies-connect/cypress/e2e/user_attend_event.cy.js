describe("User Attend Event Flow", () => {
  beforeEach(() => {
    // Intercept backend login endpoints to seamlessly simulate a logged-in user
    cy.intercept("POST", "http://localhost:5000/api/auth/login", {
      statusCode: 200,
      body: {
        message: "Login successful",
        user_id: 777,
        roles: ["volunteer"],
      },
    }).as("loginRequest");

    cy.intercept("GET", "**/api/users/profile/777", {
      statusCode: 200,
      body: {
        user_id: 777,
        first_name: "Test",
        last_name: "User",
        email: "user@example.com",
      },
    }).as("profileRequest");

    // Intercept the events endpoint to predictably serve one Event
    cy.intercept("GET", "**/api/events", {
      statusCode: 200,
      body: [
        {
          event_id: 88,
          title: "Public Education Seminar",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T16:00:00Z",
          category_name: "Educational Workshop",
          city: "Atlanta",
          state: "GA",
          provider_name: "Education Alliance",
          description: "A free seminar open to the public!",
          street_address: "123 Main St",
          zip: "30303",
        },
      ],
    }).as("getEvents");

    // Mock for the attend endpoint
    cy.intercept("POST", "**/api/events/88/attend", {
      statusCode: 200,
      body: { message: "Attendance recorded" },
    }).as("postAttend");
  });

  it("allows a logged-in user to view an event and mark themselves as attending", () => {
    // 1. Visit Login Page
    cy.visit("/login");

    // 2. Fill out the authentication form
    cy.get('input[name="username"]').type("test_user");
    cy.get('input[name="password"]').type("Password123!");
    cy.get("select").select("volunteer"); // Select 'Volunteer' role
    cy.get("button.btn-gold").contains("Login").click({ force: true });

    // Verify login network requests fired
    cy.wait("@loginRequest");
    cy.wait("@profileRequest");

    // We should be redirected automatically
    cy.url().should("include", "/volunteer");

    // 3. Click the header logo to go to the Home page
    cy.get('.navbar-brand img[alt="Allies Connect logo"]').click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // 4. Click the "Events" button on the Home page
    cy.contains(".btn-gold", "Events").click();
    cy.url().should("include", "/events");
    cy.wait("@getEvents");

    // 5. Find our mocked event on the page and click it to open the Event Details Modal
    cy.contains("Public Education Seminar").should("be.visible").click();

    // 6. Assert the modal opens and contains the "Attend Event" button
    cy.get(".modal").should("be.visible");
    cy.get(".modal").contains("Education Alliance");

    // 7. Click the "Attend Event" button
    cy.get(".modal").contains("Attend Event", { matchCase: false }).click();
    cy.wait("@postAttend");

    // 8. Assert that the button changes to a disabled "✓ Attending" confirmation
    cy.get(".modal").within(() => {
      cy.get("button")
        .contains("Attending", { matchCase: false })
        .should("be.visible")
        .and("be.disabled");
    });
  });
});
