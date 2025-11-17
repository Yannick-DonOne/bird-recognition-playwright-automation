# Bird Recognition Automated Test Suite

This repository contains an automated **bird recognition test suite** using **Playwright**. It tests the visual recognition tool at [https://www.ornitho.com] against a set of bird images (Found in the Data folder), validates predictions, and generates a detailed report with failure analysis and recommendations.

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Project Structure](#project-structure)  
3. [Setup Instructions](#setup-instructions)  
4. [Running the Tests](#running-the-tests)  
5. [Test Results and Reports](#test-results-and-reports)  
6. [Understanding the Failure Analysis](#understanding-the-failure-analysis)  
7. [Troubleshooting](#troubleshooting)  

---

## Prerequisites

- **Node.js** ≥ 18 installed  
- **npm** or **yarn**  
- Internet connection (required for testing [https://www.ornitho.com])  
- Windows, macOS, or Linux  

---

## Project Structure

```
Exercise/
│
├─ data/                       # Folder containing test images
│   ├─ tarin_triste.jpeg
│   ├─ bergeronnette_printaniere.jpeg
│   └─ chevalier_aboyeur.jpeg
│
├─ results/                    # Auto-generated test results
│   ├─ summary.json
│   ├─ report.html
│   ├─ tarin_triste.json
│   └─ tarin_triste.png
│
├─ tests/                      # Playwright test scripts
│   └─ bird-recognition.spec.ts
│
├─ package.json
└─ README.md
```

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/Yannick-DonOne/bird-recognition-playwright-automation.git
cd Ecercise
```

2. **Install dependencies**

```bash
npm install
```

This will install:

- `@playwright/test`
- Required Playwright browsers

3. **Install Playwright browsers**

```bash
npx playwright install
```

4. **Ensure test images are in the `data/` folder**  
- `tarin_triste.jpeg`  
- `bergeronnette_printaniere.jpeg`  
- `chevalier_aboyeur.jpeg`  

> The test suite will fail if images are missing.

---

## Running the Tests

Run the automated tests using:

```bash
npx playwright test
```

### Optional:

- **Run tests in headed mode** (see browser UI):

```bash
npx playwright test --headed
```

- **Run a specific test file**:

```bash
npx playwright test tests/bird-recognition.spec.ts
```

- **Run with detailed logs**:

```bash
DEBUG=pw:api npx playwright test
```

- **Run a specifif file headed on a specific browser**:

```bash
npx playwright test bird-recognition --headed --project=chromium
```

---

## Test Results and Reports

After tests complete, a **fresh report is generated** in the `results/` folder:

- **`summary.json`** → all test results in JSON format  
- **`<bird_name>.json`** → per-bird diagnostic file, includes reasons for failure and recommendations  
- **`<bird_name>.png`** → screenshot of the page during test  
- **`report.html`** → detailed HTML report with:

| Column                  | Description |
|-------------------------|-------------|
| File                    | Uploaded image file name |
| Expected                | Expected bird name |
| Detected                | Name detected by tool |
| Score                   | Confidence percentage |
| Status                  | PASS / FAIL |
| Failure Reasons         | Reasons for failure (`name_mismatch`, `low_confidence`, `selector_too_broad`) |
| Recommendation          | Actionable suggestions for improvement |
| Screenshot              | Page screenshot for debugging |

> The HTML report is **self-contained** and viewable in any browser.  

---

## Understanding the Failure Analysis

The system automatically analyzes failed tests:

1. **`name_mismatch`** → Predicted name does not match expected → Check ML predictions or dataset labels.  
2. **`low_confidence`** → Confidence < 90% → Use higher-quality images or retrain classifier.  
3. **`selector_too_broad`** → Extracted text contains stopwords or is too long → Refine DOM selector to target the correct element.  

Multiple reasons can appear for a single test. The **recommendation field** provides specific guidance to fix the failure.

---

## Troubleshooting

1. **Test images missing**  
   - Ensure all JPEG files exist in `data/`.  
   - Missing images will be skipped and logged.

2. **Element not found errors**  
   - The DOM structure of [https://www.ornitho.com] may have changed.  
   - Update the CSS selectors in `bird-recognition.spec.ts` accordingly.

3. **Old reports appear in `report.html`**  
   - The test suite automatically clears previous reports before each run.  
   - If needed, manually delete the `results/` folder.

4. **Browser not launching**  
   - Run `npx playwright install` to ensure all browsers are installed.  
   - Headless mode can be toggled with `--headed`.


---

## Notes

- Each test run produces a **fresh `results/` folder**, so reports always reflect the latest test run.  
- Screenshots and per-bird JSON diagnostics are useful for debugging and improving the recognition model.

