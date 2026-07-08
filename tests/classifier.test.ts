import { describe, it, expect } from 'vitest';
import { parseCategory, classifyTicket } from '../src/classifier';
import { MockLlmClient } from '../src/llm/mock-client';
import type { LlmClient } from '../src/llm/client';

describe('parseCategory (tolerancia a salida no determinista)', () => {
  it('extrae la categoría de distintos formatos de respuesta del modelo', () => {
    // Un LLM puede responder de muchas formas — el parseo debe tolerarlas todas.
    expect(parseCategory('billing')).toBe('billing');
    expect(parseCategory('Billing.')).toBe('billing');
    expect(parseCategory('La categoría es: billing')).toBe('billing');
    expect(parseCategory('  TECHNICAL\n')).toBe('technical');
  });

  it('cae en "other" ante una respuesta desconocida', () => {
    expect(parseCategory('no lo sé')).toBe('other');
  });
});

describe('classifyTicket con el cliente mock', () => {
  it('clasifica un mensaje de facturación', async () => {
    expect(await classifyTicket('me cobraron de más', new MockLlmClient())).toBe('billing');
  });

  it('clasifica un mensaje técnico', async () => {
    expect(await classifyTicket('la app tira un error', new MockLlmClient())).toBe('technical');
  });

  it('es determinista: misma entrada, misma salida', async () => {
    const client: LlmClient = new MockLlmClient();
    const a = await classifyTicket('no puedo ingresar a mi cuenta', client);
    const b = await classifyTicket('no puedo ingresar a mi cuenta', client);
    expect(a).toBe(b);
  });
});
