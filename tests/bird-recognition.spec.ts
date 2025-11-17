
import { test, expect, chromium, Page } from '@playwright/test';
import path from 'path';

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

test.describe('Bird recognition tool', () => {
    test.beforeAll(async () => {
        const browser = await chromium.launch({ headless: false, slowMo: 50 });
        const context = await browser.newContext();
        page = await context.newPage();
        console.log('Browser launched, will stay open after tests.');
    });

    birdsToTest.forEach((bird) => {
    test(`Should correctly recognize: ${bird.expectedName}`, async ({}) => {

        await page.goto('https://www.ornitho.com/');

        const filePath = path.resolve('data', bird.fileName);

        await page.setInputFiles('#NOM_DE_FICHIER', filePath);
        await page.getByRole('button', { name: 'Suivant' }).click();
        await page.getByRole('button', { name: 'Suivant' }).click();

        const resultName = page.locator(".esp");
        const resultScore = page.locator("div[class='especes'] div:nth-child(2) div:nth-child(1)");

        await expect(resultName).toBeVisible({ timeout: 15000 });
        await expect(resultScore).toBeVisible({ timeout: 15000 });

        const name = await resultName.textContent();
        const scoreText = await resultScore.textContent();
        const score = Number(scoreText?.replace('%', '').trim());

        await test.step(`Result for ${bird.expectedName}`, async () => {
            console.log(`The name is ${name} and the score is ${score}`);
            test.info().annotations.push({
                type: 'note',
                description: `Recognized: ${name}, Confidence: ${score}%`,
            });
        });

        expect(name?.trim()).toBe(bird.expectedName);
        expect(score).toBeGreaterThanOrEqual(90);

    });
});

    // optional: prevent closing browser
    test.afterAll(async () => {
        console.log('Tests finished. Browser stays open.');
        // don't call browser.close();
    });
});