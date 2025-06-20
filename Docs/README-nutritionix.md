# Nutritionix API Query Script

This script queries the Nutritionix API to get detailed nutrition information for the NOW Protein Powder Whey Protein Isolate Creamy Chocolate.

## Setup

1. **Get Nutritionix API Credentials**
   - Sign up at [Nutritionix Developer Portal](https://developer.nutritionix.com/)
   - Get your App ID and App Key

2. **Set Environment Variables**
   ```bash
   export NUTRITIONIX_APP_ID="your_app_id_here"
   export NUTRITIONIX_APP_KEY="your_app_key_here"
   ```

3. **Install Dependencies**
   ```bash
   npm install axios
   ```

## Usage

Run the script:
```bash
node nutritionix-query.js
```

## What the Script Does

The script attempts three methods to get the nutrition data:

1. **Direct Item ID Lookup**: Tries to get the item directly using the ID from the URL
2. **Search by Name**: Searches for "now protein powder whey protein isolate creamy chocolate"
3. **Detailed Nutrition**: Gets full nutrition breakdown for the best match

## Target Item

- **URL**: https://www.nutritionix.com/i/now/protein-powder-whey-protein-isolate-creamy-chocolate/56516583253a118837b4fd0b
- **Item ID**: 56516583253a118837b4fd0b
- **Product**: NOW Protein Powder Whey Protein Isolate Creamy Chocolate

## Expected Output

The script will return the full JSON response from the Nutritionix API, including:
- Basic item information (name, brand, serving size)
- Complete nutrition facts
- Ingredients
- Allergen information
- And any other data available from the API

This will help you understand the complete data structure for storing foods in your database. 