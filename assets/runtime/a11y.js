/*
 * <ds-a11y> — accessibility button and preferences panel. No dependency, no network, no cookie.
 *   <ds-a11y></ds-a11y>          fixed button (bottom-left by default) + non-modal side sheet · placement="inline" (button in the flow)
 *   placement="none"             no button: any [data-a11y-open] element opens it (a user menu, a skip link)
 * A preferences panel, not an "overlay": the page must meet WCAG 2.2 AA without it. It never rewrites content or calls a
 * service, and follows prefers-reduced-motion / -contrast / -color-scheme / forced-colors until the person chooses.
 *
 * attributes  storage local (default, localStorage "<DS.slug>-a11y") · none (the host saves, e.g. the user's profile)
 *   position left (default) · right (button and sheet on the right; keep the corner free of chat bubbles and toasts)
 *   theme data-theme (default) · class (<html class="dark">) · none (event only: the page owns light/dark)
 *   help-key "?" (default) · off · font-base folder of the Atkinson Hyperlegible woff2 (default "fonts/")
 *   demo       static embedded panel for documentation (no page effect, storage or shortcut); prefs='{json}', demo-state
 *              focus · reset · unsupported
 * effects on <html> (styled by the CSS this file injects): data-a11y-text 110…200 (rem scale) · -leading 1.5|1.8|2 ·
 *   -spacing 1|2 · -font readable · -align left · -measure on · -theme light|dark · -contrast more · -cvd rg|by ·
 *   -saturate low · -links underline · -motion reduce · -media paused · -autoplay off · -focus strong · -guide guide|mask ·
 *   -cursor large · -highlight on · -targets large. Contrast and colour-vision modes rewrite the design-system tokens
 *   (--color-*, --chart-1…n) with values computed by build.py (window.DS.a11yCss): pages opt in by using rem for text
 *   and the tokens for colours. Elements with [data-motion-host] get motion="reduce" when motion is reduced.
 * API   el.open(opener) · close() · toggle() · reset() · set(patch) · el.prefs (validated; setting it applies, no save)
 *       window.DSA11y.{open, close, toggle, reset, set, prefs, element, reducedMotion()}
 * events (bubbling) ds-a11y:change {prefs, changed} · :open · :close · :lang {lang} (cancelable; by default the panel
 *       switches the page language with window.DSLang.set, or sets <html lang data-lang> and fires ds:lang)
 * keys  Alt+A (Option+A) toggles from anywhere · ? lists shortcuts · Esc closes, focus returns to what opened it.
 * Strings exist in fr, it, en; any other page language shows English in the panel.
 */
