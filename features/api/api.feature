@api @regression
Feature: REST API Testing
  As a QA Engineer
  I want to validate API endpoints
  So that I can ensure backend services work correctly

  Background:
    Given the API base URL is configured
    And I have a valid authentication token

  @smoke @api-auth
  Scenario: Authenticate and retrieve access token
    When I send a POST request to "/auth/login" with:
      | username | testuser@example.com |
      | password | SecurePass123!       |
    Then the response status code should be 200
    And the response should contain "access_token"
    And the response should contain "token_type"

  @api-users @smoke
  Scenario: Get current user profile
    Given I am authenticated as "testuser@example.com"
    When I send a GET request to "/users/me"
    Then the response status code should be 200
    And the response body should match schema "user-profile"
    And the response field "email" should equal "testuser@example.com"

  @api-users
  Scenario: Create a new user resource
    Given I have a new user payload
    When I send a POST request to "/users" with the payload
    Then the response status code should be 201
    And the response should contain "id"
    And the response field "status" should equal "active"

  @api-users
  Scenario: Update user profile
    Given an existing user with id "USR-001"
    When I send a PUT request to "/users/USR-001" with:
      | firstName | UpdatedFirst |
      | lastName  | UpdatedLast  |
    Then the response status code should be 200
    And the response field "firstName" should equal "UpdatedFirst"

  @api-users
  Scenario: Delete a user resource
    Given an existing user with id "USR-DEL-001"
    When I send a DELETE request to "/users/USR-DEL-001"
    Then the response status code should be 204

  @api-error
  Scenario: Handle unauthorized access
    Given I have an invalid authentication token
    When I send a GET request to "/users/me"
    Then the response status code should be 401
    And the response should contain "Unauthorized"

  @api-error
  Scenario: Handle not found resource
    Given I am authenticated as "testuser@example.com"
    When I send a GET request to "/users/NONEXISTENT-999"
    Then the response status code should be 404
    And the response should contain "Not Found"

  @api-error
  Scenario: Handle validation errors
    Given I am authenticated as "testuser@example.com"
    When I send a POST request to "/users" with invalid payload
    Then the response status code should be 422
    And the response should contain "validation_errors"

  @api-performance
  Scenario: Verify API response time is within threshold
    Given I am authenticated as "testuser@example.com"
    When I send a GET request to "/users/me"
    Then the response time should be less than 2000 milliseconds

  @api-pagination
  Scenario Outline: Paginate through user list
    Given I am authenticated as "testuser@example.com"
    When I send a GET request to "/users?page=<page>&limit=<limit>"
    Then the response status code should be 200
    And the response should contain "<expectedCount>" items

    Examples:
      | page | limit | expectedCount |
      | 1    | 10    | 10            |
      | 2    | 10    | 10            |
      | 1    | 25    | 25            |
