const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const modeSelect = document.getElementById("mode");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
}

function detectLang(text) {
  return /[　-鿿豈-﫿]/.test(text) ? "ja" : "en";
}

swapBtn.addEventListener("click", () => {
  const mode = modeSelect.value;
  if (mode === "en2ja") modeSelect.value = "ja2en";
  else if (mode === "ja2en") modeSelect.value = "en2ja";
  else modeSelect.value = "auto";
});

translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) {
    setStatus("Type something first.");
    return;
  }

  let mode = modeSelect.value;
  if (mode === "auto") {
    mode = detectLang(text) === "ja" ? "ja2en" : "en2ja";
  }

  const [srcLang, tgtLang] = mode === "en2ja" ? ["en", "ja"] : ["ja", "en"];

  setStatus("Translating…");
  resultText.value = "";

  try {
    const params = new URLSearchParams({ q: text, langpair: `${srcLang}|${tgtLang}` });
    const res = await fetch(`${MYMEMORY_URL}?${params}`);
    const data = await res.json();

    if (data.responseStatus !== 200) {
      setStatus(data.responseDetails || "Translation failed.");
      return;
    }

    resultText.value = data.responseData.translatedText;
    setStatus("Done.");
  } catch (err) {
    setStatus("Network error.");
  }
});