(function () {
  "use strict";
  if (!window.customElements || window.customElements.get("ds-a11y")) return;

  var STORE = ((window.DS && window.DS.slug) || "ds") + "-a11y";
  var LANGS = ["fr", "it", "en"]; // languages the strings exist in
  var PAGE_LANGS = (window.DS && window.DS.langs) || LANGS;
  var LOCALES = { fr: "fr-FR", it: "it-IT", en: "en-GB", es: "es-ES", de: "de-DE", pt: "pt-PT", nl: "nl-NL" };
  var DEFAULTS = Object.freeze({ text: 100, leading: 0, spacing: 0, font: false, align: false, measure: false, theme: "system", contrast: null, cvd: "none", saturate: false, links: false, motion: null, media: false, autoplay: false, focus: false, guide: "off", cursor: false, highlight: false, targets: false, keys: true });
  var LEADING = [0, 1.5, 1.8, 2];
  var ENUMS = { theme: ["system", "light", "dark"], cvd: ["none", "rg", "by"], guide: ["off", "guide", "mask"] };
  var RANGES = { text: [100, 200, 10], leading: [0, 3, 1], spacing: [0, 2, 1] };
  var SYSTEM = { contrast: "(prefers-contrast: more)", motion: "(prefers-reduced-motion: reduce)" };
  var COLOUR_KEYS = ["contrast", "cvd", "saturate"];
  var NARROW = "(max-width: 560px)";
  var PROFILES = [
    { id: "vision", icon: "eye", set: { text: 150, contrast: true, focus: true, cursor: true, links: true } },
    { id: "dyslexia", icon: "text", set: { font: true, spacing: 1, leading: 2, align: true, measure: true } },
    { id: "motion", icon: "pause", set: { motion: true, media: true, autoplay: true } },
    { id: "focus", icon: "target", set: { guide: "mask", motion: true, media: true, saturate: true } },
    { id: "keyboard", icon: "keyboard", set: { focus: true, targets: true, highlight: true } },
    { id: "colour", icon: "colors", set: { cvd: "rg", links: true } },
  ];
  var GROUPS = [["text", [["text", "range"], ["leading", "range"], ["spacing", "range"], ["font", "switch"], ["align", "switch"], ["measure", "switch"]]],
    ["colour", [["theme", "radio"], ["contrast", "switch"], ["cvd", "radio"], ["saturate", "switch"], ["links", "switch"]]], ["motion", [["motion", "switch"], ["media", "switch"], ["autoplay", "switch"]]],
    ["reading", [["focus", "switch"], ["guide", "radio"], ["cursor", "switch"], ["highlight", "switch"], ["targets", "switch"], ["speech", "speech"]]], ["lang", [["lang", "radio"]]]];

  /* ------------------------------------------------------------------ strings: [fr, it, en] */
  var S = {
    title: ["Accessibilité", "Accessibilità", "Accessibility"],
    intro: ["Adaptez l'affichage à vos besoins. Les réglages de votre système s'appliquent tant que vous ne les changez pas.", "Adatta la visualizzazione alle tue esigenze. Le impostazioni del sistema valgono finché non le cambi.", "Adapt the display to your needs. Your system settings apply until you change them."],
    close: ["Fermer", "Chiudi", "Close"], count0: ["Réglages par défaut", "Impostazioni predefinite", "Default settings"], count1: ["réglage actif", "impostazione attiva", "setting on"], countN: ["réglages actifs", "impostazioni attive", "settings on"],
    g_profiles: ["Profils rapides", "Profili rapidi", "Quick profiles"],
    h_profiles: ["Un clic combine plusieurs réglages ; chacun reste modifiable ensuite.", "Un clic combina più impostazioni; ognuna resta modificabile.", "One click combines several settings; each one stays adjustable."],
    p_vision: ["Vision réduite", "Ipovisione", "Low vision"], d_vision: ["Texte à 150 %, contraste élevé, focus et curseur bien visibles", "Testo al 150%, contrasto elevato, focus e cursore ben visibili", "150% text, high contrast, strong focus and cursor"],
    p_dyslexia: ["Dyslexie", "Dislessia", "Dyslexia"], d_dyslexia: ["Police lisible, texte aéré, lignes courtes", "Font leggibile, testo arioso, righe brevi", "Readable font, airy text, short lines"],
    p_motion: ["Sensibilité au mouvement", "Sensibilità al movimento", "Motion sensitivity"], d_motion: ["Animations, vidéos et lecture automatique arrêtées (épilepsie, troubles vestibulaires)", "Animazioni, video e riproduzione automatica ferme (epilessia, disturbi vestibolari)", "Animations, videos and autoplay stopped (epilepsy, vestibular disorders)"],
    p_focus: ["Concentration", "Concentrazione", "Focus"], d_focus: ["Masque de lecture, moins de mouvement et de couleur (TDAH)", "Maschera di lettura, meno movimento e colore (ADHD)", "Reading mask, less motion and colour (ADHD)"],
    p_keyboard: ["Mobilité · clavier", "Mobilità · tastiera", "Mobility · keyboard"], d_keyboard: ["Focus très visible, cibles de 44 px, titres et liens repérés", "Focus molto visibile, target da 44 px, titoli e link evidenziati", "Strong focus, 44 px targets, headings and links marked"],
    p_colour: ["Daltonisme", "Daltonismo", "Colour blindness"], d_colour: ["Couleurs sûres pour rouge-vert, liens soulignés", "Colori sicuri per rosso-verde, link sottolineati", "Red-green safe colours, underlined links"],
    preview: ["Aperçu", "Anteprima", "Preview"],
    pv_text: ["Votre commande n° 1042 est prête : 48 €, à retirer avant vendredi.", "Il tuo ordine n. 1042 è pronto: 48 €, da ritirare entro venerdì.", "Your order #1042 is ready: €48, to collect by Friday."],
    pv_link: ["Voir la commande", "Vedi l'ordine", "See the order"], pv_ok: ["Payée", "Pagato", "Paid"], pv_warn: ["En attente", "In attesa", "Pending"], pv_bad: ["Annulée", "Annullato", "Cancelled"], g_text: ["Texte", "Testo", "Text"],
    o_text: ["Taille du texte", "Dimensione del testo", "Text size"], o_leading: ["Interligne", "Interlinea", "Line spacing"], o_spacing: ["Espacement des lettres et des mots", "Spaziatura di lettere e parole", "Letter and word spacing"],
    o_font: ["Police lisible", "Font leggibile", "Readable font"], h_font: ["Atkinson Hyperlegible, dessinée pour la basse vision", "Atkinson Hyperlegible, disegnato per l'ipovisione", "Atkinson Hyperlegible, designed for low vision"],
    o_align: ["Aligner le texte à gauche", "Allinea il testo a sinistra", "Align text left"], h_align: ["Jamais de texte justifié", "Mai testo giustificato", "Never justified text"],
    o_measure: ["Largeur de lecture limitée", "Larghezza di lettura limitata", "Limited line length"], h_measure: ["70 caractères par ligne au plus", "Al massimo 70 caratteri per riga", "At most 70 characters per line"],
    v_normal: ["Normal", "Normale", "Normal"], v_airy: ["Aéré", "Arioso", "Airy"], v_airier: ["Très aéré", "Molto arioso", "Very airy"], g_colour: ["Couleur et contraste", "Colore e contrasto", "Colour and contrast"],
    o_theme: ["Thème", "Tema", "Theme"], v_system: ["Système", "Sistema", "System"], v_light: ["Clair", "Chiaro", "Light"], v_dark: ["Sombre", "Scuro", "Dark"],
    o_contrast: ["Contraste élevé", "Contrasto elevato", "High contrast"], h_contrast: ["Textes et bordures renforcés, AAA quand c'est possible", "Testi e bordi rinforzati, AAA dove possibile", "Stronger text and borders, AAA where possible"],
    o_cvd: ["Couleurs des statuts et graphiques", "Colori di stati e grafici", "Status and chart colours"], h_cvd: ["Palettes de remplacement ; la page n'est jamais filtrée", "Palette alternative; la pagina non viene mai filtrata", "Alternative palettes; the page is never filtered"],
    v_none: ["Standard", "Standard", "Standard"], v_rg: ["Rouge-vert", "Rosso-verde", "Red-green"], v_by: ["Bleu-jaune", "Blu-giallo", "Blue-yellow"],
    o_saturate: ["Saturation réduite", "Saturazione ridotta", "Reduced saturation"], o_links: ["Souligner les liens", "Sottolinea i link", "Underline links"],
    forced: ["Couleurs forcées actives : votre système gère déjà les couleurs, ces réglages sont suspendus.", "Colori forzati attivi: il sistema gestisce già i colori, queste impostazioni sono sospese.", "Forced colours are on: your system already manages colours, so these settings are paused."],
    g_motion: ["Mouvement", "Movimento", "Motion"],
    o_motion: ["Réduire les animations", "Riduci le animazioni", "Reduce animations"], h_motion: ["Illustrations, personnages et ouverture immobiles", "Illustrazioni, personaggi e apertura fermi", "Illustrations, characters and splash held still"],
    o_media: ["Mettre en pause vidéos et GIF", "Metti in pausa video e GIF", "Pause videos and GIFs"], o_autoplay: ["Pas de lecture automatique", "Nessuna riproduzione automatica", "No autoplay"],
    sys: ["Activé par votre système", "Attivato dal sistema", "On in your system settings"], g_reading: ["Lecture et navigation", "Lettura e navigazione", "Reading and navigation"],
    o_focus: ["Focus très visible", "Focus molto visibile", "Strong focus ring"], h_focus: ["Anneau épais à deux tons, visible sur tous les fonds", "Anello spesso a due toni, visibile su ogni sfondo", "Thick two-tone ring, visible on any background"],
    o_guide: ["Aide à la lecture", "Aiuto alla lettura", "Reading aid"], h_guide: ["Suit la souris et le focus du clavier", "Segue il mouse e il focus da tastiera", "Follows the pointer and keyboard focus"],
    v_off: ["Aucune", "Nessuno", "None"], v_guide: ["Guide", "Guida", "Guide"], v_mask: ["Masque", "Maschera", "Mask"],
    o_cursor: ["Curseur agrandi", "Cursore ingrandito", "Large cursor"], o_highlight: ["Repérer titres et liens", "Evidenzia titoli e link", "Mark headings and links"],
    o_targets: ["Cibles agrandies", "Target ingranditi", "Larger targets"], h_targets: ["44 px au moins pour boutons et champs", "Almeno 44 px per pulsanti e campi", "At least 44 px for buttons and fields"],
    o_speech: ["Lecture à voix haute", "Lettura ad alta voce", "Read aloud"], h_speech: ["Voix de votre appareil, aucun service externe", "Voce del dispositivo, nessun servizio esterno", "Your device's voice, no external service"],
    sp_read: ["Lire la sélection", "Leggi la selezione", "Read selection"], sp_pause: ["Pause", "Pausa", "Pause"], sp_resume: ["Reprendre", "Riprendi", "Resume"], sp_stop: ["Arrêter", "Interrompi", "Stop"],
    sp_idle: ["Sélectionnez un passage de la page, puis « Lire la sélection ».", "Seleziona un passaggio della pagina, poi «Leggi la selezione».", "Select a passage on the page, then “Read selection”."],
    sp_playing: ["Lecture en cours…", "Lettura in corso…", "Reading…"], sp_paused: ["Lecture en pause.", "Lettura in pausa.", "Reading paused."],
    sp_none: ["Aucun texte sélectionné sur la page.", "Nessun testo selezionato nella pagina.", "No text selected on the page."],
    sp_unsupported: ["La synthèse vocale n'est pas disponible dans ce navigateur.", "La sintesi vocale non è disponibile in questo browser.", "Speech synthesis is not available in this browser."],
    g_lang: ["Langue", "Lingua", "Language"], o_lang: ["Langue de l'interface", "Lingua dell'interfaccia", "Interface language"],
    v_fr: ["Français", "Français", "Français"], v_it: ["Italiano", "Italiano", "Italiano"], v_en: ["English", "English", "English"], keys: ["Raccourcis clavier", "Scorciatoie da tastiera", "Keyboard shortcuts"],
    k_toggle: ["Ouvrir ou fermer ce panneau, de n'importe où", "Aprire o chiudere questo pannello, ovunque", "Open or close this panel, from anywhere"],
    k_help: ["Afficher ces raccourcis", "Mostrare queste scorciatoie", "Show these shortcuts"], k_esc: ["Fermer et revenir où vous étiez", "Chiudere e tornare dov'eri", "Close and go back where you were"],
    k_tab: ["Passer d'un réglage à l'autre", "Passare da un'impostazione all'altra", "Move between settings"], k_arrows: ["Changer une valeur ou un choix", "Cambiare un valore o una scelta", "Change a value or a choice"],
    o_keys: ["Touche « ? » active", "Tasto «?» attivo", "“?” key on"], h_keys: ["À couper si vous dictez ou pilotez à la voix", "Da disattivare se detti o usi comandi vocali", "Turn off if you dictate or use voice control"],
    k_space: ["Activer un interrupteur ou un profil", "Attivare un interruttore o un profilo", "Toggle a switch or a profile"], key_shift: ["Maj", "Maiusc", "Shift"], key_esc: ["Échap", "Esc", "Esc"], key_space: ["Espace", "Spazio", "Space"],
    reset: ["Réinitialiser", "Reimposta", "Reset"], undo: ["Annuler", "Annulla", "Undo"],
    was_reset: ["Préférences réinitialisées.", "Preferenze reimpostate.", "Preferences reset."], was_undone: ["Préférences restaurées.", "Preferenze ripristinate.", "Preferences restored."],
    saved_local: ["Enregistré sur cet appareil uniquement : pas de cookie, pas de suivi.", "Salvato solo su questo dispositivo: nessun cookie, nessun tracciamento.", "Saved on this device only: no cookies, no tracking."],
    saved_none: ["Vos choix sont enregistrés par l'application hôte.", "Le scelte sono salvate dall'applicazione ospite.", "Your choices are saved by the host application."],
    principle: ["Ce panneau adapte l'affichage ; il ne remplace pas un site accessible et ne le certifie pas.", "Questo pannello adatta la visualizzazione; non sostituisce un sito accessibile e non lo certifica.", "This panel adapts the display; it neither replaces nor certifies an accessible site."],
    on: ["activé", "attivato", "on"], off: ["désactivé", "disattivato", "off"], less: ["Réduire", "Riduci", "Decrease"], more: ["Augmenter", "Aumenta", "Increase"],
    profile_on: ["Profil activé", "Profilo attivato", "Profile on"], profile_off: ["Profil retiré", "Profilo rimosso", "Profile off"],
  };

  var ICONS = {
    access: "<path d='M12 6.5C12.8284 6.5 13.5 5.82843 13.5 5C13.5 4.17157 12.8284 3.5 12 3.5C11.1716 3.5 10.5 4.17157 10.5 5C10.5 5.82843 11.1716 6.5 12 6.5Z'/><path d='M18 7C16.4537 8.23719 14.336 9 12 9C9.66404 9 7.54628 8.23719 6 7'/><path d='M13.5 14.5L14.5 20.5M13.5 14.5V9M13.5 14.5H10.5M9.5 20.5L10.5 14.5M10.5 14.5V9'/>",
    close: "<path d='M18 6L6.00081 17.9992M17.9992 18L6 6.00085'/>",
    reset: "<path d='M20.9373 13C20.9736 12.6717 20.9922 12.338 20.9922 12C20.9922 7.02944 16.9628 3 11.9922 3C9.16492 3 6.64214 4.30367 4.99219 6.34267M3.04712 11C3.01082 11.3283 2.99219 11.662 2.99219 12C2.99219 16.9706 7.02162 21 11.9922 21C14.8195 21 17.3422 19.6963 18.9922 17.6573'/><path d='M7.99219 7H6.99219C5.57797 7 4.87087 7 4.43153 6.56066C3.99219 6.12132 3.99219 5.41421 3.99219 4V3'/><path d='M15.9922 17H16.9922C18.4064 17 19.1135 17 19.5528 17.4393C19.9922 17.8787 19.9922 18.5858 19.9922 20V21'/>",
    eye: "<path d='M2 8C2 8 6.47715 3 12 3C17.5228 3 22 8 22 8'/><path d='M21.544 13.045C21.848 13.4713 22 13.6845 22 14C22 14.3155 21.848 14.5287 21.544 14.955C20.1779 16.8706 16.6892 21 12 21C7.31078 21 3.8221 16.8706 2.45604 14.955C2.15201 14.5287 2 14.3155 2 14C2 13.6845 2.15201 13.4713 2.45604 13.045C3.8221 11.1294 7.31078 7 12 7C16.6892 7 20.1779 11.1294 21.544 13.045Z'/><path d='M15 14C15 12.3431 13.6569 11 12 11C10.3431 11 9 12.3431 9 14C9 15.6569 10.3431 17 12 17C13.6569 17 15 15.6569 15 14Z'/>",
    text: "<path d='M14 19L11.1069 10.7479C9.76348 6.91597 9.09177 5 8 5C6.90823 5 6.23652 6.91597 4.89309 10.7479L2 19M4.5 12H11.5'/><path d='M21.9692 13.9392V18.4392M21.9692 13.9392C22.0164 13.1161 22.0182 12.4891 21.9194 11.9773C21.6864 10.7709 20.4258 10.0439 19.206 9.89599C18.0385 9.75447 17.1015 10.055 16.1535 11.4363M21.9692 13.9392L19.1256 13.9392C18.6887 13.9392 18.2481 13.9603 17.8272 14.0773C15.2545 14.7925 15.4431 18.4003 18.0233 18.845C18.3099 18.8944 18.6025 18.9156 18.8927 18.9026C19.5703 18.8724 20.1955 18.545 20.7321 18.1301C21.3605 17.644 21.9692 16.9655 21.9692 15.9392V13.9392Z'/>",
    pause: "<circle cx='12' cy='12' r='10'/><path d='M9.5 9L9.5 15M14.5 9V15'/>",
    target: "<path d='M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7'/><path d='M14 2.20004C13.3538 2.06886 12.6849 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10'/><path d='M12.0303 11.9625L16.5832 7.4096M19.7404 4.34462L19.1872 2.35748C19.0853 2.03011 18.6914 1.89965 18.4259 2.11662C16.9898 3.29018 15.4254 4.87091 16.703 7.36419C19.2771 8.56455 20.7466 6.94584 21.8733 5.5853C22.0975 5.3146 21.9623 4.90767 21.6247 4.81005L19.7404 4.34462Z'/>",
    keyboard: "<path d='M14.5 7H9.5C6.21252 7 4.56878 7 3.46243 7.90796C3.25989 8.07418 3.07418 8.25989 2.90796 8.46243C2 9.56878 2 11.2125 2 14.5C2 17.7875 2 19.4312 2.90796 20.5376C3.07418 20.7401 3.25989 20.9258 3.46243 21.092C4.56878 22 6.21252 22 9.5 22H14.5C17.7875 22 19.4312 22 20.5376 21.092C20.7401 20.9258 20.9258 20.7401 21.092 20.5376C22 19.4312 22 17.7875 22 14.5C22 11.2125 22 9.56878 21.092 8.46243C20.9258 8.25989 20.7401 8.07418 20.5376 7.90796C19.4312 7 17.7875 7 14.5 7Z'/><path d='M12 7V5C12 4.44772 12.4477 4 13 4C13.5523 4 14 3.55228 14 3V2'/><path d='M7 12L8 12'/><path d='M11.5 12L12.5 12'/><path d='M16 12L17 12'/><path d='M7 17L17 17'/>",
    colors: "<path d='M17.5798 9.71016C17.0765 9.57314 16.5468 9.5 16 9.5C13.4668 9.5 11.3002 11.0699 10.4202 13.2898M17.5798 9.71016C20.1271 10.4036 22 12.7331 22 15.5C22 18.8137 19.3137 21.5 16 21.5C14.4633 21.5 13.0615 20.9223 12 19.9722M17.5798 9.71016C17.851 9.02618 18 8.2805 18 7.5C18 4.18629 15.3137 1.5 12 1.5C8.68629 1.5 6 4.18629 6 7.5C6 8.2805 6.14903 9.02618 6.42018 9.71016M10.4202 13.2898C10.149 13.9738 10 14.7195 10 15.5C10 17.277 10.7725 18.8736 12 19.9722M10.4202 13.2898C8.59146 12.792 7.11029 11.451 6.42018 9.71016M6.42018 9.71016C3.87294 10.4036 2 12.7331 2 15.5C2 18.8137 4.68629 21.5 8 21.5C9.53671 21.5 10.9385 20.9223 12 19.9722'/>",
    tick: "<path d='M5 14L8.5 17.5L19 6.5'/>",
    minus: "<path d='M20 12L4 12'/>",
    plus: "<path d='M12 4V20M20 12H4'/>",
    play: "<path d='M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z'/>",
    stop: "<path d='M4 12C4 8.72077 4 7.08116 4.81382 5.91891C5.1149 5.48891 5.48891 5.1149 5.91891 4.81382C7.08116 4 8.72077 4 12 4C15.2792 4 16.9188 4 18.0811 4.81382C18.5111 5.1149 18.8851 5.48891 19.1862 5.91891C20 7.08116 20 8.72077 20 12C20 15.2792 20 16.9188 19.1862 18.0811C18.8851 18.5111 18.5111 18.8851 18.0811 19.1862C16.9188 20 15.2792 20 12 20C8.72077 20 7.08116 20 5.91891 19.1862C5.48891 18.8851 5.1149 18.5111 4.81382 18.0811C4 16.9188 4 15.2792 4 12Z'/>",
    pauseb: "<path d='M4 7C4 5.58579 4 4.87868 4.43934 4.43934C4.87868 4 5.58579 4 7 4C8.41421 4 9.12132 4 9.56066 4.43934C10 4.87868 10 5.58579 10 7V17C10 18.4142 10 19.1213 9.56066 19.5607C9.12132 20 8.41421 20 7 20C5.58579 20 4.87868 20 4.43934 19.5607C4 19.1213 4 18.4142 4 17V7Z'/><path d='M14 7C14 5.58579 14 4.87868 14.4393 4.43934C14.8787 4 15.5858 4 17 4C18.4142 4 19.1213 4 19.5607 4.43934C20 4.87868 20 5.58579 20 7V17C20 18.4142 20 19.1213 19.5607 19.5607C19.1213 20 18.4142 20 17 20C15.5858 20 14.8787 20 14.4393 19.5607C14 19.1213 14 18.4142 14 17V7Z'/>",
  };

  /* ------------------------------------------------------------------ CSS on the page (effects, tokens, font) */
  var CUR = function (svg, x, y, fb) { return "url(\"data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'>" + svg + "</svg>") + "\") " + x + " " + y + "," + fb; };
  var ARROW = "<path d='M5 2.5 19 13l-6.3.9 3.7 7.1-2.8 1.5-3.7-7.2L5 20z' fill='#FILL' stroke='#fff' stroke-width='1.5' stroke-linejoin='round'/>";
  var BEAM = "<path d='M8 3.5h8M8 20.5h8M12 3.5v17' stroke='#fff' stroke-width='4.5' stroke-linecap='round' fill='none'/><path d='M8 3.5h8M8 20.5h8M12 3.5v17' stroke='#111111' stroke-width='2' stroke-linecap='round' fill='none'/>";
  var DK = "html.dark,html[data-theme=dark]";
  var TOKENS =
    ":root{--ax-bg:var(--color-bg,#FFFFFF);--ax-surface:var(--color-surface,#F4F4F5);--ax-text:var(--color-text,#18181B);--ax-muted:var(--color-text-muted,#52525B);--ax-primary:var(--color-primary,#1D4ED8);--ax-on-primary:var(--color-on-primary,#FFFFFF);--ax-border:var(--color-border,#D4D4D8);--ax-control:var(--input-border,#1D4ED8);--ax-focus:var(--color-focus,#1D4ED8);--ax-shade:rgb(0 0 0/.6);--ax-font:var(--font-body,\"Segoe UI\",system-ui,sans-serif)}" +
    DK + "{--ax-bg:var(--color-bg,#111111);--ax-surface:var(--color-surface,#18181B);--ax-text:var(--color-text,#D4D4D8);--ax-muted:var(--color-text-muted,#A1A1AA);--ax-primary:var(--color-primary,#60A5FA);--ax-on-primary:var(--color-on-primary,#111111);--ax-border:var(--color-border,#3F3F46);--ax-control:var(--input-border,#60A5FA);--ax-focus:var(--color-focus,#93C5FD);--ax-shade:rgb(0 0 0/.72)}" +
    ((window.DS && window.DS.a11yCss) || "");
  var NOT = ":not(svg *):not(code):not(pre):not(kbd):not(samp):not([class^=icon-]):not([class*=' icon-'])";
  var EFFECTS =
    "html[data-a11y-text]{font-size:calc(var(--ax-scale,1)*100%)!important}html[data-a11y-leading] body *:not(svg *){line-height:var(--ax-leading)!important}html[data-a11y-spacing='1']{--ax-letter:.12em;--ax-word:.16em;--ax-para:2em}html[data-a11y-spacing='2']{--ax-letter:.18em;--ax-word:.3em;--ax-para:2.5em}" +
    "html[data-a11y-spacing] body *:not(svg *){letter-spacing:var(--ax-letter)!important;word-spacing:var(--ax-word)!important}html[data-a11y-spacing] body p:not(:last-child){margin-bottom:var(--ax-para)!important}" +
    "html[data-a11y-font=readable]{--ax-font:\"Atkinson Hyperlegible\",Verdana,system-ui,sans-serif;--font-body:var(--ax-font);--font-heading:var(--ax-font)}html[data-a11y-font=readable] body *" + NOT + "{font-family:var(--ax-font)!important}" +
    "html[data-a11y-align=left] body :is(p,li,dd,dt,td,th,blockquote,figcaption,label,h1,h2,h3,h4,h5,h6){text-align:start!important;text-align-last:auto!important;hyphens:manual!important}html[data-a11y-measure=on] body :is(p,blockquote,dd,figcaption){max-width:70ch!important}html[data-a11y-saturate=low]{filter:saturate(.4)}" +
    "html[data-a11y-links=underline] body a[href]{text-decoration-line:underline!important;text-decoration-thickness:max(1px,.08em)!important;text-underline-offset:.2em!important}" +
    "html[data-a11y-motion=reduce] *,html[data-a11y-motion=reduce] *::before,html[data-a11y-motion=reduce] *::after{animation-duration:1ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:1ms!important;transition-delay:0s!important;scroll-behavior:auto!important}" +
    "html[data-a11y-highlight=on] body :is(h1,h2,h3,h4,h5,h6){outline:2px dashed var(--ax-primary)!important;outline-offset:4px!important;border-radius:4px}" +
    "html[data-a11y-highlight=on] body a[href]{background-color:color-mix(in srgb,var(--ax-primary) 14%,transparent)!important;box-shadow:inset 0 -2px 0 var(--ax-primary)!important;border-radius:3px}" +
    "html[data-a11y-targets=large] body :is(button,select,summary,[role=button],[role=switch],[role=tab],[role=menuitem],[role=option],input:not([type=range],[type=hidden],[type=checkbox],[type=radio])){min-height:44px!important;min-width:44px!important}" +
    "html[data-a11y-focus=strong] :focus-visible{outline:3px solid #FFFFFF!important;outline-offset:2px!important;box-shadow:0 0 0 7px #111111!important}html[data-a11y-cursor=large]{--ax-hand:" + CUR(ARROW.replace("#FILL", "#1D4ED8"), 10, 5, "pointer") + "}" +
    "html[data-a11y-cursor=large],html[data-a11y-cursor=large] *{cursor:" + CUR(ARROW.replace("#FILL", "#111111"), 10, 5, "auto") + "!important}" +
    "html[data-a11y-cursor=large] :is(a[href],button,label,select,summary,[role=button],[role=switch],[role=tab]),html[data-a11y-cursor=large] :is(a[href],button,label,summary,[role=button]) *{cursor:var(--ax-hand)!important}" +
    "html[data-a11y-cursor=large] :is(textarea,[contenteditable=true],input:not([type=range],[type=checkbox],[type=radio],[type=button],[type=submit])){cursor:" + CUR(BEAM, 24, 24, "text") + "!important}img[data-a11y-frozen]{display:none!important}" +
    "@media (forced-colors:active){html[data-a11y-focus=strong] :focus-visible{outline-color:Highlight!important;box-shadow:none!important}}";

  function hostCss(fontBase) {
    var faces = "";
    [["400", "normal"], ["700", "normal"], ["400", "italic"]].forEach(function (f) {
      [["latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212"], ["latin-ext", "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2C60-2C7F,U+A720-A7FF"]].forEach(function (s) {
        faces += "@font-face{font-family:\"Atkinson Hyperlegible\";font-style:" + f[1] + ";font-weight:" + f[0] + ";font-display:swap;src:url(\"" + fontBase + "atkinson-hyperlegible-" + s[0] + "-" + f[0] + "-" + f[1] + ".woff2\") format(\"woff2\");unicode-range:" + s[1] + "}";
      });
    });
    var scale = "";
    for (var v = 110; v <= 200; v += 10) scale += "html[data-a11y-text='" + v + "']{--ax-scale:" + v / 100 + "}";
    LEADING.slice(1).forEach(function (l) { scale += "html[data-a11y-leading='" + l + "']{--ax-leading:" + l + "}"; });
    return faces + TOKENS + scale + EFFECTS + "ds-a11y{display:block}ds-a11y[placement=inline]{display:inline-block}";
  }

  function injectHostCss(fontBase) {
    if (document.getElementById("ds-a11y-css")) return;
    var s = document.createElement("style");
    s.id = "ds-a11y-css";
    s.textContent = hostCss(fontBase);
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ CSS of the panel (shadow DOM) */
  var FOCUS = "outline:3px solid var(--ax-focus);outline-offset:2px";
  var STRONG = "outline:3px solid #FFFFFF;outline-offset:2px;box-shadow:0 0 0 7px #111111";
  var SHADOW_CSS =
    ":host{display:block;font-family:var(--ax-font);color:var(--ax-text);font-size:1rem;line-height:1.5}*,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}svg{width:1.25rem;height:1.25rem;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}" +
    "button{font:inherit;color:inherit;cursor:var(--ax-hand,pointer);-webkit-tap-highlight-color:transparent}:focus-visible{" + FOCUS + "}.vh{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}" +
    ".fab{position:fixed;z-index:2147483000;left:calc(var(--ds-a11y-left,16px) + env(safe-area-inset-left,0px));bottom:calc(var(--ds-a11y-bottom,16px) + env(safe-area-inset-bottom,0px));display:inline-flex;align-items:center;min-width:3rem;min-height:3rem;padding:0 .6875rem;border-radius:999px;border:2px solid transparent;background:var(--ax-primary);color:var(--ax-on-primary);box-shadow:0 8px 24px rgb(0 0 0/.22);font-weight:700;font-size:.9375rem;line-height:1.2}" +
    ".fab:hover{box-shadow:0 10px 30px rgb(0 0 0/.32)}:host([placement=inline]) .fab{position:relative;left:auto;bottom:auto;box-shadow:none}:host([demo]) .fab{position:relative;left:auto;bottom:auto}" +
    ".fab svg{width:1.5rem;height:1.5rem;stroke-width:1.8}.fab-l,.fab-k{display:inline-block;max-width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:max-width .26s cubic-bezier(.16,1,.3,1),opacity .18s,margin .26s}" +
    ".fab:hover .fab-l,.fab:focus-visible .fab-l,.fab[aria-expanded=true] .fab-l,:host([demo-state=focus]) .fab-l{max-width:14em;opacity:1;margin-left:.5rem}.fab:focus-visible .fab-k,:host([demo-state=focus]) .fab-k{max-width:6em;opacity:1;margin:0 .125rem 0 .5rem}" +
    ".fab-k{font:700 .6875rem/1 ui-monospace,Consolas,monospace;padding:.25rem 0;border-radius:.375rem;background:rgb(255 255 255/.18)}.fab:focus-visible .fab-k,:host([demo-state=focus]) .fab-k{padding:.25rem .375rem}:host([demo-state=focus]) .fab{" + FOCUS + "}" +
    ".fab-n{position:absolute;top:-.375rem;right:-.375rem;min-width:1.375rem;height:1.375rem;padding:0 .3125rem;border-radius:999px;background:var(--ax-bg);color:var(--ax-primary);border:2px solid var(--ax-primary);font-size:.6875rem;line-height:1.125rem;text-align:center}" +
    ".sheet{position:fixed;z-index:2147483001;top:.75rem;bottom:.75rem;left:.75rem;width:min(28rem,calc(100vw - 1.5rem));display:flex;flex-direction:column;background:var(--ax-bg);color:var(--ax-text);border:1px solid var(--ax-border);border-radius:1.5rem;box-shadow:0 24px 64px rgb(0 0 0/.24),0 2px 6px rgb(0 0 0/.1);overflow:hidden;animation:ax-in .28s cubic-bezier(.16,1,.3,1)}" +
    "@keyframes ax-in{from{opacity:0;transform:translateX(-14px)}}@keyframes ax-in-r{from{opacity:0;transform:translateX(14px)}}@media (max-width:560px){.sheet{inset:0;width:auto;border:0;border-radius:0}}" +
    ":host([position=right]) .fab{left:auto;right:calc(var(--ds-a11y-right,16px) + env(safe-area-inset-right,0px))}@media (min-width:561px){:host([position=right]) .sheet{left:auto;right:.75rem;animation-name:ax-in-r}}:host([demo]) .sheet{position:relative;inset:auto;z-index:auto;width:100%;height:100%;animation:none;box-shadow:none}" +
    ".hd{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.125rem .875rem;align-items:center;padding:1.125rem 1rem 1rem 1.25rem;border-bottom:1px solid var(--ax-border);background:linear-gradient(160deg,var(--ax-surface),var(--ax-bg) 75%)}" +
    ".hd-ic{grid-row:span 2;display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:50%;background:var(--ax-primary);color:var(--ax-on-primary)}.hd-ic svg{width:1.5rem;height:1.5rem}" +
    ".hd h2{min-width:0;margin:0;font-size:1.375rem;font-weight:700;line-height:1.2;overflow-wrap:anywhere;hyphens:auto}.count{grid-column:2;font-size:.8125rem;color:var(--ax-muted)}" +
    ".x{grid-row:1/span 2;grid-column:3;display:grid;place-items:center;width:2.75rem;height:2.75rem;padding:0;border-radius:50%;border:2px solid transparent;background:transparent}.x:hover{background:var(--ax-surface)}" +
    ".body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 1.25rem 1rem}.intro{margin:1rem 0 0;font-size:.875rem;color:var(--ax-muted)}" +
    ".grp{padding:1.25rem 0;border-bottom:1px solid var(--ax-border)}.grp:last-of-type{border:0}.grp h3{margin:0 0 .5rem;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ax-muted)}" +
    ".profiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,11.5rem),1fr));gap:.625rem;margin-top:.75rem}" +
    ".prof{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:.125rem .625rem;align-items:start;align-content:start;text-align:start;padding:.75rem;border-radius:1rem;border:2px solid var(--ax-border);background:var(--ax-bg)}.prof:hover{border-color:var(--ax-control)}" +
    ".pi{grid-row:span 2;display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:.75rem;background:var(--ax-surface);color:var(--ax-primary)}.prof b{font-size:.9375rem;font-weight:700}.prof small{font-size:.75rem;color:var(--ax-muted)}" +
    ".prof[aria-pressed=true]{border-color:var(--ax-primary);background:var(--ax-surface)}.prof[aria-pressed=true] .pi{background:var(--ax-primary);color:var(--ax-on-primary)}" +
    ".ck{position:absolute;top:.5rem;right:.5rem;width:1.125rem;height:1.125rem;stroke-width:2.6;color:var(--ax-primary);opacity:0}.prof[aria-pressed=true] .ck{opacity:1}.pv{margin:1rem 0 0;padding:1rem 1.125rem;border-radius:1rem;background:var(--ax-surface);border:1px solid var(--ax-border);display:grid;gap:.625rem}" +
    ".pv figcaption{font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ax-muted)}.pv p{margin:0}.lk{color:var(--ax-primary);font-weight:700}:host([data-links]) .lk{text-decoration:underline;text-underline-offset:.2em}" +
    ".chips{display:flex;flex-wrap:wrap;gap:.375rem}.chip{display:inline-flex;align-items:center;gap:.375rem;padding:.125rem .625rem;border-radius:999px;font-size:.75rem;font-weight:700;background:var(--ax-bg);border:1px solid var(--ax-border)}.chip i{width:.5rem;height:.5rem;border-radius:50%;background:currentColor}" +
    ".bars{display:flex;align-items:flex-end;gap:.375rem;height:2.25rem}.bars i{flex:1;border-radius:.25rem .25rem 0 0}" +
    ".opt{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.125rem 1rem;align-items:center;padding:.625rem 0}.ol{font-weight:700;font-size:.9375rem}.oh{grid-column:1;margin:0;font-size:.8125rem;color:var(--ax-muted)}.sys{color:var(--ax-primary);font-weight:700}" +
    ".sw{grid-row:1/span 2;grid-column:2;position:relative;width:3.25rem;height:2rem;padding:0;border-radius:999px;border:2px solid var(--ax-control);background:var(--ax-bg)}" +
    ".sw::after{content:'';position:absolute;top:.1875rem;left:.1875rem;width:1.375rem;height:1.375rem;border-radius:50%;background:var(--ax-control);transition:transform .22s cubic-bezier(.16,1,.3,1)}" +
    ".sw svg{position:absolute;top:.3125rem;left:1.5625rem;width:1.125rem;height:1.125rem;stroke-width:2.6;color:var(--ax-primary);opacity:0;z-index:1}.sw[aria-checked=true] svg{opacity:1}" +
    ".sw[aria-checked=true]{background:var(--ax-primary);border-color:var(--ax-primary)}.sw[aria-checked=true]::after{transform:translateX(1.25rem);background:var(--ax-on-primary)}.sw:disabled,.step:disabled,.pill:disabled{opacity:.45;cursor:not-allowed}" +
    ".out{justify-self:end;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ax-primary)}.rg{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.625rem;align-items:center;margin-top:.25rem}" +
    ".step{display:grid;place-items:center;width:2.25rem;height:2.25rem;padding:0;border-radius:50%;border:2px solid var(--ax-control);background:var(--ax-bg)}input[type=range]{width:100%;min-width:0;height:2rem;margin:0;accent-color:var(--ax-primary);cursor:var(--ax-hand,pointer)}" +
    "fieldset.opt{display:block;border:0;margin:0;min-width:0}legend{float:left;width:100%;padding:0;margin-bottom:.125rem}fieldset .oh{clear:both;margin-bottom:.5rem}.seg{clear:both;display:flex;flex-wrap:wrap;gap:.25rem;padding:.25rem;border-radius:1.25rem;border:2px solid var(--ax-control)}" +
    ".seg label{position:relative;flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;min-height:2.25rem;padding:.25rem .875rem;border-radius:999px;font-size:.875rem;font-weight:700;color:var(--ax-muted);text-align:center;cursor:var(--ax-hand,pointer)}" +
    ".seg input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit}.seg label:has(:checked){background:var(--ax-primary);color:var(--ax-on-primary)}.seg label:has(:focus-visible){" + FOCUS + "}.seg label:has(:disabled){opacity:.45}" +
    ".note{margin:.5rem 0 0;padding:.625rem .875rem;border-radius:.75rem;background:var(--ax-surface);font-size:.8125rem}" +
    ".sp{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem}.pill{display:inline-flex;align-items:center;gap:.375rem;min-height:2.5rem;padding:0 1rem;border-radius:999px;border:2px solid var(--ax-control);background:var(--ax-bg);font-weight:700;font-size:.875rem}" +
    ".pill.pri{background:var(--ax-primary);border-color:var(--ax-primary);color:var(--ax-on-primary)}.pill svg{width:1.125rem;height:1.125rem}.sps{grid-column:1/-1;margin:.375rem 0 0;font-size:.8125rem;color:var(--ax-muted)}" +
    ".sps[data-s=playing]::before{content:'';display:inline-block;width:.5rem;height:.5rem;margin-right:.375rem;border-radius:50%;background:var(--color-success,#166534);animation:ax-pulse 1.2s ease-in-out infinite}@keyframes ax-pulse{50%{opacity:.3}}" +
    "details{margin-top:1rem;border:1px solid var(--ax-border);border-radius:1rem;padding:0 1rem}summary{min-height:2.75rem;display:flex;align-items:center;gap:.5rem;font-weight:700;cursor:var(--ax-hand,pointer);list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:'';width:.5rem;height:.5rem;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(-45deg);transition:transform .2s}details[open] summary::before{transform:rotate(45deg)}" +
    "dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.5rem 1rem;margin:0 0 1rem;font-size:.875rem}dt{white-space:nowrap}dd{margin:0;color:var(--ax-muted)}" +
    "kbd{display:inline-block;font:700 .75rem/1 ui-monospace,Consolas,monospace;padding:.25rem .4375rem;margin-right:.1875rem;border:1px solid var(--ax-control);border-bottom-width:2px;border-radius:.375rem;background:var(--ax-bg);color:var(--ax-text)}.principle{margin:1rem 0 0;font-size:.75rem;color:var(--ax-muted)}" +
    ".ft{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;padding:.75rem 1.25rem calc(.75rem + env(safe-area-inset-bottom,0px));border-top:1px solid var(--ax-border);background:var(--ax-bg)}.ft p{flex:1 1 12rem;margin:0;font-size:.75rem;color:var(--ax-muted)}" +
    ".undo{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;flex:1 1 100%;padding:.5rem .75rem;border-radius:.75rem;background:var(--ax-surface);font-size:.8125rem;font-weight:700}.undo .pill{min-height:2.25rem;margin-left:auto}" +
    ".guide,.mask{position:fixed;left:0;right:0;z-index:2147482999;pointer-events:none;top:50vh}.guide{height:2.4em;margin-top:-1.2em;background:color-mix(in srgb,var(--ax-primary) 13%,transparent);border-block:2px solid var(--ax-primary)}" +
    ".mask{height:5.5em;margin-top:-2.75em;box-shadow:0 0 0 100vmax var(--ax-shade);border-block:2px solid var(--ax-primary)}:host([data-targets]) :is(.x,.pill,.prof,summary,.seg label){min-height:2.75rem}:host([data-targets]) .step{width:2.75rem;height:2.75rem}" +
    ":host([data-focus]) :focus-visible,:host([data-focus]) .seg label:has(:focus-visible){" + STRONG + "}:host([data-motion]) *{animation:none!important;transition:none!important}@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}" +
    "@media (max-width:560px){.hd-ic{display:none}.hd{grid-template-columns:minmax(0,1fr) auto}.count{grid-column:1}.x{grid-column:2}}@media (max-width:560px),(max-height:560px){.sheet{overflow:auto}.body{flex:none;overflow:visible}.hd{position:sticky;top:0;z-index:1;background:var(--ax-bg)}}" +
    "@media (forced-colors:active){.sw,.sw::after,.seg label:has(:checked){forced-color-adjust:none}.sw{background:Canvas;border-color:ButtonText}.sw::after{background:ButtonText}.sw[aria-checked=true]{background:Highlight;border-color:Highlight}" +
    ".sw[aria-checked=true]::after{background:HighlightText}.sw svg{color:Highlight}.seg label:has(:checked){background:Highlight;color:HighlightText}.prof[aria-pressed=true]{border-color:Highlight;outline:2px solid Highlight}.guide,.mask{border-color:Highlight}.fab{border-color:ButtonText}}";

  /* ------------------------------------------------------------------ helpers */
  var SCRIPT_BASE = document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/[^/]*$/, "") + "fonts/" : "fonts/";
  var IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  var instances = [];

  function langOf() {
    var h = document.documentElement;
    return (h.getAttribute("data-lang") || h.lang || "en").slice(0, 2).toLowerCase();
  }
  function t(key, lang) { var row = S[key], i = LANGS.indexOf(lang || langOf()); return row ? row[i >= 0 ? i : 2] : key; }
  /** A language's own name ("Français", "Español"), for the language switch. */
  function langName(l) { try { var n = new Intl.DisplayNames([l], { type: "language" }).of(l); return n.charAt(0).toUpperCase() + n.slice(1); } catch (e) { return l.toUpperCase(); } }
  function colon(lang) { return lang === "fr" ? " : " : ": "; }
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function icon(name, cls) { return "<svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'" + (cls ? " class='" + cls + "'" : "") + ">" + ICONS[name] + "</svg>"; }
  function editable(el) { return !!(el && el.closest && el.closest("input,textarea,select,[contenteditable=''],[contenteditable=true]")); }

  function valid(k, v) {
    if (ENUMS[k]) return ENUMS[k].indexOf(v) >= 0;
    if (RANGES[k]) { var r = RANGES[k]; return typeof v === "number" && v >= r[0] && v <= r[1] && (v - r[0]) % r[2] === 0; }
    if (k in SYSTEM) return v === null || typeof v === "boolean";
    return typeof v === "boolean";
  }
  /** Untrusted input (storage, a host's profile, an attribute) → a frozen, complete preferences object. */
  function normalize(input) {
    var src = input && typeof input === "object" ? input : {}, out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = valid(k, src[k]) ? src[k] : DEFAULTS[k]; });
    return Object.freeze(out);
  }
  function merge(prefs, patch) { return normalize(Object.assign({}, prefs, patch)); }
  function parse(json) {
    try { return JSON.parse(json || "null"); } catch (err) { console.warn("ds-a11y: ignoring invalid preferences", err); return null; }
  }

  /** The value a person sees: system-driven keys fall back to the media query until they choose. */
  function shown(p, k) {
    if (!(k in SYSTEM)) return p[k];
    if (k === "contrast" && mq("(forced-colors: active)")) return false;
    return p[k] === null ? mq(SYSTEM[k]) : p[k];
  }
  function attrsFor(p) {
    var forced = mq("(forced-colors: active)"), motion = shown(p, "motion");
    return {
      text: p.text !== 100 ? String(p.text) : null, leading: p.leading ? String(LEADING[p.leading]) : null, spacing: p.spacing ? String(p.spacing) : null,
      font: p.font ? "readable" : null, align: p.align ? "left" : null, measure: p.measure ? "on" : null, theme: p.theme !== "system" ? p.theme : null,
      contrast: shown(p, "contrast") ? "more" : null, cvd: !forced && p.cvd !== "none" ? p.cvd : null, saturate: !forced && p.saturate ? "low" : null,
      links: p.links ? "underline" : null, motion: motion ? "reduce" : null, media: p.media ? "paused" : null, autoplay: p.autoplay ? "off" : null,
      focus: p.focus ? "strong" : null, guide: p.guide !== "off" ? p.guide : null, cursor: p.cursor ? "large" : null,
      highlight: p.highlight ? "on" : null, targets: p.targets ? "large" : null,
    };
  }
  function writeHtml(map) {
    var html = document.documentElement;
    Object.keys(map).forEach(function (k) {
      var name = "data-a11y-" + k;
      if (map[k] == null) html.removeAttribute(name);
      else if (html.getAttribute(name) !== map[k]) html.setAttribute(name, map[k]);
    });
  }
  /** Identifies a control across re-renders (language change) so focus can come back to it. */
  function controlKey(el) {
    if (!el || !el.getAttribute) return "";
    return [el.tagName, el.getAttribute("data-act"), el.getAttribute("data-k"), el.getAttribute("data-p"), el.type === "radio" ? el.value : ""].join("|");
  }
  /* theme="none": the page owns light/dark (its own toggle), so its theme is not counted as a panel setting */
  function activeCount(p, pageTheme) { return Object.keys(DEFAULTS).filter(function (k) { return p[k] !== DEFAULTS[k] && !(pageTheme && k === "theme"); }).length; }
  function profileOn(p, prof) { return Object.keys(prof.set).every(function (k) { return shown(p, k) === prof.set[k]; }); }

  /* ------------------------------------------------------------------ page side effects (motion, media) */
  function agentMotion(a, on) {
    var was = a.getAttribute("data-a11y-was");
    if (on && was === null) { a.setAttribute("data-a11y-was", a.getAttribute("motion") || ""); a.setAttribute("motion", "reduce"); return; }
    if (on || was === null) return;
    a.removeAttribute("data-a11y-was");
    if (was) a.setAttribute("motion", was); else a.removeAttribute("motion");
  }
  function motionHooks(root, on) {
    if (window.HL && typeof window.HL.setReducedMotion === "function") window.HL.setReducedMotion(on || mq(SYSTEM.motion));
    root.querySelectorAll("[data-motion-host]").forEach(function (a) { agentMotion(a, on); });
  }
  function freezeGif(img) {
    if (img.hasAttribute("data-a11y-frozen") || !/\.gif($|[?#])/i.test(img.currentSrc || img.src) || !img.complete || !img.naturalWidth) return;
    var c = document.createElement("canvas"), r = img.getBoundingClientRect();
    Object.assign(c, { width: img.naturalWidth, height: img.naturalHeight, className: img.className });
    c.getContext("2d").drawImage(img, 0, 0);
    c.style.cssText = "width:" + r.width + "px;height:" + r.height + "px";
    [["data-a11y-still", ""], ["role", "img"], ["aria-label", img.alt || ""]].forEach(function (a) { c.setAttribute(a[0], a[1]); });
    img.setAttribute("data-a11y-frozen", "");
    img.after(c);
  }
  function freezeMedia(root, p) {
    root.querySelectorAll("video,audio").forEach(function (m) {
      if (m.autoplay && (p.autoplay || p.media)) { m.setAttribute("data-a11y-autoplay", ""); m.autoplay = false; m.pause(); }
      if (p.media && !m.paused) m.pause();
    });
    if (p.media) root.querySelectorAll("img").forEach(freezeGif);
  }
  function thawMedia(p) {
    if (!p.media) {
      document.querySelectorAll("canvas[data-a11y-still]").forEach(function (c) { c.remove(); });
      document.querySelectorAll("img[data-a11y-frozen]").forEach(function (i) { i.removeAttribute("data-a11y-frozen"); });
    }
    if (!p.autoplay && !p.media) document.querySelectorAll("[data-a11y-autoplay]").forEach(function (m) { m.removeAttribute("data-a11y-autoplay"); m.autoplay = true; });
  }

  /* ------------------------------------------------------------------ markup */
  function profileHtml(p, lang) {
    return "<button type='button' class='prof' data-act='profile' data-p='" + p.id + "' aria-pressed='false'><span class='pi'>" + icon(p.icon) + "</span>" +
      "<b>" + esc(t("p_" + p.id, lang)) + "</b><small>" + esc(t("d_" + p.id, lang)) + "</small>" + icon("tick", "ck") + "</button>";
  }
  function previewHtml(lang) {
    var bars = [62, 88, 46, 74, 96, 54].map(function (h, i) { return "<i style='height:" + h + "%;background:var(--chart-" + (i + 1) + ",var(--ax-primary))'></i>"; }).join("");
    var chip = function (k, c, f) { return "<span class='chip' style='color:var(--color-" + c + "," + f + ")'><i></i>" + esc(t(k, lang)) + "</span>"; };
    return "<figure class='pv'><figcaption>" + esc(t("preview", lang)) + "</figcaption><p>" + esc(t("pv_text", lang)) + " <span class='lk'>" + esc(t("pv_link", lang)) + "</span></p>" +
      "<div class='chips'>" + chip("pv_ok", "success", "#166534") + chip("pv_warn", "warning", "#92400E") + chip("pv_bad", "danger", "#BE123C") + "</div><div class='bars' aria-hidden='true'>" + bars + "</div></figure>";
  }
  function hint(k, lang) { return S["h_" + k] ? esc(t("h_" + k, lang)) : ""; }
  function switchHtml(k, lang) {
    return "<div class='opt'><span class='ol' id='l-" + k + "'>" + esc(t("o_" + k, lang)) + "</span><p class='oh' id='h-" + k + "'>" + hint(k, lang) +
      (k in SYSTEM ? " <span class='sys' data-sys='" + k + "' hidden>" + esc(t("sys", lang)) + "</span>" : "") + "</p>" +
      "<button type='button' class='sw' role='switch' aria-checked='false' data-act='switch' data-k='" + k + "' aria-labelledby='l-" + k + "' aria-describedby='h-" + k + "'>" + icon("tick") + "</button></div>";
  }
  function rangeHtml(k, lang) {
    var r = RANGES[k], name = esc(t("o_" + k, lang)), step = function (d, ic, word) {
      return "<button type='button' class='step' data-act='step' data-k='" + k + "' data-d='" + d + "' aria-label='" + esc(t(word, lang)) + " · " + name + "'>" + icon(ic) + "</button>";
    };
    return "<div class='opt'><label class='ol' for='r-" + k + "'>" + name + "</label><span class='out' data-out='" + k + "' aria-hidden='true'></span><div class='rg'>" + step(-1, "minus", "less") +
      "<input type='range' id='r-" + k + "' data-k='" + k + "' min='" + r[0] + "' max='" + r[1] + "' step='" + r[2] + "'>" + step(1, "plus", "more") + "</div></div>";
  }
  function radioHtml(k, lang) {
    var vals = k === "lang" ? PAGE_LANGS : ENUMS[k];
    return "<fieldset class='opt'" + (S["h_" + k] ? " aria-describedby='h-" + k + "'" : "") + "><legend class='ol'>" + esc(t("o_" + k, lang)) + "</legend>" +
      (S["h_" + k] ? "<p class='oh' id='h-" + k + "'>" + hint(k, lang) + "</p>" : "") + "<div class='seg'>" + vals.map(function (v) {
        return "<label" + (k === "lang" ? " lang='" + v + "'" : "") + "><input type='radio' name='" + k + "' value='" + v + "' data-k='" + k + "'><span>" + esc(k === "lang" ? langName(v) : t("v_" + v, lang)) + "</span></label>";
      }).join("") + "</div></fieldset>";
  }
  function speechHtml(lang) {
    var b = function (act, ic, key, cls) { return "<button type='button' class='pill" + (cls || "") + "' data-act='" + act + "'>" + icon(ic) + "<span>" + esc(t(key, lang)) + "</span></button>"; };
    return "<div class='opt'><span class='ol' id='l-speech'>" + esc(t("o_speech", lang)) + "</span><p class='oh'>" + esc(t("h_speech", lang)) + "</p>" +
      "<div class='sp' role='group' aria-labelledby='l-speech'>" + b("speak", "play", "sp_read", " pri") + b("pause", "pauseb", "sp_pause") + b("stop", "stop", "sp_stop") + "</div><p class='sps' data-s='idle'></p></div>";
  }
  function keysHtml(lang) {
    var k = function (list) { return list.map(function (x) { return "<kbd>" + esc(x) + "</kbd>"; }).join(""); };
    var rows = [[["Alt", "A"], "k_toggle"], [["?"], "k_help"], [[t("key_esc", lang)], "k_esc"], [["Tab"], "k_tab"], [["←", "→"], "k_arrows"], [[t("key_space", lang)], "k_space"]];
    return "<details><summary>" + esc(t("keys", lang)) + "</summary><dl>" + rows.map(function (r) { return "<dt>" + k(r[0]) + "</dt><dd>" + esc(t(r[1], lang)) + "</dd>"; }).join("") + "</dl>" + switchHtml("keys", lang) + "</details>";
  }
  var CONTROL = { range: rangeHtml, "switch": switchHtml, radio: radioHtml, speech: function (k, lang) { return speechHtml(lang); } };
  function groupHtml(g, lang) {
    var extra = g[0] === "colour" ? "<p class='note' data-forced hidden>" + esc(t("forced", lang)) + "</p>" : "";
    return "<section class='grp' data-g='" + g[0] + "' aria-labelledby='g-" + g[0] + "'><h3 id='g-" + g[0] + "'>" + esc(t("g_" + g[0], lang)) + "</h3>" + extra +
      g[1].map(function (o) { return CONTROL[o[1]](o[0], lang); }).join("") + (g[0] === "reading" ? keysHtml(lang) : "") + "</section>";
  }
  function sheetHtml(lang, storage) {
    return "<header class='hd'><span class='hd-ic'>" + icon("access") + "</span><h2 id='t' tabindex='-1'>" + esc(t("title", lang)) + "</h2><span class='count' data-count></span>" +
      "<button type='button' class='x' data-act='close' aria-label='" + esc(t("close", lang)) + "'>" + icon("close") + "</button></header>" +
      "<div class='body'><p class='intro'>" + esc(t("intro", lang)) + "</p><section class='grp' data-g='profiles' aria-labelledby='g-profiles'><h3 id='g-profiles'>" + esc(t("g_profiles", lang)) + "</h3>" +
      "<p class='oh'>" + esc(t("h_profiles", lang)) + "</p><div class='profiles'>" + PROFILES.map(function (p) { return profileHtml(p, lang); }).join("") + "</div>" + previewHtml(lang) + "</section>" +
      GROUPS.map(function (g) { return groupHtml(g, lang); }).join("") + "<p class='principle'>" + esc(t("principle", lang)) + "</p></div>" +
      "<footer class='ft'><div class='undo' data-undo hidden><span>" + esc(t("was_reset", lang)) + "</span><button type='button' class='pill' data-act='undo'>" + icon("reset") + "<span>" + esc(t("undo", lang)) + "</span></button></div>" +
      "<button type='button' class='pill' data-act='reset'>" + icon("reset") + "<span>" + esc(t("reset", lang)) + "</span></button><p>" + esc(t(storage === "local" ? "saved_local" : "saved_none", lang)) + "</p></footer>";
  }
  function valueText(k, v, lang) {
    if (k === "text") return lang === "fr" ? v + " %" : v + "%";
    if (k === "spacing") return t(["v_normal", "v_airy", "v_airier"][v], lang);
    return v ? new Intl.NumberFormat(LOCALES[lang] || lang).format(LEADING[v]) : t("v_normal", lang);
  }

  /* ------------------------------------------------------------------ element */
  class DSA11y extends HTMLElement {
    connectedCallback() {
      if (this.root) return;
      this.demo = this.hasAttribute("demo");
      this.storage = this.demo ? "none" : this.getAttribute("storage") || "local";
      injectHostCss(this.getAttribute("font-base") || SCRIPT_BASE);
      var early = Object.prototype.hasOwnProperty.call(this, "prefs") ? this.prefs : undefined;
      if (early !== undefined) delete this.prefs; // set before the upgrade: move it onto the accessor
      this._prefs = normalize(this.demo ? parse(this.getAttribute("prefs")) : early !== undefined ? early : this.load());
      this.undoOpen = this.getAttribute("demo-state") === "reset";
      this.speech = !("speechSynthesis" in window) || this.getAttribute("demo-state") === "unsupported" ? "unsupported" : "idle";
      this.build();
      if (!this.demo) { instances.push(this); this.listen(); }
      this.apply(null, false);
      if (this.demo) this.sheet.hidden = false;
    }

    disconnectedCallback() {
      if (this.demo || !this.root) return;
      instances.splice(instances.indexOf(this), 1);
      (this.cleanups || []).splice(0).forEach(function (f) { f(); });
      this.root = null;
    }

    load() {
      try { return this.storage === "local" ? parse(localStorage.getItem(STORE)) : null; } catch (err) { return null; } // private mode: defaults
    }
    save() {
      if (this.storage !== "local") return;
      try {
        if (activeCount(this.prefs)) localStorage.setItem(STORE, JSON.stringify(this.prefs)); else localStorage.removeItem(STORE);
      } catch (err) { console.warn("ds-a11y: preferences not saved (storage unavailable)", err); }
    }

    build() {
      var fresh = !this.shadowRoot, root = this.shadowRoot || this.attachShadow({ mode: "open" }), place = this.getAttribute("placement") || "fixed";
      var fab = place === "none" ? "" : "<button type='button' class='fab' data-act='toggle' aria-expanded='false' aria-controls='panel' aria-keyshortcuts='Alt+A' aria-describedby='fab-d'>" + icon("access") +
        "<span class='fab-l'></span><kbd class='fab-k' aria-hidden='true'>Alt A</kbd><span class='fab-n' aria-hidden='true' hidden></span></button><span class='vh' id='fab-d'></span>";
      var sheet = this.demo && place !== "none" ? "" : "<div class='sheet' id='panel' role='dialog' aria-modal='false' aria-labelledby='t' hidden></div>";
      root.innerHTML = "<style>" + SHADOW_CSS + "</style>" + fab + sheet + "<p class='vh' role='status' data-live></p><div class='guide' hidden></div><div class='mask' hidden></div>";
      this.root = root;
      this.fab = root.querySelector(".fab");
      this.sheet = root.querySelector(".sheet") || document.createElement("div");
      if (fresh) {
        root.addEventListener("click", this.onClick.bind(this));
        root.addEventListener("input", this.onInput.bind(this));
        root.addEventListener("change", this.onInput.bind(this));
        root.addEventListener("keydown", this.onKey.bind(this));
      }
      this.render();
    }

    q(sel) { return this.root.querySelector(sel); }
    qa(sel) { return this.root.querySelectorAll(sel); }

    render() {
      var lang = langOf(), had = this.root.activeElement, key = had && had.id === "t" ? "t" : controlKey(had);
      this.lang = lang;
      if (this.fab) this.fab.querySelector(".fab-l").textContent = t("title", lang);
      this.sheet.innerHTML = sheetHtml(lang, this.storage);
      this.heading = this.q("#t");
      if (this.q("[data-undo]")) this.q("[data-undo]").hidden = !this.undoOpen;
      this.sync();
      if (!key) return;
      var again = key === "t" ? this.heading : Array.prototype.filter.call(this.qa("button,input,summary"), function (el) { return controlKey(el) === key; })[0];
      if (again) again.focus({ preventScroll: true });
    }

    /** Reflects the preferences in every control without rebuilding the markup. */
    sync() {
      var p = this.prefs, lang = this.lang, forced = mq("(forced-colors: active)");
      this.qa(".sw").forEach(function (b) { var k = b.getAttribute("data-k"); b.setAttribute("aria-checked", String(!!shown(p, k))); b.disabled = forced && COLOUR_KEYS.indexOf(k) >= 0; });
      this.qa("[data-sys]").forEach(function (s) { var k = s.getAttribute("data-sys"); s.hidden = !(p[k] === null && mq(SYSTEM[k])); });
      this.qa("input[type=range]").forEach(function (r) {
        var k = r.getAttribute("data-k"), text = valueText(k, p[k], lang);
        r.value = p[k];
        r.setAttribute("aria-valuetext", text);
        this.q("[data-out=" + k + "]").textContent = text;
        this.qa(".step[data-k=" + k + "]").forEach(function (s) { s.disabled = s.getAttribute("data-d") < 0 ? p[k] <= RANGES[k][0] : p[k] >= RANGES[k][1]; });
      }, this);
      this.qa("input[type=radio]").forEach(function (r) {
        var k = r.getAttribute("data-k");
        r.checked = (k === "lang" ? lang : p[k]) === r.value;
        r.disabled = forced && k === "cvd";
      });
      this.qa(".prof").forEach(function (b) { b.setAttribute("aria-pressed", String(profileOn(p, PROFILES.filter(function (x) { return x.id === b.getAttribute("data-p"); })[0]))); });
      var forcedNote = this.q("[data-forced]");
      if (forcedNote) forcedNote.hidden = !forced;
      this.syncCount();
      this.syncSpeech();
    }

    syncCount() {
      var n = activeCount(this.prefs, this.getAttribute("theme") === "none"), lang = this.lang, text = n ? n + " " + t(n > 1 ? "countN" : "count1", lang) : t("count0", lang);
      var c = this.q("[data-count]");
      if (c) c.textContent = text;
      if (!this.fab) return;
      var badge = this.fab.querySelector(".fab-n");
      badge.hidden = !n;
      badge.textContent = n;
      this.q("#fab-d").textContent = n ? text : "";
    }

    syncSpeech() {
      var s = this.speech, st = this.q(".sps"), lang = this.lang;
      if (!st) return;
      st.setAttribute("data-s", s);
      st.textContent = t({ idle: "sp_idle", playing: "sp_playing", paused: "sp_paused", none: "sp_none", unsupported: "sp_unsupported" }[s], lang);
      this.q("[data-act=speak]").disabled = s === "unsupported";
      this.q("[data-act=pause]").disabled = this.q("[data-act=stop]").disabled = s !== "playing" && s !== "paused";
      this.q("[data-act=pause] span").textContent = t(s === "paused" ? "sp_resume" : "sp_pause", lang);
    }

    /** Writes the preferences on the page (unless demo), on the host (for the panel's own CSS) and runs side effects. */
    apply(changed, forceTheme) {
      var p = this.prefs, map = attrsFor(p);
      ["targets", "focus", "motion", "links", "cursor"].forEach(function (k) { this.toggleAttribute("data-" + k, !!map[k]); }, this);
      if (this.demo) return;
      writeHtml(map);
      this.applyTheme(forceTheme || changed === "theme" || changed === "reset" || p.theme !== "system");
      motionHooks(document, !!map.motion);
      freezeMedia(document, p);
      thawMedia(p);
      this.watch(p.media || p.autoplay || !!map.motion);
      this.guide(p.guide);
    }

    applyTheme(force) {
      var mode = this.getAttribute("theme") || "data-theme", pref = this.prefs.theme, html = document.documentElement;
      if (mode === "none" || !force) return;
      var dark = pref === "dark" || (pref === "system" && mq("(prefers-color-scheme: dark)"));
      if (mode === "class") html.classList.toggle("dark", dark); else html.setAttribute("data-theme", dark ? "dark" : "light");
    }

    /** New nodes (lazy sections, SPA routes) get the same motion and media treatment. */
    watch(on) {
      if (!on) { if (this.observer) this.observer.disconnect(); this.observer = null; return; }
      if (this.observer) return;
      var self = this;
      this.observer = new MutationObserver(function (list) {
        var motion = !!attrsFor(self.prefs).motion;
        list.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches("[data-motion-host]")) agentMotion(n, motion);
            motionHooks(n, motion);
            freezeMedia(n, self.prefs);
          });
        });
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    }

    guide(mode) {
      var g = this.q(".guide"), m = this.q(".mask");
      g.hidden = mode !== "guide"; m.hidden = mode !== "mask";
      this.guideEl = mode === "guide" ? g : mode === "mask" ? m : null;
    }

    moveGuide(y) {
      if (!this.guideEl) return;
      var el = this.guideEl;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(function () { el.style.top = Math.round(y) + "px"; });
    }

    commit(prefs, changed, quiet) {
      this._prefs = prefs;
      this.apply(changed, false);
      this.sync();
      if (quiet) return;
      this.save();
      this.emit("change", { prefs: prefs, changed: changed });
    }

    set(patch, opts) { this.commit(merge(this.prefs, patch), Object.keys(patch || {})[0] || null, opts && opts.quiet); }

    announce(text) {
      var live = this.q("[data-live]");
      clearTimeout(this.liveTimer);
      live.textContent = "";
      this.liveTimer = setTimeout(function () { live.textContent = text; }, 60);
    }

    emit(name, detail, cancelable) {
      var ev = new CustomEvent("ds-a11y:" + name, { bubbles: true, composed: true, cancelable: !!cancelable, detail: detail || {} });
      return this.dispatchEvent(ev);
    }

    onClick(e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      var act = b.getAttribute("data-act"), k = b.getAttribute("data-k"), lang = this.lang;
      if (act === "toggle") return this.isOpen ? this.close(true) : this.open(b);
      if (act === "close") return this.close(true);
      if (act === "profile") return this.toggleProfile(b.getAttribute("data-p"));
      if (act === "reset") return this.reset();
      if (act === "undo") return this.undo();
      if (act === "speak" || act === "pause" || act === "stop") return this[act + "Speech"]();
      if (act === "switch") {
        var on = !shown(this.prefs, k), patch = {};
        patch[k] = on;
        this.set(patch);
        this.announce(t("o_" + k, lang) + colon(lang) + t(on ? "on" : "off", lang));
      }
      if (act === "step") this.step(k, +b.getAttribute("data-d"));
    }

    step(k, dir) {
      var r = RANGES[k], v = Math.min(r[1], Math.max(r[0], this.prefs[k] + dir * r[2])), patch = {};
      patch[k] = v;
      this.set(patch);
      this.announce(t("o_" + k, this.lang) + colon(this.lang) + valueText(k, v, this.lang));
    }

    onInput(e) {
      var el = e.target, k = el.getAttribute("data-k"), lang = this.lang, patch = {};
      if (!k) return;
      if (el.type === "range") {
        if (e.type === "change") return;
        patch[k] = +el.value;
        this.set(patch);
        var self = this;
        clearTimeout(this.rangeTimer);
        this.rangeTimer = setTimeout(function () { self.announce(t("o_" + k, lang) + colon(lang) + valueText(k, +el.value, lang)); }, 300);
        return;
      }
      if (e.type !== "change" || !el.checked) return;
      if (k === "lang") return this.setLang(el.value);
      patch[k] = el.value;
      this.set(patch);
      this.announce(t("o_" + k, lang) + colon(lang) + t("v_" + el.value, lang));
    }

    setLang(lang) {
      if (!this.emit("lang", { lang: lang }, true)) return;
      if (window.DSLang && typeof window.DSLang.set === "function") { window.DSLang.set(lang); return; }
      var html = document.documentElement;
      html.setAttribute("data-lang", lang);
      html.lang = lang;
      document.dispatchEvent(new CustomEvent("ds:lang", { detail: { lang: lang } }));
    }

    toggleProfile(id) {
      var prof = PROFILES.filter(function (x) { return x.id === id; })[0], p = this.prefs, on = profileOn(p, prof), patch = {};
      if (!on) patch = prof.set;
      else Object.keys(prof.set).forEach(function (k) {
        var kept = PROFILES.some(function (o) { return o !== prof && profileOn(p, o) && k in o.set; });
        if (!kept) patch[k] = DEFAULTS[k];
      });
      this.commit(merge(p, patch), "profile:" + id, false);
      this.announce(t(on ? "profile_off" : "profile_on", this.lang) + colon(this.lang) + t("p_" + id, this.lang));
    }

    reset() {
      this.undoPrefs = this.prefs;
      this.commit(normalize({}), "reset", false);
      var self = this;
      this.undoOpen = true;
      this.q("[data-undo]").hidden = false;
      clearTimeout(this.undoTimer);
      this.undoTimer = setTimeout(function () { self.undoOpen = false; if (self.root) self.q("[data-undo]").hidden = true; }, 12000);
      this.announce(t("was_reset", this.lang));
    }

    undo() {
      if (!this.undoPrefs) return;
      this.commit(this.undoPrefs, "undo", false);
      this.undoPrefs = null;
      this.undoOpen = false;
      this.q("[data-undo]").hidden = true;
      this.q("[data-act=reset]").focus();
      this.announce(t("was_undone", this.lang));
    }

    /* ---------------------------------------------------------------- open / close */
    open(opener) {
      if (this.demo || this.isOpen) return;
      this.opener = opener && opener.focus ? opener : this.fab;
      this.isOpen = true;
      this.sheet.hidden = false;
      this.sheet.setAttribute("aria-modal", String(mq(NARROW)));
      this.expanded(true);
      this.heading.focus({ preventScroll: true });
      this.emit("open");
    }

    close(restore) {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.sheet.hidden = true;
      this.expanded(false);
      if (restore && this.opener && this.opener.isConnected) this.opener.focus();
      this.emit("close");
    }

    toggle(opener) { return this.isOpen ? this.close(true) : this.open(opener); }

    expanded(on) {
      if (this.fab) this.fab.setAttribute("aria-expanded", String(on));
      document.querySelectorAll("[data-a11y-open]").forEach(function (b) { b.setAttribute("aria-expanded", String(on)); });
    }

    showKeys() {
      this.open(document.activeElement);
      var d = this.q("details");
      d.open = true;
      d.querySelector("summary").focus();
      d.scrollIntoView({ block: "nearest" });
    }

    /** Esc closes; on phones the sheet covers the page, so Tab cycles inside it (aria-modal is true there). */
    onKey(e) {
      if (e.key === "Escape" && this.isOpen) { e.preventDefault(); e.stopPropagation(); this.close(true); return; }
      if (e.key !== "Tab" || !this.isOpen || !mq(NARROW)) return;
      var list = Array.prototype.filter.call(this.sheet.querySelectorAll("button:not(:disabled),input:not(:disabled),summary,[tabindex='-1']"), function (el) { return el.offsetParent !== null; });
      var first = list[0], last = list[list.length - 1], at = this.root.activeElement;
      if (e.shiftKey && (at === first || at === this.heading)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    }

    onDocKey(e) {
      var target = e.composedPath ? e.composedPath()[0] : e.target;
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyA") {
        if (IS_MAC && editable(target)) return;
        e.preventDefault();
        this.toggle(this.root.contains(target) ? this.fab : document.activeElement);
        return;
      }
      if (e.key === "Tab") this.byKey = true;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey && !editable(target) && this.prefs.keys && this.getAttribute("help-key") !== "off") {
        e.preventDefault();
        this.showKeys();
      }
    }

    /* ---------------------------------------------------------------- speech (browser's speechSynthesis only) */
    speakSpeech() {
      var sel = window.getSelection ? String(window.getSelection()).trim() : "", text = sel || this.lastSel || "", self = this;
      if (!text) { this.speech = "none"; this.syncSpeech(); this.announce(t("sp_none", this.lang)); return; }
      var u = new SpeechSynthesisUtterance(text.slice(0, 4000)), lang = document.documentElement.lang || this.lang;
      u.lang = lang.length > 2 ? lang : LOCALES[this.lang] || this.lang;
      var voice = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.slice(0, 2).toLowerCase() === u.lang.slice(0, 2).toLowerCase(); })[0];
      if (voice) u.voice = voice;
      u.onend = u.onerror = function () { if (self.utterance === u) { self.speech = "idle"; self.syncSpeech(); } };
      speechSynthesis.cancel();
      this.utterance = u;
      speechSynthesis.speak(u);
      this.speech = "playing";
      this.syncSpeech();
    }
    pauseSpeech() {
      if (this.speech === "playing") { speechSynthesis.pause(); this.speech = "paused"; } else { speechSynthesis.resume(); this.speech = "playing"; }
      this.syncSpeech();
      this.announce(t(this.speech === "paused" ? "sp_paused" : "sp_playing", this.lang));
    }
    stopSpeech() {
      this.utterance = null;
      speechSynthesis.cancel();
      this.speech = "idle"; this.syncSpeech();
    }

    /* ---------------------------------------------------------------- page listeners */
    listen() {
      var self = this, on = function (target, type, fn, opts) { target.addEventListener(type, fn, opts); self.cleanups.push(function () { target.removeEventListener(type, fn, opts); }); };
      this.cleanups = [];
      on(document, "keydown", this.onDocKey.bind(this));
      on(document, "ds:lang", function () { if (langOf() !== self.lang) self.render(); });
      on(document, "selectionchange", function () { var s = window.getSelection && String(window.getSelection()).trim(); if (s) self.lastSel = s; });
      on(document, "pointermove", function (e) { self.moveGuide(e.clientY); }, { passive: true });
      on(document, "pointerdown", function () { self.byKey = false; }, { passive: true });
      /* Tab out of the sheet closes it, so keyboard focus never sits hidden under it (2.4.11); the pointer may roam freely */
      on(document, "focusin", function (e) {
        if (e.target === self) return;
        if (self.isOpen && self.byKey && !mq(NARROW)) self.close(false);
        var r = e.target.getBoundingClientRect();
        self.moveGuide(r.top + r.height / 2);
      });
      on(document, "click", function (e) { var b = e.target.closest && e.target.closest("[data-a11y-open]"); if (b) { e.preventDefault(); self.toggle(b); } });
      ["(prefers-contrast: more)", "(prefers-reduced-motion: reduce)", "(prefers-color-scheme: dark)", "(forced-colors: active)"].forEach(function (q) {
        if (window.matchMedia) on(window.matchMedia(q), "change", function () { self.apply(null, false); self.sync(); });
      });
      var mo = new MutationObserver(function () { if (langOf() !== self.lang) self.render(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "data-lang"] });
      this.cleanups.push(function () { mo.disconnect(); if (self.observer) self.observer.disconnect(); });
    }
  }

  Object.defineProperty(DSA11y.prototype, "prefs", {
    get: function () { return this._prefs || DEFAULTS; },
    /* a host (e.g. the user's synced profile) sets this; it applies at once, is not saved locally and fires no event */
    set: function (v) { this._prefs = normalize(v); if (this.root) { this.apply(null, false); this.sync(); } },
  });
  window.customElements.define("ds-a11y", DSA11y);

  var main = function () { return instances[0] || null; };
  window.DSA11y = { reducedMotion: function () { return document.documentElement.getAttribute("data-a11y-motion") === "reduce" || mq(SYSTEM.motion); } };
  ["open", "close", "toggle", "reset", "set"].forEach(function (m) { window.DSA11y[m] = function (arg) { var el = main(); if (el) el[m](m === "close" || arg); }; });
  Object.defineProperty(window.DSA11y, "element", { get: main });
  Object.defineProperty(window.DSA11y, "prefs", { get: function () { return main() ? main().prefs : DEFAULTS; } });
})();
