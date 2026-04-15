const STORAGE_PREFIX = "endpointlab:";
const LAST_FORM_KEY = `${STORAGE_PREFIX}last-form`;

export function saveForm(form) {
  localStorage.setItem(`${STORAGE_PREFIX}${form.id}`, JSON.stringify(form));
  localStorage.setItem(LAST_FORM_KEY, form.id);
}

export function loadForm(formId) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${formId}`);
  return raw ? JSON.parse(raw) : null;
}

export function loadLastForm() {
  const id = localStorage.getItem(LAST_FORM_KEY);
  if (!id) return null;
  return loadForm(id);
}

export function loadForms() {
  const forms = [];
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(STORAGE_PREFIX) || key === LAST_FORM_KEY) continue;
    try {
      forms.push(JSON.parse(localStorage.getItem(key)));
    } catch {
      // Ignore malformed entries.
    }
  }
  return forms;
}

export function exportForm(form) {
  return JSON.stringify(form, null, 2);
}

export function importForm(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed?.id || !parsed?.request || !Array.isArray(parsed?.fields)) {
    throw new Error("JSON invalido para formulario");
  }
  saveForm(parsed);
  return parsed;
}
