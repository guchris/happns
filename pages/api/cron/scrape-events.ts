import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer, { Browser } from "puppeteer";
import { config } from "dotenv";
import OpenAI from "openai";
import {
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import type { Event } from "@/components/types";

// Load env
config();

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
    databaseURL: "https://happns-default-rtdb.firebaseio.com"
  });
}

const db = getFirestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getRawTextFromPage(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a proper user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable JavaScript console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    console.log('Navigating to URL:', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for the main content to load
    console.log('Waiting for content to load...');
    await page.waitForSelector('.event-card', { timeout: 10000 });
    
    // Scroll to load all content
    console.log('Scrolling page...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve(true);
          }
        }, 100);
      });
    });
    
    // Wait a bit for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract all event card links
    console.log('Extracting event links...');
    const links = await page.evaluate(() => {
      const eventCards = document.querySelectorAll('.event-card a');
      console.log(`Found ${eventCards.length} event cards on the page`);
      const links = Array.from(eventCards)
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.includes('/event/'));
      console.log('Event links:', links);
      return links;
    });
    
    console.log(`Found ${links.length} total event links`);
    return JSON.stringify(links);
  } catch (error) {
    console.error('Error during page scraping:', error);
    return '[]';
  } finally {
    await browser.close();
  }
}

async function getEventDetails(browser: Browser, link: string): Promise<string> {
  const page = await browser.newPage();
  await page.goto(link, { waitUntil: "networkidle2" });
  const text = await page.evaluate(() => document.body.innerText);
  await page.close();
  return text;
}

async function extractLinksFromText(rawText: string): Promise<string[]> {
  // Since rawText is now a JSON string of links, just parse it
  return JSON.parse(rawText);
}

async function extractEventsFromText(rawText: string): Promise<any[]> {
  const prompt = `
You're an assistant that extracts events from raw text.
Return a JSON array of events. Each event should include:

- name (the exact name/title of the event)
- link (the event's webpage URL)
- details (a concise, inviting description of the event that highlights its key features and appeal)

Only return valid JSON. No commentary.

Text:
${rawText}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const content = response.choices[0].message.content || "[]";
  const jsonStart = content.indexOf("[");
  const json = content.slice(jsonStart);
  return JSON.parse(json);
}

async function eventExists(link: string): Promise<boolean> {
  const eventsSnapshot = await db.collection("events").where("link", "==", link).get();
  if (!eventsSnapshot.empty) return true;

  const pendingSnapshot = await db.collection("pending-events").where("link", "==", link).get();
  return !pendingSnapshot.empty;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optional Vercel Cron secret check
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  const urls = [
    "https://everout.com/seattle/top-events/",
  ];

  let totalFound = 0;
  let totalAdded = 0;

  try {
    for (const url of urls) {
      console.log(`Starting to scrape URL: ${url}`);
      const rawText = await getRawTextFromPage(url);
      console.log(`Got raw text, length: ${rawText.length}`);
      
      // First extract links and check for duplicates
      const links = await extractLinksFromText(rawText);
      console.log(`Found ${links.length} links`);
      const uniqueLinks: string[] = [];
      
      for (const link of links.slice(0, 10)) {
        console.log(`Checking link: ${link}`);
        const exists = await eventExists(link);
        if (!exists) {
          console.log(`Link is unique, adding to process: ${link}`);
          uniqueLinks.push(link);
        } else {
          console.log(`Link already exists: ${link}`);
        }
      }

      // Only process unique links with GPT
      if (uniqueLinks.length > 0) {
        console.log(`Processing ${uniqueLinks.length} unique links`);
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
          const eventsToAdd = [];
          for (const link of uniqueLinks) {
            console.log(`Getting details for link: ${link}`);
            const eventText = await getEventDetails(browser, link);
            console.log(`Got event text, length: ${eventText.length}`);
            const events = await extractEventsFromText(eventText);
            console.log(`Extracted ${events.length} events from text`);
            const event = events[0]; // We expect only one event per page

            if (event) {
              console.log(`Found event: ${event.name}`);
              const firestoreEvent: Event = {
                category: [],
                city: "seattle",
                clicks: 0,
                cost: {
                  type: "single",
                  value: 0
                },
                details: event.details,
                endDate: "",
                format: "in-person",
                gmaps: "",
                id: "",
                image: "",
                link: event.link,
                location: "",
                name: event.name,
                neighborhood: "",
                startDate: "",
                times: [{
                  startTime: "",
                  endTime: ""
                }],
                attendanceSummary: {
                  yesCount: 0,
                  maybeCount: 0,
                  noCount: 0
                },
                eventDurationType: "single",
                status: "pending"
              };
              eventsToAdd.push(firestoreEvent);
            }
          }

          if (eventsToAdd.length > 0) {
            console.log(`Adding ${eventsToAdd.length} events to Firestore`);
            const batch = db.batch();
            for (const event of eventsToAdd) {
              const docRef = db.collection("pending-events").doc();
              event.id = docRef.id;
              batch.set(docRef, event);
            }
            await batch.commit();
            totalAdded += eventsToAdd.length;
          }
          totalFound += uniqueLinks.length;
        } finally {
          await browser.close();
        }
      } else {
        console.log('No unique links found to process');
      }
    }

    return res.status(200).json({
      success: true,
      message: `Scraped ${totalFound} events, added ${totalAdded} new.`,
    });
  } catch (error) {
    console.error("Scraper error:", error);
    return res.status(500).json({
      success: false,
      message: "Scraping failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}