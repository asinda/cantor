import { NextRequest, NextResponse } from "next/server";

/* ────────────────────────────────────────────────────────────
   API /api/transcribe — Transcription intelligente sans IA
   Détecte automatiquement structure + type liturgique
──────────────────────────────────────────────────────────── */

// ── Détection automatique du type liturgique ───────────────
const LITURGICAL_KEYWORDS: Record<string, string[]> = {
  "kyrie":      ["kyrie", "kyrie eleison", "seigneur prends pitié", "christ prends pitié"],
  "gloria":     ["gloria", "gloire à dieu", "gloire au seigneur", "glory to god"],
  "psaume":     ["psaume", "psalm", "alléluia", "alleluia", "louez le seigneur"],
  "alléluia":   ["alleluia", "alléluia", "hosanna", "béni soit"],
  "sanctus":    ["sanctus", "saint saint saint", "holy holy holy", "hosanna au plus haut"],
  "agnus dei":  ["agnus dei", "agneau de dieu", "lamb of god", "qui enlève les péchés"],
  "notre père": ["notre père", "our father", "padre nuestro", "pater noster"],
  "communion":  ["communion", "venez manger", "pain de vie", "corps du christ"],
  "entrée":     ["entrée", "procession", "venez adorons", "venez chanter", "rassemblés"],
  "sortie":     ["sortie", "allez en paix", "go in peace", "envoi", "ite missa est"],
  "offertoire": ["offertoire", "offrande", "présentation", "prière sur les offrandes"],
};

function detectLiturgicalType(text: string): string | null {
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [type, keywords] of Object.entries(LITURGICAL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.normalize("NFD").replace(/[̀-ͯ]/g, "")))) {
      return type;
    }
  }
  return null;
}

// ── Détection automatique de la langue dominante ──────────
function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = { fr: 0, en: 0, ki: 0, sw: 0 };

  // Français
  const frWords = ["le","la","les","de","du","des","et","en","un","une","que","qui","je","tu","nous","vous","est","sont","avec","pour","dans","sur","par"];
  frWords.forEach(w => { if (lower.includes(` ${w} `)) scores.fr += 2; });

  // Anglais
  const enWords = ["the","and","is","are","of","to","in","for","with","you","we","god","lord","praise","glory","holy","amen"];
  enWords.forEach(w => { if (lower.includes(` ${w} `)) scores.en += 2; });

  // Kirundi
  const kiWords = ["imana","yezu","mwami","tunga","tukunda","niwe","turamutse","ni","turi","ubuzima","ubuntu"];
  kiWords.forEach(w => { if (lower.includes(w)) scores.ki += 3; });

  // Swahili
  const swWords = ["mungu","bwana","yesu","asante","amina","roho","neema","upendo","mwenyezi","tukufu"];
  swWords.forEach(w => { if (lower.includes(w)) scores.sw += 3; });

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "fr";
}

// ── Structuration intelligente des paroles ─────────────────
function structureLyrics(raw: string): string {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return "";

  const result: string[] = [];
  let coupletCount  = 0;
  let currentBlock: string[] = [];
  let prevLineEmpty = false;

  // Mots-clés de section déjà présents dans le texte
  const sectionPattern = /^(couplet|verse|refrain|chorus|bridge|pont|intro|outro|interlude|strophe|stanza|répons|antienne)\s*\d*/i;
  const hasExistingStructure = lines.some(l => sectionPattern.test(l));

  function flushBlock(label?: string) {
    if (currentBlock.length === 0) return;
    if (label) result.push(label);
    result.push(...currentBlock);
    result.push("");
    currentBlock = [];
  }

  if (hasExistingStructure) {
    // Le texte a déjà des labels de section → nettoyer + normaliser
    for (const line of lines) {
      if (sectionPattern.test(line)) {
        flushBlock();
        // Normaliser le label
        const normalized = line.charAt(0).toUpperCase() + line.slice(1).toLowerCase();
        result.push(`${normalized} :`);
      } else if (line === "") {
        if (!prevLineEmpty) flushBlock();
      } else {
        currentBlock.push(line);
      }
      prevLineEmpty = line === "";
    }
    flushBlock();
  } else {
    // Pas de structure → détecter les blocs et les labeler
    // Un bloc = groupe de lignes séparées par des lignes vides
    const blocks: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      if (line === "") {
        if (current.length > 0) { blocks.push(current); current = []; }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) blocks.push(current);

    if (blocks.length === 0) return basicClean(raw);

    if (blocks.length === 1) {
      // Un seul bloc → essayer de détecter refrain/couplets par répétition
      return blocks[0].join("\n");
    }

    // Plusieurs blocs : détecter les répétitions (= refrain)
    const blockTexts = blocks.map(b => b.join("\n").toLowerCase().replace(/\s+/g, " "));
    const refrainIdx = new Set<number>();

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const sim = similarity(blockTexts[i], blockTexts[j]);
        if (sim > 0.7) { refrainIdx.add(i); refrainIdx.add(j); }
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      if (refrainIdx.has(i)) {
        const isFirst = !Array.from(refrainIdx).some(idx => idx < i && similarity(blockTexts[idx], blockTexts[i]) > 0.7);
        result.push(isFirst ? "Refrain :" : "Refrain :");
      } else {
        coupletCount++;
        result.push(`Couplet ${coupletCount} :`);
      }
      result.push(...blocks[i]);
      result.push("");
    }
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Similarité simple entre deux chaînes (ratio de mots communs)
function similarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = [...setA].filter(w => setB.has(w)).length;
  return (2 * intersection) / (setA.size + setB.size);
}

