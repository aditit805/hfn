// Meditation Check-in — backend for the page hosted on GitHub Pages.
// The page POSTs one person at a time; this submits them to the
// "Sunday Attendance" Google Form and replies with {ok, error?} as JSON.

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf67pPhWmi6ijQN7pnFZ0IAHqdsH5e-QiBujt1oHAC8knllDA/formResponse';

// Form field ids (from the form's FB_PUBLIC_LOAD_DATA_).
const F = {
  name: 'entry.537368111',
  lives: 'entry.701442255', // "Singapore" | "Outside Singapore"
  city: 'entry.1820617848', // only when Outside Singapore
  firstTime: 'entry.1621228157', // "Yes" | "No"
  heardFrom: 'entry.768898668', // checkboxes, only when first time
};

// Form sections: 0 Name/Lives, 1 Overseas, 2 Session Details, 3 New Participant.
// Google needs the visited sections in pageHistory for branching forms.

// Opening the /exec link in a browser shows this — a quick "is it running?" check.
function doGet() {
  return json({ ok: true, service: 'Meditation Check-in', message: 'Backend is running.' });
}

// Called by the page with a JSON body (sent as text/plain to avoid a CORS preflight).
function doPost(e) {
  let person;
  try {
    person = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Bad request' });
  }
  return json(submitAttendance(person));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Submits one person's attendance to the Google Form.
 * @param {{name:string, lives:string, city?:string, firstTime:boolean, heardFrom?:string[]}} p
 * @return {{ok:boolean, error?:string}}
 */
function submitAttendance(p) {
  if (!p || !String(p.name || '').trim()) return { ok: false, error: 'Name missing' };

  const overseas = p.lives === 'Outside Singapore';

  // Same person already sent today (e.g. a retry after a dropped connection, or a
  // second phone)? Report success without creating a duplicate form response.
  const today = Utilities.formatDate(new Date(), 'Asia/Singapore', 'yyyy-MM-dd');
  const dedupeKey = ['in', today, String(p.name).trim().toLowerCase().replace(/\s+/g, ' '),
    overseas ? String(p.city || '').trim().toLowerCase() : 'sg'].join('|');
  const cache = CacheService.getScriptCache();
  if (cache.get(dedupeKey)) return { ok: true, duplicate: true };
  const parts = [
    [F.name, String(p.name).trim()],
    [F.lives, overseas ? 'Outside Singapore' : 'Singapore'],
    [F.firstTime, p.firstTime ? 'Yes' : 'No'],
  ];
  const pages = [0];
  if (overseas) {
    parts.push([F.city, String(p.city || '').trim()]);
    pages.push(1);
  }
  pages.push(2);
  if (p.firstTime) {
    const heard = p.heardFrom && p.heardFrom.length ? p.heardFrom : ['Other'];
    heard.forEach(h => parts.push([F.heardFrom, h]));
    pages.push(3);
  }
  parts.push(['pageHistory', pages.join(',')]);

  const payload = parts
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');

  try {
    const res = UrlFetchApp.fetch(FORM_URL, {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      muteHttpExceptions: true,
      followRedirects: true,
    });
    const code = res.getResponseCode();
    // 200 = recorded; 400 = Google rejected it (missing/invalid field).
    if (code !== 200) return { ok: false, error: 'Form returned HTTP ' + code };
    cache.put(dedupeKey, '1', 21600); // 6 hours, the longest the cache allows
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
