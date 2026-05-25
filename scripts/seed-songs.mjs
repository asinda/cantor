/**
 * Seed script — importe les chants des fichiers Word dans Supabase.
 * Usage: node scripts/seed-songs.mjs
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * La clé se trouve dans : Supabase Dashboard → Project Settings → API → service_role
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Lire .env.local ────────────────────────────────────────────
function readEnv() {
  const env = {};
  try {
    const lines = readFileSync(resolve(ROOT, ".env.local"), "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([^#=][^=]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* ignore */ }
  return env;
}

const env = readEnv();
const URL_  = env.NEXT_PUBLIC_SUPABASE_URL      ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY   = env.SUPABASE_SERVICE_ROLE_KEY     ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error("\n❌ Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env.local");
  console.error("   Trouvez la service_role key dans : Supabase Dashboard → Project Settings → API\n");
  process.exit(1);
}

const sb = createClient(URL_, KEY, { auth: { persistSession: false } });

// ── Données — chants extraits des 3 fichiers Word ──────────────

const SONGS = [
  // ── Messe 22/06/2025 ─────────────────────────────────────────
  {
    title: "Turengutse",
    liturgical_type: "entrée",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Chant d'entrée — Messe 22/06/2025",
  },
  {
    title: "Wewe warungitswe",
    liturgical_type: "kyrie",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Messe Twaracumuye",
  },
  {
    title: "Gloria iman'ininahazwe (Messe Urukundo)",
    liturgical_type: "gloria",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Ririmbiri Imana",
    liturgical_type: "alléluia",
    languages: ["ki"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Mbega Mw'abantu mugenda",
    liturgical_type: "offertoire",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Mweranda Mweranda",
    liturgical_type: "sanctus",
    languages: ["ki"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Dawe Wa Twese",
    composer: "Chorale Etoile du Soir",
    liturgical_type: "notre père",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Ngwino ngwino Yezu",
    liturgical_type: "communion",
    languages: ["ki"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "De toi, Seigneur",
    liturgical_type: "sortie",
    languages: ["fr"],
    status: "appris",
    difficulty: "moyen",
    notes: "Action de grâce",
  },
  {
    title: "Abemera yezu kristu (tur'indabo za Maria)",
    liturgical_type: "sortie",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Chant à la Vierge Marie",
  },
  {
    title: "Yama imurikira",
    liturgical_type: "sortie",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },

  // ── Messe 25/09/2025 (chants supplémentaires) ────────────────
  {
    title: "Kristu arahamagara abiwe",
    liturgical_type: "entrée",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Aussi nommé 'Twinjire gusenga Umukama' dans le carnet",
  },
  {
    title: "Gloria, Imana ininahazwe mw'ijuru",
    liturgical_type: "gloria",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Ijambo utuvagira Mana",
    liturgical_type: "alléluia",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Mbega Mana je nogushikanir'iki",
    liturgical_type: "offertoire",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Sanctus sanctus we sanctus",
    liturgical_type: "sanctus",
    languages: ["ki"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Agneau de Dieu",
    liturgical_type: "agnus dei",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Ingo mwaki'imana y'urukundo",
    liturgical_type: "communion",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Ngumiriza nigine Imana",
    liturgical_type: "sortie",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Action de grâce",
  },
  {
    title: "Uri mwiza Mariya",
    liturgical_type: "sortie",
    languages: ["ki"],
    status: "appris",
    difficulty: "moyen",
    notes: "Chant à la Vierge Marie",
  },

  // ── Carnet de chant — chants français & multilingues ─────────
  {
    title: "Avec toi, Seigneur",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Ô ! ma joie",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Syahamba",
    liturgical_type: "entrée",
    languages: ["ki", "sw", "fr", "en"],
    status: "appris",
    difficulty: "facile",
    notes: "Chant zoulou multilingue (FR/EN/KI/SW)",
  },
  {
    title: "Entrer dans ses portes",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Allons tous ensemble",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Nous voici Seigneur dans ta maison",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Amis, venez",
    liturgical_type: "entrée",
    languages: ["fr"],
    status: "en_cours",
    difficulty: "moyen",
  },
  {
    title: "Miséricorde insondable",
    liturgical_type: "kyrie",
    languages: ["fr"],
    status: "appris",
    difficulty: "moyen",
  },
  {
    title: "Twaracumuye tugirir'ikigongwe",
    liturgical_type: "kyrie",
    languages: ["ki"],
    status: "appris",
    difficulty: "facile",
  },
  {
    title: "Alléluia, lumière des nations",
    liturgical_type: "alléluia",
    languages: ["fr"],
    status: "appris",
    difficulty: "facile",
  },
];

// ── Feuilles de messe ──────────────────────────────────────────

const MASSE_SHEETS = [
  {
    title: "Messe du 22 juin 2025",
    date: "2025-06-22",
    liturgical_season: "temps ordinaire",
    notes: "Eglise — temps ordinaire",
    songs: [
      "Turengutse",
      "Wewe warungitswe",
      "Gloria iman'ininahazwe (Messe Urukundo)",
      "Ririmbiri Imana",
      "Mbega Mw'abantu mugenda",
      "Mweranda Mweranda",
      "Dawe Wa Twese",
      "Ngwino ngwino Yezu",
      "De toi, Seigneur",
      "Abemera yezu kristu (tur'indabo za Maria)",
      "Yama imurikira",
    ],
  },
  {
    title: "Messe du 25 septembre 2025",
    date: "2025-09-25",
    liturgical_season: "temps ordinaire",
    notes: "Eglise du Sacré Cœur de Patte d'Oie",
    songs: [
      "Kristu arahamagara abiwe",
      "Wewe warungitswe",
      "Gloria, Imana ininahazwe mw'ijuru",
      "Ijambo utuvagira Mana",
      "Mbega Mana je nogushikanir'iki",
      "Sanctus sanctus we sanctus",
      "Dawe Wa Twese",
      "Agneau de Dieu",
      "Ingo mwaki'imana y'urukundo",
      "Ngumiriza nigine Imana",
      "Uri mwiza Mariya",
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────

async function main() {
  // 1. Trouver la chorale
  const { data: choirs, error: choirErr } = await sb
    .from("choirs").select("id, name").limit(1);

  if (choirErr || !choirs?.length) {
    console.error("❌ Aucune chorale trouvée. Créez-en une dans l'app d'abord.");
    process.exit(1);
  }
  const { id: choirId, name: choirName } = choirs[0];
  console.log(`\n🎵 Chorale : "${choirName}" (${choirId})\n`);

  // 2. Vérifier les doublons existants
  const { data: existing } = await sb
    .from("songs").select("title").eq("choir_id", choirId);
  const existingTitles = new Set((existing ?? []).map((s) => s.title));

  // 3. Insérer les chants
  const songMap = {}; // title → id
  let created = 0, skipped = 0;

  for (const song of SONGS) {
    if (existingTitles.has(song.title)) {
      // Récupérer l'ID existant pour les feuilles de messe
      const { data } = await sb
        .from("songs").select("id").eq("choir_id", choirId).eq("title", song.title).single();
      if (data) songMap[song.title] = data.id;
      console.log(`  ⏭  ${song.title} (déjà existant)`);
      skipped++;
      continue;
    }

    const { data, error } = await sb.from("songs").insert({
      choir_id:        choirId,
      title:           song.title,
      composer:        song.composer ?? null,
      liturgical_type: song.liturgical_type,
      languages:       song.languages,
      status:          song.status,
      difficulty:      song.difficulty,
      notes:           song.notes ?? null,
    }).select("id").single();

    if (error) {
      console.error(`  ❌ ${song.title} — ${error.message}`);
    } else {
      songMap[song.title] = data.id;
      console.log(`  ✅ ${song.title}`);
      created++;
    }
  }

  console.log(`\n📊 Chants : ${created} créés, ${skipped} ignorés (doublons)\n`);

  // 4. Créer les feuilles de messe
  for (const sheet of MASSE_SHEETS) {
    // Vérifier doublon
    const { data: existSheet } = await sb
      .from("mass_sheets").select("id").eq("choir_id", choirId).eq("title", sheet.title).limit(1);
    if (existSheet?.length) {
      console.log(`  ⏭  Feuille "${sheet.title}" (déjà existante)`);
      continue;
    }

    const { data: created_sheet, error: sheetErr } = await sb.from("mass_sheets").insert({
      choir_id:         choirId,
      title:            sheet.title,
      date:             sheet.date,
      liturgical_season: sheet.liturgical_season,
      notes:            sheet.notes,
    }).select("id").single();

    if (sheetErr || !created_sheet) {
      console.error(`  ❌ Feuille "${sheet.title}" — ${sheetErr?.message}`);
      continue;
    }

    // Associer les chants
    const songLinks = sheet.songs
      .map((title, i) => {
        const song_id = songMap[title];
        if (!song_id) console.warn(`    ⚠️  Chant non trouvé : "${title}"`);
        return song_id ? { mass_sheet_id: created_sheet.id, song_id, position: i + 1 } : null;
      })
      .filter(Boolean);

    if (songLinks.length) {
      await sb.from("mass_sheet_songs").insert(songLinks);
    }
    console.log(`  ✅ Feuille "${sheet.title}" (${songLinks.length} chants)`);
  }

  console.log("\n✨ Import terminé !\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
