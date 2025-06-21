# GORDON

GORDON is a web application designed for personal fitness and nutrition tracking. It allows users to log food intake and exercises, monitor their daily macronutrient goals, and maintain a library of foods and exercises. The application is built with React and uses Firebase for backend services, including authentication and Firestore for the database.

## Project Structure

The codebase is organized into a modular structure to separate concerns and improve maintainability.

### Root Files

-   `index.html`: The main HTML entry point for the application.
-   `package.json`: Defines project metadata, dependencies, and scripts.
-   `firebase.json`: Configuration for Firebase hosting and services.
-   `tailwind.config.js`: Configuration file for the Tailwind CSS framework.

### `src/` - Source Code

This directory contains all the application's source code.

#### `src/main.jsx`

The main entry point of the React application. It renders the root `App` component into the DOM.

#### `src/App.jsx`

The root component of the application. It orchestrates all the major pieces of the UI and manages the highest level of state. It handles:
-   The main application view (switching between nutrition and exercise).
-   Integration of all major custom hooks (`useUserProfile`, `useFoodLibrary`, `useCartLogger`, etc.).
-   Rendering of all primary UI components (`SearchBar`, `CartTable`, `PinnedQuickAdd`, `LogTable`, etc.).

#### `src/Auth.jsx`

A component that provides the user authentication flow using Firebase Authentication, offering a simple sign-in interface.

#### `src/api/`

-   `nutritionixAPI.js`: A dedicated module for handling all external API calls to the Nutritionix service. It's responsible for searching for foods and fetching detailed nutritional information.

#### `src/services/`

-   `foodService.js`: This service acts as the intermediary between the application and the Firestore database for all food-related data. It handles creating, reading, and updating food documents in the `foods` collection.

#### `src/hooks/`

Custom React hooks for managing stateful logic and side effects.

-   `useUserProfile.js`: Manages fetching and updating the current user's profile data, including their goals and pinned items.
-   `useFoodLibrary.js`: Orchestrates all food-related logic. It uses `foodService.js` to interact with the database and `nutritionixAPI.js` to fetch data from the external API, providing a unified list of available foods to the app.
-   `useCartLogger.js`: Manages the state and logic for the food cart, including adding, removing, updating, and logging items.
-   `useLogFetcher.js`: Responsible for fetching, grouping, and managing the user's food log entries.

#### `src/firebase/`

-   `firebase.js`: Initializes and configures the Firebase application instance.
-   `firestore/logFoodEntry.js`: A specific function for creating a new food log entry in Firestore.
-   `firestore/logs.js`: Contains functions for fetching and managing food log data from Firestore.

#### `src/components/`

Reusable UI components.

-   `Cart/`: Components related to the food cart.
    -   `CartTable.jsx`: Renders the entire food cart section, including the table of items and action buttons.
    -   `CartRow.jsx`: Renders a single row in the food cart table, now including the `ServingSizeEditor`.
-   `nutrition/`: Components specific to nutrition display.
    -   `ServingSizeEditor.jsx`: A key component that allows users to select a serving unit and quantity, with all nutritional info scaling dynamically.
    -   `DailySummary.jsx`: Displays the user's progress towards their daily macronutrient goals.
    -   `LogTable.jsx`: Renders the table of foods the user has logged for the day.
    -   `MacroDisplay.jsx`: A flexible component for displaying macronutrient values in various formats (pills, table cells, etc.).
-   `PinnedQuickAdd.jsx`: Renders the grid of the user's pinned foods for easy access.
-   `Search/`: Components related to the search functionality.
    -   `SearchBar.jsx`: The main search input component.
    -   `SearchResultItem.jsx`: Renders a single item in the search results list.

#### `src/utils/`

-   `dataUtils.js`: Contains helper functions for data manipulation, such as calculating macros for a food item.
-   `timeUtils.js`: Contains helper functions for formatting and parsing dates and times, including timezone-aware functions. 