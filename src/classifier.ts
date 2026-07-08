import type { LlmClient } from './llm/client';

/**
 * Sistema bajo prueba: un clasificador de tickets de soporte basado en LLM.
 *
 * Toma un mensaje del usuario, arma un prompt, llama al modelo y normaliza la
 * respuesta a una categoría válida. Es una aplicación con IA típica: la lógica
 * de negocio está en el PROMPT y en el POST-PROCESAMIENTO de una salida abierta.
 */

export const CATEGORIES = ['billing', 'technical', 'account', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Construye el prompt. En un sistema real, este prompt se versiona como código. */
export function buildPrompt(message: string): string {
  return [
    `Clasificá el siguiente mensaje de soporte en UNA de estas categorías: ${CATEGORIES.join(', ')}.`,
    'Respondé SOLO con la categoría, sin explicaciones.',
    '',
    `Mensaje: "${message}"`,
  ].join('\n');
}

/**
 * Normaliza la salida (potencialmente ruidosa) del modelo a una categoría válida.
 *
 * Un LLM puede responder "billing", "Billing.", "La categoría es billing", etc.
 * Este parseo tolerante es parte esencial de trabajar con salidas no deterministas:
 * buscamos la primera categoría conocida mencionada en la respuesta.
 */
export function parseCategory(raw: string): Category {
  const normalized = raw.toLowerCase();
  return CATEGORIES.find((category) => normalized.includes(category)) ?? 'other';
}

export async function classifyTicket(message: string, client: LlmClient): Promise<Category> {
  const raw = await client.complete(buildPrompt(message));
  return parseCategory(raw);
}
