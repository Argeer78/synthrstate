import { deepMerge } from "./merge.js";
import en from "./en.js";
import el from "./locales/el.js";
import de from "./locales/de.js";
import es from "./locales/es.js";
import fr from "./locales/fr.js";
import it from "./locales/it.js";
import nl from "./locales/nl.js";
import pt from "./locales/pt.js";
import sv from "./locales/sv.js";
import da from "./locales/da.js";
import fi from "./locales/fi.js";
import pl from "./locales/pl.js";
import cs from "./locales/cs.js";
import hu from "./locales/hu.js";
import ro from "./locales/ro.js";
import hr from "./locales/hr.js";
import tr from "./locales/tr.js";

const BY_LOCALE = {
  en,
  el,
  de,
  es,
  fr,
  it,
  nl,
  pt,
  sv,
  da,
  fi,
  pl,
  cs,
  hu,
  ro,
  hr,
  tr,
};

export function getMergedMessages(locale) {
  const key = String(locale || "en").toLowerCase().split("-")[0];
  const pick = BY_LOCALE[key];
  if (!pick || key === "en") return en;
  return deepMerge(en, pick);
}
