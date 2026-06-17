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
    And I capture the laptop details in the report
