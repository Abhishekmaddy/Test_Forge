@irctc
Feature: IRCTC Tatkal Seat Availability Search
  As a passenger
  I want to search trains and check Tatkal-quota seat availability on IRCTC
  So that I can decide whether to attempt a Tatkal booking

  # Scope: this suite only exercises the public train-search and seat-
  # availability screens. It does not log in, fill passenger details, enter
  # payment information, or submit a booking — automating an actual ticket
  # purchase is against IRCTC's terms of service and Section 143 of the
  # Railways Act, 1989.

  @smoke @irctc
  Scenario: Search for trains between two stations and view Tatkal availability
    Given I open the IRCTC train search page
    When I search trains from "NDLS" to "BCT" on "2026-06-25"
    Then the train search results should be displayed
    And I check Tatkal availability for the first train's first class
    And the Tatkal availability status should be one of the known statuses

  @negative @irctc
  Scenario: Searching with the same origin and destination is rejected
    Given I open the IRCTC train search page
    When I search trains from "NDLS" to "NDLS" on "2026-06-25"
    Then a validation error should be shown for the station selection
    And no train search results should be displayed

  @negative @irctc
  Scenario: Searching with a past journey date is rejected
    Given I open the IRCTC train search page
    When I search trains from "NDLS" to "BCT" on "2020-01-01"
    Then a validation error should be shown for the journey date
    And no train search results should be displayed

  @edge-case @irctc
  Scenario: Searching with an unrecognized destination station yields no results
    Given I open the IRCTC train search page
    When I search trains from "NDLS" to "ZZZZ" on "2026-06-25"
    Then a no-trains outcome should be displayed

  @ui @irctc
  Scenario: Train search form renders all required fields
    Given I open the IRCTC train search page
    Then the origin station field should be visible
    And the destination station field should be visible
    And the journey date field should be visible
    And the search button should be visible

  @security @irctc
  Scenario: Station field does not execute injected script
    Given I open the IRCTC train search page
    When I search for the XSS payload "<script>alert(1)</script>" as the origin station
    Then no script alert should be triggered on the IRCTC search form
