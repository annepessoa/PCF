# Field Comparer PCF Control

A PowerApps Component Framework (PCF) control that compares date or numeric fields and visually indicates the comparison result with customizable labels and icons.

## Overview

The **Field Comparer** control provides a flexible way to compare two date fields or two numeric fields in Power Apps/Dynamics 365 forms. It displays a visual indicator (icon and label) showing whether the comparison passed or failed based on the selected comparison mode.

## Features

- **Multiple Comparison Modes:**
  - **After/Higher Than**: Check if the second value is after/greater than the first
  - **Before/Lower Than**: Check if the second value is before/less than the first
  - **Equal**: Check if values are equal
  - **Not Equal**: Check if values are different
  - **In The Future**: Check if a date is in the future (relative to today)
  - **In The Past**: Check if a date is in the past (relative to today)

- **Flexible Field Types:**
  - Supports date fields (DateAndTime.DateOnly, DateAndTime.DateAndTime)
  - Supports numeric fields (Decimal, Currency, Whole.None)

- **Visual Feedback:**
  - Color-coded results (success/failure/neutral)
  - Optional emoji icons for quick visual identification
  - Customizable labels for both fields

- **Result Persistence:**
  - Optional feature to save comparison results to a text field
  - Useful for reporting and workflow triggers

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `result` | SingleLine.Text | Yes | Bound field to display/save the comparison result |
| `saveResult` | TwoOptions | No | When enabled, writes the comparison result to the result field |
| `showIcons` | TwoOptions | No | When enabled, displays an emoji icon next to the result label |
| `comparisonMode` | Enum | Yes | The comparison operation to perform |
| `firstDate` | Date | No* | First date field to compare |
| `firstNumber` | Number | No* | First numeric field to compare |
| `firstLabel` | SingleLine.Text | No | Friendly label for the first field |
| `secondDate` | Date | No* | Second date field to compare |
| `secondNumber` | Number | No* | Second numeric field to compare |
| `secondLabel` | SingleLine.Text | No | Friendly label for the second field |

\* At least one field from each pair (firstDate/firstNumber and secondDate/secondNumber) should be bound depending on the comparison type.
