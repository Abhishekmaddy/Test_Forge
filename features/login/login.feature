@login @regression
Feature: User Authentication - Login
  As a registered user
  I want to be able to log in to the application
  So that I can access my account and its features

  Background:
    Given I am on the login page

  @smoke @critical
  Scenario: Successful login with valid credentials
    When I enter valid email "test@example.com"
    And I enter valid password "SecurePass123!"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  @negative @security
  Scenario: Login fails with invalid email
    When I enter invalid email "invalid-email"
    And I enter valid password "SecurePass123!"
    And I click the login button
    Then I should see the error message "Please enter a valid email address"
    And I should remain on the login page

  @negative @security
  Scenario: Login fails with wrong password
    When I enter valid email "test@example.com"
    And I enter invalid password "wrongpassword"
    And I click the login button
    Then I should see the error message "Invalid credentials. Please try again."
    And I should remain on the login page

  @negative @security
  Scenario: Login fails with empty fields
    When I click the login button without entering credentials
    Then I should see validation errors for required fields
    And I should remain on the login page

  @security @brute-force
  Scenario: Account lockout after multiple failed attempts
    When I attempt login with invalid credentials 5 times
    Then I should see the account lockout message
    And the login button should be disabled

  @functional @remember-me
  Scenario: Login with Remember Me option
    When I enter valid email "test@example.com"
    And I enter valid password "SecurePass123!"
    And I check the Remember Me option
    And I click the login button
    Then I should be redirected to the dashboard
    And the session should persist

  @security @password-visibility
  Scenario: Password visibility toggle
    When I enter valid password "SecurePass123!"
    Then the password field should be masked
    When I click the show password toggle
    Then the password field should be visible
    When I click the show password toggle again
    Then the password field should be masked again

  @ui @accessibility
  Scenario: Login page accessibility verification
    Then the login page should have proper labels
    And the login page should have proper tab order
    And the login button should be keyboard accessible

  @functional @forgot-password
  Scenario: Navigate to Forgot Password page
    When I click the Forgot Password link
    Then I should be redirected to the forgot password page
    And I should see the password reset form

  @data-driven
  Scenario Outline: Login with multiple user roles
    When I enter valid email "<email>"
    And I enter valid password "<password>"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should have "<role>" permissions

    Examples:
      | email                  | password       | role  |
      | admin@example.com      | AdminPass123!  | admin |
      | user@example.com       | UserPass123!   | user  |
      | manager@example.com    | MgrPass123!    | manager |
      | readonly@example.com   | ReadPass123!   | viewer |

  @security @sql-injection
  Scenario: Login with SQL injection attempts should be rejected
    When I enter email "' OR '1'='1"
    And I enter password "' OR '1'='1"
    And I click the login button
    Then I should see the error message "Invalid credentials. Please try again."

  @performance @smoke
  Scenario: Login page should load within acceptable time
    Then the login page should have loaded within 3 seconds
    And all page elements should be rendered

  @session @security
  Scenario: Logout clears session properly
    Given I am logged in as "test@example.com" with password "SecurePass123!"
    When I click the logout button
    Then I should be redirected to the login page
    And I should not be able to access the dashboard without logging in