// ── Nettoyage de base ──────────────────────────────────────
function basicClean(text: string): string {
  return text
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^\s+|\s+$/g, "")
    .trim();
}

// ── Formatage final (Claude si dispo, sinon structureLyrics) ─
async function formatText(rawText: string): Promise<{ lyrics: string; liturgical_type?: string; language?: string }> {
  const liturgical_type = detectLiturgicalType(rawText) ?? undefined;
  const language        = detectLanguage(rawText);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message   = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 4096,
        system: `Formate ces paroles de chant : structure couplets/refrain avec labels clairs, corrige les erreurs OCR. Retourne UNIQUEMENT les paroles.`,
        messages: [{ role: "user", content: rawText }],
      });
      const block  = message.content.find((b: any) => b.type === "text");
      const lyrics = (block as any)?.text ?? structureLyrics(rawText);
      return { lyrics, liturgical_type, language };
    } catch {
      // Claude a échoué → fallback structureLyrics
    }
  }

  return { lyrics: structureLyrics(rawText), liturgical_type, language };
}

// ── Extraction Word (.docx) ────────────────────────────────
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result  = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ── Extraction PDF ─────────────────────────────────────────
async function extractFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data     = await pdfParse(buffer);
  return data.text;
}

// ── OCR Image via Tesseract.js ─────────────────────────────
async function extractFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("fra+eng");
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  } catch (err) {
    // Fallback Claude Vision si dispo
    if (process.env.ANTHROPIC_API_KEY) {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message   = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 4096,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType as any, data: buffer.toString("base64") } },
            { type: "text",  text: "Transcris exactement le texte visible sur cette image. Paroles de chant." },
          ],
        }],
      });
      const block = message.content.find((b: any) => b.type === "text");
      return (block as any)?.text ?? "";
    }
    throw new Error("OCR échoué. Réessayez ou configurez ANTHROPIC_API_KEY pour utiliser Claude Vision.");
  }
}

// ── Sous-titres YouTube ────────────────────────────────────
async function extractYoutubeTranscript(url: string): Promise<string> {
  const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?#]+)/)?.[1];
  if (!videoId) throw new Error("URL YouTube invalide");

  try {
    const { YoutubeTranscript } = await import("youtube-transcript");

    // Essayer en français d'abord
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "fr" })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId));

    if (!segments || segments.length === 0)
      throw new Error("Aucun sous-titre disponible. Activez les sous-titres automatiques YouTube.");

    return segments.map((s: any) => s.text).join("\n");
  } catch (e: any) {
    throw new Error(
      e.message?.includes("sous-titre") ? e.message :
      "Impossible d'extraire les sous-titres. Vérifiez que la vidéo est publique avec sous-titres activés."
    );
  }
}

// ══ Handler principal ══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isJson      = contentType.includes("application/json");

    // ── JSON : YouTube URL ou transcription vocale ──
    if (isJson) {
      const body = await req.json().catch(() => ({}));

      if (body.youtube_url) {
        const rawText = await extractYoutubeTranscript(body.youtube_url);
        const result  = await formatText(rawText);
        return NextResponse.json({ ...result, source: "youtube" });
      }

      if (body.voice_transcript) {
        const result = await formatText(body.voice_transcript);
        return NextResponse.json({ ...result, source: "voice" });
      }

      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }

    // ── Multipart : fichier ──
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    let rawText = "";
    let source  = "file";

    if (fileName.endsWith(".docx") || mimeType.includes("wordprocessingml") || fileName.endsWith(".doc")) {
      rawText = await extractFromDocx(buffer);
      source  = "word";
    } else if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      rawText = await extractFromPdf(buffer);
      source  = "pdf";
    } else if (mimeType.startsWith("image/")) {
      rawText = await extractFromImage(buffer, mimeType);
      source  = "image";
    } else {
      return NextResponse.json({ error: "Format non supporté : .docx, .pdf, .jpg, .png, .webp" }, { status: 415 });
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Document vide ou illisible" }, { status: 422 });
    }

    const result = await formatText(rawText);
    return NextResponse.json({ ...result, source });

  } catch (e: any) {
    console.error("[/api/transcribe]", e.message);
    return NextResponse.json({ error: e.message ?? "Erreur interne" }, { status: 500 });
  }
}
