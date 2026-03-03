import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'mambo-perf.log');

export async function POST(request) {
  try {
    const { lines } = await request.json();
    if (!Array.isArray(lines) || lines.length === 0) {
      return new Response('no lines', { status: 400 });
    }
    const text = lines.join('\n') + '\n';
    fs.appendFileSync(LOG_PATH, text, 'utf8');
    return new Response('ok', { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
