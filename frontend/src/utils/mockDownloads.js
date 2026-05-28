export function downloadMockPdf({ filename, title, lines }) {
  const safeName = (filename || 'download').endsWith('.pdf') ? filename : `${filename || 'download'}.pdf`;

  const body = [
    title ? `${title}` : 'School Report Export',
    'Dampol 1st National High School — Grade Portal Export',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    ...(Array.isArray(lines) ? lines : [])
  ].join('\n');

  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseCsvText(text) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rows.length === 0) return { headers: [], records: [] };

  const splitLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
        continue;
      }

      cur += ch;
    }

    out.push(cur.trim());
    return out.map((cell) => cell.replace(/^"|"$/g, ''));
  };

  const headers = splitLine(rows[0]).map((h) => h.trim());
  const records = rows.slice(1).map((line) => {
    const cells = splitLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h || `col_${idx}`] = cells[idx] ?? '';
    });
    return obj;
  });

  return { headers, records };
}
