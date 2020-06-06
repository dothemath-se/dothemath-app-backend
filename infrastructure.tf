provider "azurerm" {
  version = "2.13.0"
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "dothemath.app"
  location = "northeurope"
}

resource "azurerm_app_service_plan" "asp" {
  name                = "asp-dothemath-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  kind = "app"
  sku {
    tier = "Shared"
    size = "D1"
  }
}

resource "azurerm_app_service" "as" {

  for_each = {
    prod = "dothemath-app-api"
    test = "dothemath-app-api-test"
  }

  name = each.value

  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  app_service_plan_id = azurerm_app_service_plan.asp.id

  https_only = true

  app_settings = {
    SLACK_BOT_TOKEN              = "must be changed outside of terraform"
    SLACK_SIGNING_SECRET         = "must be changed outside of terraform"
    SLACK_USER_TOKEN             = "must be changed outside of terraform"
    WEBSITE_NODE_DEFAULT_VERSION = "10.15.2"
  }

  lifecycle {
    ignore_changes = [
      app_settings["SLACK_BOT_TOKEN"],
      app_settings["SLACK_SIGNING_SECRET"],
      app_settings["SLACK_USER_TOKEN"],
    ]
  }
}
