const Apify = require('apify');
const puppeteer = require('puppeteer');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { profileUrls } = input;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    const results = [];

    for (const url of profileUrls) {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0');

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            await page.waitForSelector('h1');

            const data = await page.evaluate(() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                const getHref = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.href : null;
                };

                const getImg = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.src : null;
                };

                return {
                    name: getText('h1'),
                    headline: getText('.text-body-medium.break-words'),
                    location: getText('.text-body-small.inline.t-black--light.break-words'),
                    job_title: getText('.pvs-entity p span[aria-hidden="true"]'),
                    company_name: getText('.pv-entity__secondary-title'),
                    about: getText('.display-flex.ph5.pv3 > div > span'),
                    website: getHref('.ci-websites a'),
                    current_company_url: getHref('.pv-top-card--experience-list li a'),
                    profile_picture_url: getImg('.pv-top-card-profile-picture__image')
                };
            });

            results.push({ ...data, linkedin_url: url });
        } catch (err) {
            results.push({ error: err.message, linkedin_url: url });
        }

        await page.close();
    }

    await browser.close();

    await Apify.pushData(results);
});
