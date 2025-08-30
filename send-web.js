import venom from 'venom-bot';
import fs from 'fs';
import { parse } from 'csv-parse';


const LINK = 'https://your-link.example';


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


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


venom
.create({ session: 'bulk1', headless: true })
.then(async (client) => {
const contacts = await loadCSV('contacts.csv');
let sent = 0, fail = 0;
for (const c of contacts) {
const phone = c.phone.replace(/\D/g, '');
const jid = `${phone}@c.us`; // process +94… numbers only
const name = c.name || 'Friend';
const text = `Hi ${name},\n${LINK}`;
try {
await client.sendText(jid, text);
sent++;
} catch (e) {
fail++;
fs.appendFileSync('failed.log', `${c.phone},${e?.message || e}\n`);
}
// throttle: ~6–10 msgs/min to be safe
await sleep(7000 + Math.floor(Math.random() * 3000));
}
console.log(`Done. Sent ${sent}, Failed ${fail}`);
process.exit(0);
})
.catch((e) => console.error(e));
