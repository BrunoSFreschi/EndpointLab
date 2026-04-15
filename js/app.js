import { addField, createFormModel, generatePayload, removeField, updateField } from "./formBuilder.js";
import { executeRequest, runBatch } from "./request.js";
import { exportForm, importForm, loadLastForm, saveForm } from "./storage.js";
import { escapeHtml, formatMs, isValidUrl } from "./utils.js";
import { renderFieldRow } from "../components/field.js";
import { renderRequestFormShell } from "../components/requestForm.js";

class EndpointLabApp {
  constructor() {
    this.form = loadLastForm() ?? createFormModel();
    this.elements = {};
    this.mount();
  }

  mount() {
    const app = document.getElementById("app");
    app.innerHTML = this.renderAppShell();

    this.cacheElements();
    this.bindEvents();
    this.renderFromState();
  }

  renderAppShell() {
    return `
      <header class="app-header sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div class="app-header__brand">
            <h1 class="app-header__title text-xl font-bold tracking-tight text-slate-900">EndpointLab</h1>
            <p class="app-header__subtitle text-xs text-slate-500">Teste de APIs com fluxo rapido e legivel</p>
          </div>
          <div class="app-header__actions flex items-center gap-2">
            <button id="exportBtn" class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Exportar</button>
            <label class="app-header__import cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Importar
              <input id="importInput" type="file" accept="application/json" class="hidden" />
            </label>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-4 py-6">
        ${renderRequestFormShell()}
      </main>
    `;
  }

  cacheElements() {
    this.elements = {
      url: document.getElementById("url"),
      method: document.getElementById("method"),
      iterations: document.getElementById("iterations"),
      intervalMs: document.getElementById("intervalMs"),
      fields: document.getElementById("fields"),
      addField: document.getElementById("addField"),
      send: document.getElementById("send"),
      save: document.getElementById("save"),
      response: document.getElementById("response"),
      payloadPreview: document.getElementById("payloadPreview"),
      exportBtn: document.getElementById("exportBtn"),
      importInput: document.getElementById("importInput")
    };
  }

  bindEvents() {
    this.bindRequestEvents();
    this.bindFieldEvents();
    this.bindActionEvents();
  }

  bindRequestEvents() {
    this.elements.url.addEventListener("input", (event) => {
      this.form.request.url = event.target.value;
      this.renderPreview();
    });

    this.elements.method.addEventListener("change", (event) => {
      this.form.request.method = event.target.value;
      this.renderPreview();
    });

    this.elements.iterations.addEventListener("input", (event) => {
      this.form.settings.iterations = Math.max(1, Number(event.target.value || 1));
    });

    this.elements.intervalMs.addEventListener("input", (event) => {
      this.form.settings.intervalMs = Math.max(0, Number(event.target.value || 0));
    });
  }

  bindFieldEvents() {
    this.elements.addField.addEventListener("click", () => {
      addField(this.form);
      this.renderFields();
      this.renderPreview();
    });

    this.elements.fields.addEventListener("input", (event) => {
      const row = event.target.closest("[data-field-id]");
      if (!row) return;
      const fieldId = row.dataset.fieldId;

      if (event.target.dataset.role === "field-key") {
        updateField(this.form, fieldId, { key: event.target.value });
      }

      if (event.target.dataset.role === "field-value") {
        updateField(this.form, fieldId, { value: event.target.value });
      }

      if (event.target.dataset.role === "field-type") {
        updateField(this.form, fieldId, { type: event.target.value });
      }

      this.renderPreview();
    });

    this.elements.fields.addEventListener("click", (event) => {
      if (event.target.dataset.role !== "remove-field") return;
      const row = event.target.closest("[data-field-id]");
      if (!row) return;
      removeField(this.form, row.dataset.fieldId);
      this.renderFields();
      this.renderPreview();
    });
  }

  bindActionEvents() {
    this.elements.save.addEventListener("click", () => {
      this.saveCurrentForm();
    });

    this.elements.send.addEventListener("click", async () => {
      await this.handleSend();
    });

    this.elements.exportBtn.addEventListener("click", () => {
      this.exportCurrentForm();
    });

    this.elements.importInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await this.importFromFile(file);
    });
  }

  renderFromState() {
    this.elements.url.value = this.form.request.url;
    this.elements.method.value = this.form.request.method;
    this.elements.iterations.value = this.form.settings.iterations;
    this.elements.intervalMs.value = this.form.settings.intervalMs;
    this.renderFields();
    this.renderPreview();
  }

  renderFields() {
    this.elements.fields.innerHTML = "";
    if (this.form.fields.length === 0) {
      this.elements.fields.appendChild(this.renderEmptyFieldsState());
      return;
    }

    for (const field of this.form.fields) {
      this.elements.fields.appendChild(renderFieldRow(field));
    }
  }

  renderPreview() {
    const payload = generatePayload(this.form);
    this.elements.payloadPreview.textContent = JSON.stringify(payload, null, 2);
  }

  renderEmptyFieldsState() {
    const empty = document.createElement("p");
    empty.className = "rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500";
    empty.textContent = "Nenhum campo adicionado. Clique em + Campo para iniciar.";
    return empty;
  }

  validateBeforeSend() {
    if (!isValidUrl(this.form.request.url)) {
      throw new Error("Informe uma URL valida antes de enviar");
    }

    if (this.form.settings.iterations < 1) {
      throw new Error("Iteracoes deve ser no minimo 1");
    }
  }

  buildRequestConfig() {
    return {
      url: this.form.request.url,
      method: this.form.request.method,
      headers: this.form.request.headers,
      body: generatePayload(this.form),
      iterations: this.form.settings.iterations,
      intervalMs: this.form.settings.intervalMs
    };
  }

  async handleSend() {
    try {
      this.validateBeforeSend();
      this.setSendState(true);

      const config = this.buildRequestConfig();
      const results = config.iterations > 1 ? await runBatch(config) : [await executeRequest(config)];

      this.renderResponse(results);
      this.saveCurrentForm(false);
    } catch (error) {
      this.setResponseContent(JSON.stringify({ error: error.message }, null, 2));
      this.toast(error.message, true);
    } finally {
      this.setSendState(false);
    }
  }

  renderResponse(results) {
    const normalized = results.map((result) => ({
      iteracao: result.index ?? 1,
      status: result.status,
      sucesso: result.ok,
      tempo: formatMs(result.time),
      body: result.body
    }));

    this.setResponseContent(escapeHtml(JSON.stringify(normalized, null, 2)), true);
  }

  setResponseContent(content, isHtml = false) {
    if (isHtml) {
      this.elements.response.innerHTML = content;
      return;
    }

    this.elements.response.textContent = content;
  }

  setSendState(isSending) {
    this.elements.send.disabled = isSending;
    this.elements.send.textContent = isSending ? "Enviando..." : "Enviar";
  }

  saveCurrentForm(showToast = true) {
    saveForm(this.form);
    if (showToast) {
      this.toast("Formulario salvo localmente");
    }
  }

  exportCurrentForm() {
    const blob = new Blob([exportForm(this.form)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `endpointlab-${this.form.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async importFromFile(file) {
    const text = await file.text();
    try {
      this.form = importForm(text);
      this.renderFromState();
      this.toast("Formulario importado com sucesso");
    } catch (error) {
      this.toast(error.message, true);
    }
  }

  toast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-5 right-5 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${isError ? "bg-rose-600" : "bg-emerald-600"}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new EndpointLabApp();
});
