import { test, expect, chromium, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

interface BirdTestData {
    fileName: string;
    expectedName: string;
}

const birdsToTest: BirdTestData[] = [
    { fileName: 'tarin_triste.jpeg', expectedName: 'Tarin triste' },
    { fileName: 'bergeronnette_printaniere.jpeg', expectedName: 'Bergeronnette printanière' },
    { fileName: 'chevalier_aboyeur.jpeg', expectedName: 'Chevalier aboyeur' }
];

let page: Page;

// -------------------- RESULT MANAGEMENT --------------------------------------

const RESULTS_DIR = path.join(process.cwd(), "results");
const SUMMARY_FILE = path.join(RESULTS_DIR, "summary.json");

function createResultsFolder() {
    if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function appendToSummary(data: any) {
    const existing = fs.existsSync(SUMMARY_FILE)
        ? JSON.parse(fs.readFileSync(SUMMARY_FILE, "utf8"))
        : [];
    existing.push(data);
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(existing, null, 2));
}

function generateHtmlReport() {
    if (!fs.existsSync(SUMMARY_FILE)) return;

    const summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, "utf8"));
    const htmlRows = summary.map((item: any) => `
        <tr>
            <td>${item.file}</td>
            <td>${item.expected}</td>
            <td>${item.name}</td>
            <td>${item.score}%</td>
            <td style="color:${item.passed ? 'green' : 'red'}">${item.passed ? "PASS" : "FAIL"}</td>
            <td>${item.suggestions ? item.suggestions.reasons.join(', ') : ''}</td>
            <td>${item.suggestions ? item.suggestions.recommendation : ''}</td>
            <td><img src="${item.screenshot}" width="180"/></td>
        </tr>
    `).join("");

    const html = `
        <html>
        <head>
            <title>Bird Recognition Report</title>
            <style>
                body { font-family: Arial; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top;}
                th { background: #f0f0f0; }
            </style>
        </head>
        <body>
            <h2>Bird Recognition Test Report</h2>
            <table>
                <tr>
                    <th>File</th>
                    <th>Expected</th>
                    <th>Detected</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Failure Reasons</th>
                    <th>Recommendation</th>
                    <th>Screenshot</th>
                </tr>
                ${htmlRows}
            </table>
        </body>
        </html>
    `;

    fs.writeFileSync(path.join(RESULTS_DIR, "report.html"), html);
}

// ----------------------- Analyze Failures -----------------------------------

function analyzeFailure(
    name: string | undefined,
    expected: string,
    score: number
): { reasons: string[], recommendation: string } | null {
    const reasons: string[] = [];

    // Check if the predicted name is different from the expected
    if (!name || name !== expected) reasons.push('name_mismatch');

    // Check if confidence is below threshold
    if (score < 90) reasons.push('low_confidence');

    // Check if the selector captured extra or irrelevant text
    const tooLong = !name || name.length > 120;
    const stopwords = /accueil|esp[eè]ces|résultats|identification|actualité|news|aide/i.test(name || '');
    if (tooLong || stopwords) reasons.push('selector_too_broad');

    // No issues detected
    if (reasons.length === 0) return null;

    // Generate reason-specific recommendations
    const recs: string[] = [];
    if (reasons.includes('name_mismatch')) recs.push('Check the ML model predictions or dataset labels.');
    if (reasons.includes('low_confidence')) recs.push('Consider using higher-quality images or retraining the classifier.');
    if (reasons.includes('selector_too_broad')) recs.push('Refine the DOM selector to target only the species name element.');

    return {
        reasons,
        recommendation: recs.join(' ')
    };
}

// ------------------------- MAIN TEST SUITE ---------------------------------

test.describe('Bird recognition tool', () => {

    test.beforeAll(async () => {
        createResultsFolder();
        // Clear previous summary.json if it exists
    if (fs.existsSync(SUMMARY_FILE)) {
        fs.unlinkSync(SUMMARY_FILE);
        console.log('Previous summary.json deleted for a fresh test run.');
    }

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    page = await context.newPage();
    console.log('Browser launched.');
    });

    birdsToTest.forEach((bird) => {
        test(`Should correctly recognize: ${bird.expectedName}`, async () => {

            await page.goto('https://www.ornitho.com/');

            const filePath = path.resolve('data', bird.fileName);
            await page.setInputFiles('#NOM_DE_FICHIER', filePath);
            await page.getByRole('button', { name: 'Suivant' }).click();
            await page.getByRole('button', { name: 'Suivant' }).click();

            const resultName = page.locator(".esp");
            const resultScore = page.locator("div[class='especes'] div:nth-child(2) div:nth-child(1)");

            await expect(resultName).toBeVisible({ timeout: 15000 });
            await expect(resultScore).toBeVisible({ timeout: 15000 });

            const name = (await resultName.textContent())?.trim();
            const scoreText = (await resultScore.textContent())?.replace('%', '').trim();
            const score = Number(scoreText);

            const screenshotPath = path.join(RESULTS_DIR, bird.fileName.replace('.jpeg', '.png'));
            await page.screenshot({ path: screenshotPath, fullPage: true });

            const passed = (name === bird.expectedName && score >= 90);

            // Analyze failure reasons if any
            const suggestions = passed ? null : analyzeFailure(name, bird.expectedName, score);

            const diagnostic = {
                file: bird.fileName,
                expected: bird.expectedName,
                name,
                score,
                passed,
                suggestions,
                screenshot: path.basename(screenshotPath),
                timestamp: new Date().toISOString()
            };

            // Save individual diagnostic
            fs.writeFileSync(
                path.join(RESULTS_DIR, bird.fileName.replace('.jpeg', '.json')),
                JSON.stringify(diagnostic, null, 2)
            );

            // Append to summary
            appendToSummary(diagnostic);

            console.log(`Result → ${bird.fileName}: ${name} (${score}%), Passed: ${passed}`);
            expect(name).toBe(bird.expectedName);
            expect(score).toBeGreaterThanOrEqual(90);
        });
    });

    test.afterAll(async () => {
        console.log('Generating HTML report with failure analysis...');
        generateHtmlReport();
        console.log('HTML report saved to results/report.html');
    });

});