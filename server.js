const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config();

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
let page;

app.use(cors());
app.use(express.json());

app.post('/api/new-chat', async (req, res) => {
    await sendMessage(req.body.message);
    let chatGPTres = await listenResponse();
    newChat()
    res.json(chatGPTres);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


async function initSession() {
    const browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.setViewport();
    await page.goto('https://chatgpt.com/');
    await page.waitForSelector('button.btn.relative.btn-primary');
    await page.click('button.btn.relative.btn-primary');
    await page.waitForSelector('input.email-input');
    await page.type('input.email-input', process.env.EMAIL);
    await page.click('button.continue-btn');
    await page.waitForSelector('input#password');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.type('input#password', process.env.PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.focus('input#password');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.keyboard.press('Enter');
    await page.waitForSelector('div#prompt-textarea');
    console.log('Environment Complete')
    return page;
}

async function sendMessage(message) {
    try {
        await page.evaluate((msg) => {
            const parentDiv = document.querySelector('#prompt-textarea');
            if (parentDiv) {
                const childP = parentDiv.querySelector('p');
                if (childP) childP.innerText = msg;
            }
        }, message);
        return await page.click('button[aria-label="Send prompt"]');
    } catch (error) {
        return false;
    }
}

async function listenResponse() {
    try {
        const elementHandle = await page.waitForFunction(() => {
            const elements = document.querySelectorAll('code');
            for (let el of elements) {
                if (el.innerText && el.innerText.includes(';')) {
                    return el
                };
            }
            return null;
        });
        let jsonText = await elementHandle.evaluate((el) => el.innerText);
        jsonText = jsonText.replace(';', '');
        console.log("Answer:", jsonText)
        return JSON.parse(jsonText)
    } catch (error) {
        console.log('')
        return false;
    }
}

async function newChat() {
    await page.waitForSelector('button[aria-label="New chat"]');
    await page.click('button[aria-label="New chat"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
}

initSession();

