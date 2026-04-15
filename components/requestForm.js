export function renderRequestFormShell() {
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
}
