@SCRUM-5
Feature: Flipkart Laptop Search
  As a shopper
  I want to search for a laptop within my budget on Flipkart
  So that I can find and review a suitable laptop to buy

  @smoke @flipkart
  Scenario: Search for a laptop within a price range and verify its details
    Given I open the Flipkart homepage
    When I close the Flipkart login popup using the cross icon
    And I search for "laptop" on Flipkart
    And I open a laptop result priced within "90000"
    Then the laptop product page should be displayed
    And the laptop name should be verified against the search result
    And the laptop price should not exceed the budget of "90000"
    And the laptop product image should be visible
    And I capture the laptop details in the report

  @negative @flipkart
  Scenario: Searching with an unrealistically low budget returns no laptops
    Given I open the Flipkart homepage
    When I close the Flipkart login popup using the cross icon
    And I search for "laptop" on Flipkart
    Then no laptop should be found within a budget of "100"

  @negative @flipkart
  Scenario: Searching with a nonsense term returns no products
    Given I open the Flipkart homepage
    When I close the Flipkart login popup using the cross icon
    And I search for "zzxxqqwweerrttnonsenseproduct12345" on Flipkart expecting no results
    Then no search results should be found

  @security @flipkart
  Scenario: Search input does not execute injected script
    Given I open the Flipkart homepage
    When I close the Flipkart login popup using the cross icon
    And I search for the XSS payload "<script>alert(1)</script>" on Flipkart
    Then no script alert should be triggered

  @edge-case @flipkart
  Scenario: A high budget ceiling returns the same first laptop as an unfiltered search
    Given I open the Flipkart homepage
    When I close the Flipkart login popup using the cross icon
    And I search for "laptop" on Flipkart
    Then a high budget ceiling of "1000000" should return the same first laptop as an unfiltered search
