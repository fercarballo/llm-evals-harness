import type { LlmClient } from './client';

/**
 * Cliente LLM MOCK y DETERMINISTA.
 *
 * Simula el comportamiento de un modelo con reglas por palabras clave. No es
 * perfecto a propósito (comete algunos errores, como un modelo real), pero es
 * REPRODUCIBLE: la misma entrada da siempre la misma salida.
 *
 * ¿Por qué un mock para las evals de CI? Porque un modelo real es no determinista,
 * cuesta dinero por llamada y agrega latencia. Para un gate reproducible y gratis
 * en cada PR, el mock es la opción correcta; el proveedor real se documenta y se
 * usa en corridas contra producción (ver AnthropicLlmClient).
 */
export class MockLlmClient implements LlmClient {
  async complete(prompt: string): Promise<string> {
    const text = prompt.toLowerCase();

    // El prompt le pide "respondé solo con la categoría". El mock la deduce por
    // palabras clave del mensaje incluido en el prompt.
    if (/(factura|pago|cobr|reembolso|tarjeta|precio|cargo|suscrip)/.test(text)) {
      return 'billing';
    }
    if (/(error|no funciona|no anda|falla|bug|crash|pantalla|lenta|no carga)/.test(text)) {
      return 'technical';
    }
    if (/(cuenta|contrase|password|acceso|login|usuario|perfil|ingresar)/.test(text)) {
      return 'account';
    }
    return 'other';
  }
}
