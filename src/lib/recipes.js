import Papa from 'papaparse';

// Paste your published CSV link here
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRPv32DzLhr7q9gDQi24zdbcNFeAbXRHG4aClWHdJ2z6ZGHeCVFd2WNs4pbG7eMU8u8YlRhG_I3EM3/pub?output=csv'
let cache; // so the sheet is only fetched once per build

// Sheet column names (must match your headers exactly)
const CATEGORY_COL = 'Which of these category tags apply?';
const INGREDIENT_COL = 'Which of these ingredients tags apply?';

// Turns "pasta, salad" into ['pasta', 'salad']
const split = (s) => (s || '').split(',').map((t) => t.trim()).filter(Boolean);


export function getRecipes() {
  cache ??= load();
  return cache;
}

// Looks up the photo from the recipe page's og:image tag
async function getImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1] : null;
  } catch {
    return null; // if the site blocks us, we just show no photo
  }
}

async function load() {
  const csv = await (await fetch(SHEET_URL)).text();
  const rows = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;

  console.log('Rows found:', rows.length, rows[0]);

  return Promise.all(
    rows.map(async (r) => ({
      title: r['What is the title of the recipe you would like to recommend?'],
      link: r['What is the recipe link?'],
      source: r['Source? (ex. NYT)'],
      recommender: r['Your name'],
      categories: split(r[CATEGORY_COL]),
      ingredients: split(r[INGREDIENT_COL]),
      tags: [...split(r[CATEGORY_COL]), ...split(r[INGREDIENT_COL])], // used for filtering and the detail page      // URL-friendly version of the title, e.g. "coconut-ginger-soup"
      slug: r['What is the title of the recipe you would like to recommend?'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      image: await getImage(r['What is the recipe link?']),
    }))
  );
}