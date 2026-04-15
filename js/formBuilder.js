import { createId, safeJsonParse } from "./utils.js";

export function createFormModel() {
  return {
    id: createId(),
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
}

export function addField(form, field = {}) {
  const newField = {
    id: createId(),
    key: field.key ?? "",
    type: field.type ?? "text",
    value: field.value ?? ""
  };

  form.fields.push(newField);
  return newField;
}

export function removeField(form, fieldId) {
  form.fields = form.fields.filter((field) => field.id !== fieldId);
}

export function updateField(form, fieldId, patch) {
  const target = form.fields.find((field) => field.id === fieldId);
  if (!target) return;
  Object.assign(target, patch);
}

function castValueByType(type, value) {
  if (type === "number") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (type === "boolean") {
    return value === true || value === "true";
  }

  if (type === "json") {
    return safeJsonParse(String(value), {});
  }

  return value;
}

export function generatePayload(form) {
  const payload = {};

  for (const field of form.fields) {
    if (!field.key.trim()) continue;
    payload[field.key.trim()] = castValueByType(field.type, field.value);
  }

  return payload;
}
