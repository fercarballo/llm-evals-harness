/**
 * Interfaz del cliente LLM.
 *
 * Abstrae "el modelo" detrás de un contrato mínimo (`complete(prompt)`). Esto
 * permite intercambiar la implementación sin tocar el código bajo prueba:
 *   - MockLlmClient      → determinista, para las evals en CI (gratis y reproducible).
 *   - AnthropicLlmClient → un proveedor real (Claude), para correr contra producción.
 */
export interface LlmClient {
  complete(prompt: string): Promise<string>;
}
