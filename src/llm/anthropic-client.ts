import Anthropic from '@anthropic-ai/sdk';
import type { LlmClient } from './client';

/**
 * Adaptador para un proveedor REAL: Claude (Anthropic).
 *
 * Implementa el mismo contrato `LlmClient` que el mock, así el código bajo prueba
 * y las evals no cambian: solo se inyecta este cliente en lugar del mock cuando se
 * quiere evaluar contra el modelo real.
 *
 * NO se usa en el CI (que corre con el mock determinista, gratis y reproducible).
 * Es el camino a producción: requiere la variable de entorno ANTHROPIC_API_KEY.
 *
 * Modelo por defecto: claude-opus-4-8 (el más capaz). Para clasificación de alto
 * volumen y sensible al costo, claude-sonnet-5 o claude-haiku-4-5 son alternativas.
 */
export class AnthropicLlmClient implements LlmClient {
  private readonly client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

  constructor(private readonly model: string = 'claude-opus-4-8') {}

  async complete(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 64, // la respuesta es solo la categoría: muy corta
      messages: [{ role: 'user', content: prompt }],
    });

    // El contenido es una unión de bloques; nos quedamos con los de texto.
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
  }
}
