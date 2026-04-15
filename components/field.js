export function renderFieldRow(field) {
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
}
