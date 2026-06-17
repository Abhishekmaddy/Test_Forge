@dashboard @regression
Feature: Dashboard Functionality
  As an authenticated user
  I want to interact with the dashboard
  So that I can access my data and perform actions

  Background:
    Given I am logged in as "admin@example.com" with password "Admin@123"
    And I am on the dashboard page

  @smoke @dashboard-load
  Scenario: Dashboard loads successfully after login
    Then the dashboard header should be visible
    And the navigation menu should be visible
    And the welcome message should contain my username
    And the dashboard widgets should be loaded

  @dashboard-navigation
  Scenario: Navigate to different sections from dashboard
    When I click on the "Reports" menu item
    Then I should be on the reports page

  @dashboard-navigation
  Scenario: Navigate using sidebar
    When I click on "Settings" in the sidebar
    Then I should see the settings panel

  @dashboard-widgets
  Scenario: Verify all dashboard widgets are displayed
    Then I should see the "Total Users" widget
    And I should see the "Active Sessions" widget
    And I should see the "Revenue" widget
    And I should see the "Tasks" widget

  @dashboard-widgets
  Scenario: Widget data refreshes on click
    When I click the refresh button on the "Total Users" widget
    Then the widget should show a loading indicator
    And the widget data should update

  @dashboard-search
  Scenario: Global search returns relevant results
    When I type "test report" in the global search bar
    Then the search suggestions should appear
    And the results should contain "test report"

  @dashboard-search
  Scenario: Search with no results shows empty state
    When I type "xyznonexistentterm12345" in the global search bar
    Then the search should show "No results found"

  @dashboard-notifications
  Scenario: View notifications panel
    When I click the notifications icon
    Then the notifications panel should be visible
    And I should see a list of notifications

  @dashboard-notifications
  Scenario: Mark notification as read
    When I click the notifications icon
    And I click "Mark all as read"
    Then all notifications should be marked as read
    And the notification badge should disappear

  @dashboard-profile
  Scenario: Access user profile from dashboard
    When I click on my avatar in the top-right corner
    Then a dropdown menu should appear
    And the dropdown should contain "My Profile"
    And the dropdown should contain "Settings"
    And the dropdown should contain "Logout"

  @dashboard-logout
  Scenario: Logout from dashboard
    When I click on my avatar in the top-right corner
    And I click "Logout"
    Then I should be redirected to the login page
    And I should see the login form

  @dashboard-responsive @accessibility
  Scenario: Dashboard is accessible on mobile viewport
    Given the browser viewport is set to 375x812
    Then the hamburger menu icon should be visible
    And the navigation should be collapsed

  @dashboard-theme
  Scenario: Toggle between light and dark mode
    When I click the theme toggle button
    Then the dashboard should switch to dark mode
    When I click the theme toggle button again
    Then the dashboard should switch to light mode
