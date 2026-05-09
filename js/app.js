(function () {
  const storageKeys = {
    prefix: "endpointlab:",
    lastForm: "endpointlab:last-form"
  };

  const utils = {
    createId() {
      return crypto.randomUUID();
    },

    safeJsonParse(value, fallback = null) {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    },

    isValidUrl(value) {
      try {
        const url = new URL(value);
        return Boolean(url.protocol && url.host);
      } catch {
        return false;
      }
    },

    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    formatMs(ms) {
      return `${ms.toFixed(2)} ms`;
    },

    escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }
  };

  const formService = {
    create() {
      return {
        id: utils.createId(),
        name: "Teste API",
        request: {
          url: "",
          method: "POST",
          headers: {}
        },
        fields: [],
        settings: {
          iterations: 1,
          intervalMs: 0
        }
      };
    },

    addField(form, field = {}) {
      const newField = {
        id: utils.createId(),
        key: field.key ?? "",
        type: field.type ?? "text",
        value: field.value ?? ""
      };

      form.fields.push(newField);
      return newField;
    },

    removeField(form, fieldId) {
      form.fields = form.fields.filter((field) => field.id !== fieldId);
    },

    updateField(form, fieldId, patch) {
      const target = form.fields.find((field) => field.id === fieldId);
      if (!target) return;
      Object.assign(target, patch);
    },

    castValue(type, value) {
      if (type === "number") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      if (type === "boolean") {
        return value === true || value === "true";
      }

      if (type === "json") {
        return utils.safeJsonParse(String(value), {});
      }

      return value;
    },

    generatePayload(form) {
      const payload = {};

      for (const field of form.fields) {
        const key = field.key.trim();
        if (!key) continue;
        payload[key] = this.castValue(field.type, field.value);
      }

      return payload;
    },

    validate(form) {
      if (!utils.isValidUrl(form.request.url)) {
        throw new Error("Informe uma URL valida antes de enviar");
      }

      if (form.settings.iterations < 1) {
        throw new Error("Iteracoes deve ser no minimo 1");
      }
    }
  };

  const requestService = {
    async execute(config) {
      const start = performance.now();

      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.method === "GET" ? undefined : JSON.stringify(config.body)
      });

      const end = performance.now();

      let body;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }

      return {
        status: response.status,
        ok: response.ok,
        time: end - start,
        body
      };
    },

    async runBatch(config) {
      const results = [];

      for (let index = 0; index < config.iterations; index += 1) {
        const result = await this.execute(config);
        results.push({ index: index + 1, ...result });

        if (index < config.iterations - 1 && config.intervalMs > 0) {
          await utils.delay(config.intervalMs);
        }
      }

      return results;
    }
  };

  const storageService = {
    getFormKey(formId) {
      return `${storageKeys.prefix}${formId}`;
    },

    saveForm(form) {
      localStorage.setItem(this.getFormKey(form.id), JSON.stringify(form));
      localStorage.setItem(storageKeys.lastForm, form.id);
    },

    loadForm(formId) {
      const raw = localStorage.getItem(this.getFormKey(formId));
      return raw ? JSON.parse(raw) : null;
    },

    loadLastForm() {
      const formId = localStorage.getItem(storageKeys.lastForm);
      return formId ? this.loadForm(formId) : null;
    },

    exportForm(form) {
      return JSON.stringify(form, null, 2);
    },

    importForm(jsonText) {
      const parsed = JSON.parse(jsonText);
      if (!parsed?.id || !parsed?.request || !Array.isArray(parsed?.fields)) {
        throw new Error("JSON invalido para formulario");
      }

      this.saveForm(parsed);
      return parsed;
    }
  };

  const templates = {
    appShell(content) {
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
          ${content}
        </main>
      `;
    },

    requestFormShell() {
      return `
        <section class="grid gap-6 lg:grid-cols-12">
          <div class="lg:col-span-7 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">Configuracao da Requisicao</h2>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">MVP</span>
              </div>

              <div class="grid gap-3 md:grid-cols-8">
                <label class="md:col-span-2 text-sm font-medium text-slate-700" for="method">Metodo</label>
                <select id="method" class="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option>GET</option>
                  <option selected>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
                <input id="url" class="md:col-span-4 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="https://api.exemplo.com/recurso" />
              </div>

              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700" for="iterations">Iteracoes</label>
                  <input id="iterations" type="number" min="1" value="1" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700" for="intervalMs">Intervalo (ms)</label>
                  <input id="intervalMs" type="number" min="0" value="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900">Campos Dinamicos</h3>
                <button id="addField" type="button" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">+ Campo</button>
              </div>
              <div id="fields" class="space-y-2"></div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="mb-3 text-lg font-semibold text-slate-900">Payload Preview</h3>
              <pre id="payloadPreview" class="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-emerald-300"></pre>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="mb-3 flex gap-2">
                <button id="send" type="button" class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Enviar</button>
                <button id="save" type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Salvar</button>
              </div>
              <pre id="response" class="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-cyan-200"></pre>
            </div>
          </div>
        </section>
      `;
    },

    fieldRow(field) {
      const row = document.createElement("div");
      row.className = "grid gap-2 md:grid-cols-12 rounded-xl border border-slate-200 bg-slate-50 p-3";
      row.dataset.fieldId = field.id;

      const keyInput = document.createElement("input");
      keyInput.className = "md:col-span-4 rounded-lg border border-slate-300 px-3 py-2 text-sm";
      keyInput.placeholder = "Campo (ex: userId)";
      keyInput.value = field.key;
      keyInput.dataset.role = "field-key";

      const typeSelect = document.createElement("select");
      typeSelect.className = "md:col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm";
      typeSelect.dataset.role = "field-type";
      typeSelect.innerHTML = `
        <option value="text">Texto</option>
        <option value="number">Numero</option>
        <option value="boolean">Boolean</option>
        <option value="json">JSON</option>
      `;
      typeSelect.value = field.type;

      const valueInput = document.createElement("input");
      valueInput.className = "md:col-span-4 rounded-lg border border-slate-300 px-3 py-2 text-sm";
      valueInput.placeholder = "Valor";
      valueInput.value = field.value;
      valueInput.dataset.role = "field-value";

      const removeButton = document.createElement("button");
      removeButton.className = "md:col-span-1 rounded-lg border border-rose-300 bg-rose-100 px-2 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200";
      removeButton.type = "button";
      removeButton.textContent = "X";
      removeButton.dataset.role = "remove-field";

      row.append(keyInput, typeSelect, valueInput, removeButton);
      return row;
    },

    emptyFieldsState() {
      const empty = document.createElement("p");
      empty.className = "rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500";
      empty.textContent = "Nenhum campo adicionado. Clique em + Campo para iniciar.";
      return empty;
    }
  };

  class EndpointLabApp {
    constructor() {
      this.form = storageService.loadLastForm() ?? formService.create();
      this.elements = {};
      this.mount();
    }

    mount() {
      const app = document.getElementById("app");
      app.innerHTML = templates.appShell(templates.requestFormShell());
      this.cacheElements();
      this.bindEvents();
      this.renderFromState();
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
      this.elements.url.addEventListener("input", ({ target }) => {
        this.form.request.url = target.value;
        this.renderPreview();
      });

      this.elements.method.addEventListener("change", ({ target }) => {
        this.form.request.method = target.value;
        this.renderPreview();
      });

      this.elements.iterations.addEventListener("input", ({ target }) => {
        this.form.settings.iterations = Math.max(1, Number(target.value || 1));
      });

      this.elements.intervalMs.addEventListener("input", ({ target }) => {
        this.form.settings.intervalMs = Math.max(0, Number(target.value || 0));
      });
    }

    bindFieldEvents() {
      this.elements.addField.addEventListener("click", () => {
        formService.addField(this.form);
        this.renderFields();
        this.renderPreview();
      });

      this.elements.fields.addEventListener("input", (event) => {
        const row = event.target.closest("[data-field-id]");
        if (!row) return;

        const patch = this.buildFieldPatch(event.target);
        if (!patch) return;

        formService.updateField(this.form, row.dataset.fieldId, patch);
        this.renderPreview();
      });

      this.elements.fields.addEventListener("click", (event) => {
        if (event.target.dataset.role !== "remove-field") return;

        const row = event.target.closest("[data-field-id]");
        if (!row) return;

        formService.removeField(this.form, row.dataset.fieldId);
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

      this.elements.importInput.addEventListener("change", async ({ target }) => {
        const file = target.files?.[0];
        if (!file) return;
        await this.importFromFile(file);
      });
    }

    buildFieldPatch(target) {
      if (target.dataset.role === "field-key") {
        return { key: target.value };
      }

      if (target.dataset.role === "field-value") {
        return { value: target.value };
      }

      if (target.dataset.role === "field-type") {
        return { type: target.value };
      }

      return null;
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
        this.elements.fields.appendChild(templates.emptyFieldsState());
        return;
      }

      for (const field of this.form.fields) {
        this.elements.fields.appendChild(templates.fieldRow(field));
      }
    }

    renderPreview() {
      const payload = formService.generatePayload(this.form);
      this.elements.payloadPreview.textContent = JSON.stringify(payload, null, 2);
    }

    buildRequestConfig() {
      return {
        url: this.form.request.url,
        method: this.form.request.method,
        headers: this.form.request.headers,
        body: formService.generatePayload(this.form),
        iterations: this.form.settings.iterations,
        intervalMs: this.form.settings.intervalMs
      };
    }

    async handleSend() {
      try {
        formService.validate(this.form);
        this.setSendState(true);

        const config = this.buildRequestConfig();
        const results = config.iterations > 1
          ? await requestService.runBatch(config)
          : [await requestService.execute(config)];

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
        tempo: utils.formatMs(result.time),
        body: result.body
      }));

      this.setResponseContent(utils.escapeHtml(JSON.stringify(normalized, null, 2)), true);
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
      storageService.saveForm(this.form);
      if (showToast) {
        this.toast("Formulario salvo localmente");
      }
    }

    exportCurrentForm() {
      const blob = new Blob([storageService.exportForm(this.form)], { type: "application/json" });
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
        this.form = storageService.importForm(text);
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
})();
