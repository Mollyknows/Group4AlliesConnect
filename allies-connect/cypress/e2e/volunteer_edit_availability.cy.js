describe("Volunteer Edit Availability Flow", () => {
  beforeEach(() => {
    let mockSchedule = [
      {
        day_of_week: "Monday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Tuesday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Wednesday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Thursday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Friday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Saturday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        day_of_week: "Sunday",
        available: false,
        start_time: "09:00",
        end_time: "17:00",
      },
    ];

    // 1. Intercept Login
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: {
        message: "Login successful",
        user_id: 888,
        roles: ["volunteer"],
      },
    }).as("loginRequest");

    // 2. Intercept Profile
    cy.intercept("GET", "**/api/users/profile/888", {
      statusCode: 200,
      body: {
        user_id: 888,
        first_name: "Avail",
        last_name: "Test",
        email: "avail@example.com",
      },
    }).as("profileRequest");

    // 3. Intercept Availability (Dynamic)
    cy.intercept("GET", "**/api/volunteers/888/availability", (req) => {
      req.reply({
        statusCode: 200,
        body: mockSchedule,
      });
    }).as("getAvailability");

    // 4. Intercept Save Availability
    cy.intercept("PUT", "**/api/volunteers/888/availability", (req) => {
      mockSchedule = req.body.schedule;
      req.reply({
        statusCode: 200,
        body: { message: "Availability saved!" },
      });
    }).as("saveAvailability");

    // 5. Intercept Unavailable Dates (Empty)
    cy.intercept("GET", "**/api/volunteers/888/unavailable-dates", {
      statusCode: 200,
      body: [],
    }).as("getUnavailableDates");
  });

  it("allows a volunteer to edit their weekly availability", () => {
    // 1. Log in as a volunteer
    cy.visit("/login");
    cy.get('input[name="username"]').type("test_volunteer");
    cy.get('input[name="password"]').type("Password123!");
    cy.get("select").select("volunteer");
    cy.get("button.btn-gold").contains("Login").click();

    cy.wait("@loginRequest");
    cy.wait("@profileRequest");
    cy.url().should("include", "/volunteer");

    // 2. Click the image in the upper left corner to go to the home page
    cy.get('.navbar-brand img[alt="Allies Connect logo"]').click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // 3. Click the Dashboard button (in navbar)
    cy.get(".navbar").contains("Dashboard").should("be.visible").click();
    cy.url().should("include", "/volunteer");

    // 4. Click Edit Availability
    cy.contains("button", "Edit Availability").click();
    cy.wait("@getAvailability");
    cy.wait("@getUnavailableDates");

    // 5. Change the 'Available' toggle for Tuesday, then update start/end times.
    //
    // All event-based approaches (cy.trigger, dispatchEvent, native setter) fail because
    // React 17+ processes programmatically dispatched events through an async scheduler,
    // so state updates don't flush synchronously. The only reliable approach is to call
    // React's onChange prop directly via the component's internal __reactFiber reference,
    // which executes synchronously and updates state immediately.
    const fireReactChange = (el, eventProps) => {
      const fiberKey = Object.keys(el).find(
        (k) =>
          k.startsWith("__reactFiber") ||
          k.startsWith("__reactInternalInstance"),
      );
      let node = fiberKey ? el[fiberKey] : null;
      while (node) {
        if (
          node.memoizedProps &&
          typeof node.memoizedProps.onChange === "function"
        ) {
          node.memoizedProps.onChange({ target: { ...eventProps } });
          return;
        }
        node = node.return;
      }
    };

    cy.contains("tr", "Tuesday")
      .find(".form-check-input")
      .then(($el) => {
        fireReactChange($el[0], { checked: true, value: true });
      });

    // Wait for React to re-render (available: true removes disabled from time inputs)
    cy.contains("tr", "Tuesday")
      .find('input[type="time"]')
      .first()
      .should("not.be.disabled")
      .then(($el) => {
        fireReactChange($el[0], { value: "10:00" });
      });

    cy.contains("tr", "Tuesday")
      .find('input[type="time"]')
      .last()
      .should("not.be.disabled")
      .then(($el) => {
        fireReactChange($el[0], { value: "18:00" });
      });

    // 6. Click Save Weekly Schedule
    cy.contains("button", "Save Weekly Schedule").click();
    cy.wait("@saveAvailability");
    cy.contains("Availability saved!").should("be.visible");

    // 7. Close the modal dialog box
    cy.get(".modal-header .btn-close").click();
    cy.get(".modal").should("not.exist");

    // 8. Reopen the modal dialog box
    cy.contains("button", "Edit Availability").click();
    cy.wait("@getAvailability");

    // Confirm that the changes made were retained
    cy.contains("tr", "Tuesday").within(() => {
      cy.get(".form-check-input").should("be.checked");
      cy.get('input[type="time"]').first().should("have.value", "10:00");
      cy.get('input[type="time"]').last().should("have.value", "18:00");
    });
  });
});
