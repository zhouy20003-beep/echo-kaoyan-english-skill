// Build the English II (考研英语二) study corpus from the original skill knowledge base.
// Source: skills/kaoyan-english/references/papers/english-ii/<year>/*.md + answers.json
// Output: src/data/papers/<year>.json, src/data/corpus-meta.json, src/data/rubrics.json

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAPERS_DIR = path.join(
  ROOT,
  "skills",
  "kaoyan-english",
  "references",
  "papers",
  "english-ii",
);
const RUBRICS_DIR = path.join(ROOT, "skills", "kaoyan-english", "references", "rubrics");
const OUT_DIR = path.join(ROOT, "src", "data");

const errors = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

/** Join PDF-hard-wrapped lines into readable paragraphs.
 * The source PDFs lost blank lines between paragraphs, so we approximate paragraph
 * boundaries at sentence ends that coincide with a line break. Sentence counting keeps
 * blocks close to the original 3–5 sentence paragraphs. */
function toParagraphs(lines) {
  const cleaned = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (cleaned.length === 0) return [];
  const paragraphs = [];
  let current = [];
  let sentences = 0;
  cleaned.forEach((line, i) => {
    current.push(line);
    sentences += (line.match(/[.!?]["”’)]?(?=\s|$)/g) || []).length;
    const next = cleaned[i + 1];
    const endsSentence = /[.!?]["”’)]?$/.test(line);
    const nextStartsFresh = next ? /^[A-Z0-9(“"]/.test(next) : false;
    if (i === cleaned.length - 1 || (endsSentence && nextStartsFresh && sentences >= 2)) {
      paragraphs.push(current.join(" ").replace(/\s+/g, " ").trim());
      current = [];
      sentences = 0;
    }
  });
  if (current.length) paragraphs.push(current.join(" ").replace(/\s+/g, " ").trim());
  return paragraphs.filter((p) => p.length > 0);
}

function stripMarkdownTitle(lines) {
  return lines.filter((l) => !/^#\s/.test(l));
}

/** Remove the "Section ... Directions ... (N points)" instruction block. */
function dropDirections(lines, pointsRegex) {
  const idx = lines.findIndex((l) => pointsRegex.test(l));
  if (idx === -1) {
    warn(`Directions end marker not found: ${pointsRegex}`);
    return -1;
  }
  return idx + 1;
}

function parseCloze(year, md) {
  const lines = md.split("\n");
  const bodyStart = dropDirections(lines, /\(10 points\)/);
  if (bodyStart === -1) fail(`[${year}] cloze directions not found`);
  const optionStart = lines.findIndex((l, i) => i > bodyStart && /^\d{1,2}\.\s*\[A\]/.test(l));
  if (optionStart === -1) fail(`[${year}] cloze option block not found`);
  const bodyLines = lines.slice(Math.max(bodyStart, 0), optionStart === -1 ? lines.length : optionStart);

  let text = toParagraphs(bodyLines).join("\n\n");
  // Replace inline blank numbers 1..20 with placeholders, walking strictly in order.
  // Incidental numbers (dates, percentages, page numbers) must not be mistaken for blanks.
  const MONTHS = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+$/;
  const tokenRe = /(?<![A-Za-z0-9])(\d{1,2})(?![A-Za-z0-9])/g;
  const candidates = [];
  let m;
  while ((m = tokenRe.exec(text)) !== null) {
    const value = Number(m[1]);
    if (value < 1 || value > 20) continue;
    const before = text.slice(Math.max(0, m.index - 12), m.index);
    const after = text.slice(m.index + m[1].length, m.index + m[1].length + 14);
    const noise =
      /[$£€]\s*$/.test(before) ||
      MONTHS.test(before) ||
      /^\s*percent/.test(after) ||
      /^\s*(million|billion|thousand|hundred)/.test(after) ||
      /^\s*(years?|days?|hours?|minutes?|a\.m\.|p\.m\.)/.test(after) ||
      /^\s*(st|nd|rd|th)\b/.test(after) ||
      /^\s*,?\d{3}/.test(after) ||
      /^\s*\.\d/.test(after) ||
      /^\s*-\d/.test(after) ||
      /^\s*to\s+\d/.test(after) ||
      /^\s*:\d/.test(after);
    candidates.push({ value, index: m.index, length: m[1].length, noise });
  }
  let expected = 1;
  const accepted = [];
  for (const c of candidates) {
    if (c.value !== expected) continue;
    if (c.noise) {
      warn(`[${year}] cloze: skipped incidental "${c.value}" near "${text.slice(c.index, c.index + 24)}"`);
      continue;
    }
    accepted.push(c);
    expected += 1;
    if (expected > 20) break;
  }
  if (accepted.length !== 20) {
    fail(`[${year}] cloze: located ${accepted.length}/20 blank positions`);
  } else {
    for (const c of accepted.slice().reverse()) {
      text =
        text.slice(0, c.index) + `{{${c.value}}}` + text.slice(c.index + c.length);
    }
  }

  // Parse options (usually one line per question).
  const questions = [];
  let pending = null;
  for (const line of lines.slice(optionStart === -1 ? lines.length : optionStart)) {
    const qm = line.match(/^(\d{1,2})\.\s*(.*)$/);
    if (qm && /\[A\]/.test(qm[2])) {
      if (pending) questions.push(pending);
      pending = { no: Number(qm[1]), raw: qm[2] };
    } else if (pending) {
      pending.raw += " " + line.trim();
    }
  }
  if (pending) questions.push(pending);

  const parsed = questions.map((q) => {
    const tokens = {};
    const re = /\[([A-D])\]\s*([^[]*)/g;
    let m;
    while ((m = re.exec(q.raw)) !== null) {
      tokens[m[1]] = m[2].trim().replace(/\s+/g, " ");
    }
    return { no: q.no, options: tokens };
  });

  return {
    passage: text,
    questions: parsed,
    paragraphs: text.split("\n\n").length,
  };
}

function parseReading(year, textNo, md) {
  const lines = stripMarkdownTitle(md.split("\n"));
  const firstQuestion = lines.findIndex((l) => /^(\d{1,2})\.\s+\S/.test(l) && Number(l.match(/^(\d{1,2})/)[1]) >= 21);
  if (firstQuestion === -1) {
    fail(`[${year}] reading text ${textNo}: question start not found`);
    return { textNo, paragraphs: [], questions: [] };
  }
  const passageLines = lines.slice(0, firstQuestion).filter((l) => !/^Text\s+\d+/i.test(l));
  const paragraphs = toParagraphs(passageLines);

  const expectedStart = 21 + (textNo - 1) * 5;
  const blocks = [];
  let current = null;
  for (const rawLine of lines.slice(firstQuestion)) {
    const line = rawLine.trim();
    if (!line) continue;
    const qm = line.match(/^(\d{1,2})\.\s*(.*)$/);
    const isOption = /^\[[A-D]\]/.test(line);
    if (qm && !isOption && Number(qm[1]) >= 21 && Number(qm[1]) <= 45) {
      if (current) blocks.push(current);
      current = { sourceNo: Number(qm[1]), stem: qm[2].trim(), options: {} };
      // Options may begin on the same line.
      const inline = qm[2].match(/\[[A-D]\]/);
      if (inline) {
        current.stem = qm[2].slice(0, inline.index).trim();
        parseOptions(qm[2].slice(inline.index), current.options);
      }
      continue;
    }
    if (!current) continue;
    if (/^\[[A-D]\]/.test(line)) {
      parseOptions(line, current.options);
    } else {
      current.stem = (current.stem + " " + line).replace(/\s+/g, " ").trim();
    }
  }
  if (current) blocks.push(current);

  // Normalize question numbers to the expected 5-question sequence (OCR anomalies exist).
  const questions = blocks.map((b, i) => ({
    no: expectedStart + i,
    sourceNo: b.sourceNo,
    stem: b.stem,
    options: b.options,
  }));

  if (questions.length !== 5) {
    warn(`[${year}] reading text ${textNo}: parsed ${questions.length} questions`);
  }
  const anomaly = questions.find((q) => q.sourceNo !== q.no);
  if (anomaly) warn(`[${year}] reading text ${textNo}: renumbered Q${anomaly.sourceNo} -> Q${anomaly.no}`);

  return { textNo, paragraphs, questions };
}

function parseOptions(segment, target) {
  const re = /\[([A-D])\]\s*([^[]*)/g;
  let m;
  while ((m = re.exec(segment)) !== null) {
    const value = m[2].trim().replace(/\s+/g, " ");
    if (value) target[m[1]] = value;
  }
}

function parseNewQuestionType(year, md) {
  const lines = stripMarkdownTitle(md.split("\n"));
  const dirIdx = lines.findIndex((l) => /\(10 points\)/.test(l));
  const contentLines = lines.slice(dirIdx === -1 ? 0 : dirIdx + 1).filter((l) => l.trim());
  const kind = /true or false/i.test(md)
    ? "true-false"
    : /match each/i.test(md)
      ? "matching"
      : "other";
  const directions = lines
    .slice(0, dirIdx === -1 ? lines.length : dirIdx + 1)
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const items = [];
  for (const line of contentLines) {
    const qm = line.match(/^(\d{1,2})\.\s+(.*)$/);
    if (qm && Number(qm[1]) >= 41 && Number(qm[1]) <= 45) {
      items.push({ no: Number(qm[1]), text: qm[2].trim() });
    }
  }
  return {
    kind,
    directions,
    content: contentLines.join("\n"),
    items,
  };
}

function parseTranslation(year, md) {
  const lines = stripMarkdownTitle(md.split("\n"));
  const startIdx = dropDirections(lines, /\(15 points\)/);
  const enrichIdx = lines.findIndex((l) => /echo-enrichment:start/.test(l));
  const sourceLines = lines.slice(Math.max(startIdx, 0), enrichIdx === -1 ? lines.length : enrichIdx);
  const source = toParagraphs(sourceLines).join("\n\n");

  let reference = "";
  if (enrichIdx !== -1) {
    const refIdx = lines.findIndex((l, i) => i > enrichIdx && /^###\s*Echo 参考译文/.test(l));
    if (refIdx !== -1) {
      const endIdx = lines.findIndex((l, i) => i > refIdx && /^###\s/.test(l));
      reference = lines
        .slice(refIdx + 1, endIdx === -1 ? lines.length : endIdx)
        .join("\n")
        .trim()
        .replace(/\n+/g, "\n\n");
    }
  }
  if (!source) fail(`[${year}] translation source empty`);
  if (!reference) warn(`[${year}] translation reference missing`);

  return { source, reference };
}

function parseWriting(year, md) {
  const lines = stripMarkdownTitle(md.split("\n"));
  const partAIdx = lines.findIndex((l) => /^Part A/.test(l.trim()));
  const partBIdx = lines.findIndex((l) => /^Part B/.test(l.trim()));
  if (partAIdx === -1 || partBIdx === -1) fail(`[${year}] writing Part A/B not found`);

  const rawA = lines.slice(partAIdx + 1, partBIdx).filter((l) => l.trim());
  const rawB = lines.slice(partBIdx + 1).filter((l) => l.trim());

  const splitTask = (raw, pointsRe) => {
    let cut = -1;
    raw.forEach((l, i) => {
      if (pointsRe.test(l)) cut = i;
    });
    if (cut === -1) {
      warn(`[${year}] writing points marker not found: ${pointsRe}`);
      cut = raw.length - 1;
    }
    return {
      text: raw.slice(0, cut + 1).join("\n"),
      material: raw.slice(cut + 1).join("\n"),
    };
  };

  return {
    partA: splitTask(rawA, /\(10 points\)|instead\.|address\..*10 points/),
    partB: splitTask(rawB, /\(15 points\)/),
  };
}

function answerMap(answers, key) {
  const obj = answers[key] || {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [Number(k), String(v).toUpperCase()]));
}

function main() {
  if (!fs.existsSync(PAPERS_DIR)) {
    console.error("Corpus directory not found:", PAPERS_DIR);
    process.exit(1);
  }
  fs.mkdirSync(path.join(OUT_DIR, "papers"), { recursive: true });

  const years = fs
    .readdirSync(PAPERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}$/.test(d.name))
    .map((d) => Number(d.name))
    .sort((a, b) => a - b);

  const corpusYears = [];

  for (const year of years) {
    const dir = path.join(PAPERS_DIR, String(year));
    const answersFile = path.join(dir, "answers.json");
    if (!fs.existsSync(answersFile)) {
      fail(`[${year}] answers.json missing`);
      continue;
    }
    const answers = JSON.parse(read(answersFile)).answers || {};

    const cloze = parseCloze(year, read(path.join(dir, "cloze.md")));
    const clozeAnswers = answerMap(answers, "cloze");

    const readings = [1, 2, 3, 4].map((n) =>
      parseReading(year, n, read(path.join(dir, `reading-text-${n}.md`))),
    );
    const readingAnswers = Object.fromEntries(
      [1, 2, 3, 4].map((n) => [n, answerMap(answers, `reading-text-${n}`)]),
    );

    const nqt = parseNewQuestionType(year, read(path.join(dir, "new-question-type.md")));
    nqt.answers = answerMap(answers, "new-question-type");

    const translation = parseTranslation(year, read(path.join(dir, "translation.md")));
    const writing = parseWriting(year, read(path.join(dir, "writing.md")));

    // Validate cloze.
    if (cloze.questions.length !== 20) fail(`[${year}] cloze questions=${cloze.questions.length}`);
    for (const q of cloze.questions) {
      const ans = clozeAnswers[q.no];
      if (!ans) fail(`[${year}] cloze Q${q.no} missing answer`);
      else if (!q.options[ans]) fail(`[${year}] cloze Q${q.no} answer ${ans} not in options`);
      if (Object.keys(q.options).length !== 4)
        warn(`[${year}] cloze Q${q.no} options=${Object.keys(q.options).length}`);
    }

    // Validate reading.
    for (const r of readings) {
      if (r.questions.length !== 5) fail(`[${year}] reading text ${r.textNo} question count`);
      for (const q of r.questions) {
        const ans = readingAnswers[r.textNo][q.no];
        if (!ans) fail(`[${year}] reading Q${q.no} missing answer`);
        else if (!q.options[ans]) fail(`[${year}] reading Q${q.no} answer ${ans} missing`);
        if (Object.keys(q.options).length !== 4)
          warn(`[${year}] reading text ${r.textNo} Q${q.no} options=${Object.keys(q.options).length}`);
        if (!q.stem) fail(`[${year}] reading Q${q.no} empty stem`);
      }
    }

    const data = {
      year,
      cloze: {
        passage: cloze.passage,
        questions: cloze.questions.map((q) => ({
          no: q.no,
          options: q.options,
          answer: clozeAnswers[q.no] || null,
        })),
      },
      readings: readings.map((r) => ({
        textNo: r.textNo,
        paragraphs: r.paragraphs,
        questions: r.questions.map((q) => ({
          no: q.no,
          stem: q.stem,
          options: q.options,
          answer: readingAnswers[r.textNo][q.no] || null,
        })),
      })),
      newQuestionType: {
        kind: nqt.kind,
        directions: nqt.directions,
        content: nqt.content,
        items: nqt.items,
        answers: nqt.answers,
      },
      translation,
      writing,
      stats: {
        cloze: cloze.questions.length,
        reading: readings.reduce((acc, r) => acc + r.questions.length, 0),
        newQuestionType: Object.keys(nqt.answers).length,
      },
    };

    fs.writeFileSync(
      path.join(OUT_DIR, "papers", `${year}.json`),
      JSON.stringify(data, null, 2),
    );
    corpusYears.push({ year, ...data.stats });
  }

  const rubricFiles = {
    reading: "reading-analysis.md",
    cloze: "cloze-analysis.md",
    translation: "translation-analysis.md",
    writing: "writing-rubric.md",
  };
  const rubrics = {};
  for (const [key, file] of Object.entries(rubricFiles)) {
    const full = path.join(RUBRICS_DIR, file);
    if (!fs.existsSync(full)) {
      fail(`Rubric missing: ${file}`);
      continue;
    }
    rubrics[key] = read(full);
  }
  fs.writeFileSync(path.join(OUT_DIR, "rubrics.json"), JSON.stringify(rubrics, null, 2));

  const meta = {
    exam: "english-ii",
    examLabel: "考研英语（二）",
    years,
    latestYear: years[years.length - 1],
    earliestYear: years[0],
    perYear: corpusYears,
    generatedAt: new Date().toISOString(),
    totals: {
      years: years.length,
      clozeQuestions: corpusYears.reduce((a, y) => a + y.cloze, 0),
      readingQuestions: corpusYears.reduce((a, y) => a + y.reading, 0),
      nqtQuestions: corpusYears.reduce((a, y) => a + y.newQuestionType, 0),
    },
    warnings,
  };
  fs.writeFileSync(path.join(OUT_DIR, "corpus-meta.json"), JSON.stringify(meta, null, 2));

  console.log(
    `Corpus built: ${years.length} years (${years[0]}–${years[years.length - 1]}), ` +
      `${meta.totals.clozeQuestions} cloze + ${meta.totals.readingQuestions} reading questions.`,
  );
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log("  •", w));
  }
  if (errors.length) {
    console.error(`Validation errors (${errors.length}):`);
    errors.forEach((e) => console.error("  ✗", e));
    process.exit(1);
  }
}

main();
