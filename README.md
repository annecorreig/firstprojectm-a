# M&A Valuation Lab

An educational website that explains how companies are valued in mergers and acquisitions (M&A), with interactive calculators you can try in your browser.

It is built with **plain HTML, CSS and JavaScript only**. There are no frameworks, no installation and no server. If you can open a file, you can run this site.

> ⚠️ For educational purposes only. Not financial advice.

---

## 1. What each file does

```
/
├── index.html          Home page: what M&A valuation is + links to each section
├── process.html        The 8-step valuation process as a numbered timeline
├── methods.html        DCF, comps, precedents, LBO, asset-based + comparison table
├── calculators.html    The 6 interactive calculators (the inputs and layout)
├── glossary.html       37 key terms with a live search box
├── css/style.css       ALL the styling (colours, fonts, layout, dark mode, mobile)
├── js/main.js          Shared code for every page: mobile menu, glossary search, footer year
├── js/calculators.js   The calculator maths, money formatting and the chart drawing
└── README.md           This guide
```

**How the files connect:**

- Each `.html` page is a separate web page. They link to each other through the navigation bar at the top (`<a href="methods.html">`).
- Every page loads the **same** stylesheet (`<link rel="stylesheet" href="css/style.css">`), so they all look the same.
- Every page loads `js/main.js` (`<script src="js/main.js" defer>`), which makes the hamburger menu work. On the glossary page it also powers the search box.
- Only `calculators.html` also loads `js/calculators.js`. That file finds each input by its `id` (for example `id="dcf-wacc"`), does the maths, and writes the results back onto the page.

---

## 2. Open the site on your computer

1. Download or clone this folder.
2. **Double-click `index.html`.** It opens in your web browser. That's it.

Keep all the files in the same folder structure: `css/` and `js/` must stay next to the `.html` files, or the styling and calculators won't load.

---

## 3. Publish it free on GitHub Pages

### Step A: Create a repository

1. Sign in at [github.com](https://github.com) (create a free account if you don't have one).
2. Click the **+** in the top-right → **New repository**.
3. Give it a name, for example `ma-valuation-lab`. Choose **Public** (free GitHub Pages needs a public repository).
4. Leave "Add a README" **unticked** (you already have one). Click **Create repository**.

### Step B: Upload the files (choose ONE option)

**Option 1: in the browser (easiest)**

1. On your new repository's page, click **uploading an existing file**.
2. Drag in **everything**: the 5 `.html` files, `README.md` and the `css` and `js` folders.
3. Click **Commit changes**.

**Option 2: with git on the command line** (see section 4 for the commands)

### Step C: Turn on GitHub Pages

1. In your repository, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **`main`** and the **`/ (root)`** folder, then click **Save**.
5. Wait 1 to 2 minutes and refresh the page. A box appears saying **"Your site is live at…"** with your URL, which looks like:

   `https://YOUR-USERNAME.github.io/ma-valuation-lab/`

Every time you push or upload changes, the live site updates automatically within a minute or two.

---

## 4. Git commands to push your files

Run these in a terminal **inside the project folder**. Replace `YOUR-USERNAME` and `ma-valuation-lab` with your own details.

```bash
git init
# Turns this folder into a git repository (only needed the first time).

git add .
# Selects ALL files in the folder to be saved in the next commit.

git commit -m "First version of M&A Valuation Lab"
# Saves a snapshot of the selected files with a short message describing it.

git branch -M main
# Names your main branch "main" (what GitHub Pages expects).

git remote add origin https://github.com/YOUR-USERNAME/ma-valuation-lab.git
# Tells git where your GitHub repository is (only needed the first time).

git push -u origin main
# Uploads your commits to GitHub. "-u" remembers the destination for next time.
```

**After the first time**, publishing a change only needs three commands:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

---

## 5. Making simple edits

### Change the colours

Open `css/style.css`. The colours are all at the top, inside `:root { ... }`:

```css
--color-navy: #0b2545;     /* Main brand colour */
--color-accent: #0e7c7b;   /* The ONE accent colour */
```

Change a hex code (search "color picker" online to find one), save, and refresh the browser. Dark-mode colours are just below, inside `@media (prefers-color-scheme: dark)`. The football field chart reads these same variables, so it updates too.

### Add a glossary term

Open `glossary.html`, copy one block like this, paste it in alphabetical order, and edit the text:

```html
<div class="glossary-item">
  <dt>Your new term</dt>
  <dd>A plain-English definition.</dd>
</div>
```

The search box and the "Showing X of Y terms" counter pick it up automatically.

### Change default calculator values

Open `calculators.html` and find the input. Each input's default value is its `value="..."`. For example, to change the default WACC from 10% to 9%:

```html
<input type="number" id="dcf-wacc" value="10" step="any">
```

becomes

```html
<input type="number" id="dcf-wacc" value="9" step="any">
```

Don't change the `id="..."` part, because `js/calculators.js` uses it to find the input.

### Change how money is displayed

All dollar amounts go through one function, `formatMoney`, near the top of `js/calculators.js`. Change it once and every calculator changes.

---

## 6. Expected results with the default values

Use these to check that everything works.

| Calculator | Key results with defaults |
|---|---|
| **DCF** | EV **$1,635.7M**, equity **$1,435.7M**, **$28.71** per share, terminal value 72.6% of EV |
| **WACC** | Cost of equity 10.60%, after-tax cost of debt 4.50%, **WACC 8.16%** |
| **Multiples** | EV/EBITDA: $640.0M / **$780.0M** / $920.0M; EV/Revenue: $600.0M / **$840.0M** / $1,040.0M |
| **Synergies** | Max price **$1,240.0M**, offer $1,200.0M, seller gets $200.0M (83%), buyer keeps $40.0M (17%) |
| **Accretion/dilution** | Pro forma EPS **$5.06** vs $5.00 → **accretive by 1.18%** |
| **Football field** | 5 bars from $400M to $1,250M with a dashed offer line at $1,000M |
