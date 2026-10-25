# Meditation Check-in · Heartfulness Singapore

A calm, phone-friendly check-in page. People add their names once; after that they just tap their name and press **Check in**. Each check-in is submitted to the *Sunday Attendance* Google Form.

- **The page** (`index.html`) is hosted free on GitHub Pages: no Google banner, no sign-in.
- **The sender** (`apps-script/Code.gs`) runs on Google Apps Script and submits to the Google Form.
- **The link between them** lives in `config.js`.

---

## Connect the page to Google Apps Script (one time, ~5 minutes)

Use a shared Heartfulness Google account if you can, so it doesn't depend on one person.

1. Go to **https://script.google.com** → **New project**. Name it `HFN Meditation Check-in`.
2. Replace everything in `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs) and save.
   No HTML file is needed. If you used the older version, you can delete its `Index` file.
3. **Deploy → New deployment →** gear icon **→ Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy → Authorize access**. If Google says *"Google hasn't verified this app"*, click **Advanced → Go to … (unsafe) → Allow**.
   Only you see this, once. Visitors never do.
5. Copy the **Web app URL** (ends in `/exec`). Open it in a browser: you should see `"Backend is running."`
6. On GitHub, open **`config.js` → ✏️ Edit**, paste the URL between the quotes, and **Commit changes**:
   ```js
   appsScriptUrl: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```
7. Wait about a minute for GitHub Pages to update, then open the site and check in once with the name
   `TEST_DO_NOT_COUNT`. Confirm it appears in the form responses, then delete that row.

## Updating the Apps Script later (keeps the same link)

Paste the new code and save, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
"New deployment" would create a *new* `/exec` link, and you'd need to update `config.js` again.

## Good to know

- Names are saved on each phone. If someone switches phones or clears their browser, they add their names again once.
- The same person won't be submitted twice within a few hours, even from two phones or after a retry.
- If the Google Form's questions change, update the field IDs at the top of `apps-script/Code.gs`.
