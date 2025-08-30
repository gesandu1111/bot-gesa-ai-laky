import 'dotenv/config';
function loadCSV(path) {
return new Promise((resolve, reject) => {
const rows = [];
fs.createReadStream(path)
.pipe(parse({ columns: true, skip_empty_lines: true }))
.on('data', (r) => rows.push(r))
.on('end', () => resolve(rows))
.on('error', reject);
});
}


async function sendTemplate(to, name, link) {
const payload = {
messaging_product: 'whatsapp',
to,
type: 'template',
template: {
name: TEMPLATE,
language: { code: LANG },
components: [
{
type: 'body',
parameters: [
{ type: 'text', text: name || 'Friend' },
{ type: 'text', text: link },
],
},
],
},
};
try {
const { data } = await axios.post(BASE, payload, {
headers: { Authorization: `Bearer ${TOKEN}` },
timeout: 20000,
});
return { ok: true, to, id: data.messages?.[0]?.id };
} catch (err) {
const msg = err.response?.data || err.message;
return { ok: false, to, error: msg };
}
}


(async () => {
const contacts = await loadCSV('contacts.csv');
// Concurrency limit: tune to your quality tier. Start low (e.g., 8)
const limit = pLimit(8);
const jobs = contacts.map((c, i) =>
limit(async () => {
// small jitter to smooth traffic
await new Promise((r) => setTimeout(r, 200 * (i % 10)));
return sendTemplate(c.phone.trim(), c.name?.trim(), LINK);
})
);


const results = await Promise.all(jobs);
const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
console.log(`\nDone. Sent: ${ok}, Failed: ${failed.length}`);
if (failed.length) {
fs.writeFileSync('failed.json', JSON.stringify(failed, null, 2));
console.log('See failed.json for details.');
}
})();
