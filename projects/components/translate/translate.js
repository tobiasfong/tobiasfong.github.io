const WORKER_URL = "https://YOUR-WORKER.SUBDOMAIN.workers.dev/translate";

const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const modeSelect = document.getElementById("mode");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
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

  setStatus("Translating…");
  resultText.value = "";

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, mode: modeSelect.value })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || "Request failed.");
      return;
    }

    resultText.value = data.translation || "";
    setStatus("Done.");
  } catch (err) {
    setStatus("Network error. Check the Worker URL.");
  }
});
