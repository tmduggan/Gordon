# Cart Component Functionality (Current State)

## Overview
The cart in this app allows users to add, edit, and remove both food and exercise items. The UI and logic differ for food and exercise entries, with special handling for serving sizes, units, and exercise set logging.

---

## Food Items
- **Serving Size Editor:**
  - Each food item displays a `ServingSizeEditor` component.
  - Users can adjust the quantity and unit (e.g., grams, cups, pieces) for most foods.
  - Some foods do **not** allow changing to 'g' (grams) if their data structure lacks the necessary conversion info.
  - The serving size editor updates the food's macros and nutrition info in real time.
- **Recipe Items:**
  - Foods that are part of a recipe are labeled with a badge and show the recipe name.
- **Info Dialog:**
  - Each food item has an info button that opens a dialog with a detailed nutrition label.
- **Remove Food:**
  - Each food item has a remove (X) button to delete it from the cart.

---

## Exercise Items
- **Exercise Info:**
  - Each exercise displays its name and an info button (shows details or instructions).
- **Set Logging:**
  - Each exercise allows logging multiple sets.
  - For strength exercises:
    - Each set has input fields for weight and reps.
    - The last set from the user's history is shown as a faded placeholder in the inputs.
    - A checkmark button marks a set as visually complete (no backend effect).
    - Sets can be added or removed (removal is swipe-to-delete on mobile, X button on desktop).
  - For bodyweight exercises:
    - Only reps input is shown (no weight).
  - For cardio exercises:
    - Only a duration input is shown (no sets, weight, or reps).
- **Remove Exercise:**
  - Each exercise has a menu ("..." button) with a 'Remove Exercise' option, which opens a confirmation dialog before removal.

---

## General Cart Features
- **Responsive Design:**
  - The cart adapts to mobile and desktop layouts.
  - On mobile, set rows are swipeable for deletion; on desktop, an X button is used.
- **State Management:**
  - Cart state is managed via React state and custom hooks.
  - Updates to serving sizes, sets, or removals are reflected immediately in the UI.

---

## Known Special Cases
- Some foods do not allow unit conversion to grams due to missing data.
- Recipe items are visually distinct and may have different editing/removal logic.
- Exercise set input fields and controls vary based on exercise type (strength, bodyweight, cardio).

---

**Please review and let me know if anything is missing or incorrect before we proceed with the refactor.** 