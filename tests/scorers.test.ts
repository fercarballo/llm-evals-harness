import { describe, it, expect } from 'vitest';
import { exactMatch, semanticSimilarity, llmAsJudge } from '../evals/scorers';

describe('exactMatch', () => {
  it('es 1 cuando coincide (ignorando caso y espacios)', () => {
    expect(exactMatch('Billing', ' billing ')).toBe(1);
  });
  it('es 0 cuando no coincide', () => {
    expect(exactMatch('billing', 'technical')).toBe(0);
  });
});

describe('semanticSimilarity', () => {
  it('es 1 para textos idénticos', () => {
    expect(semanticSimilarity('el pago falló', 'el pago falló')).toBeCloseTo(1);
  });
  it('es mayor para textos parecidos que para distintos', () => {
    const parecido = semanticSimilarity('el pago de la tarjeta falló', 'falló el pago con tarjeta');
    const distinto = semanticSimilarity('el pago de la tarjeta falló', 'quiero cambiar mi perfil');
    expect(parecido).toBeGreaterThan(distinto);
  });
  it('es 0 si un texto está vacío', () => {
    expect(semanticSimilarity('', 'algo')).toBe(0);
  });
});

describe('llmAsJudge', () => {
  it('puntúa 1 cuando se cumplen todos los criterios', () => {
    const score = llmAsJudge('El plazo de reembolso es de 15 días.', {
      mustInclude: ['reembolso', '15'],
      maxWords: 20,
    });
    expect(score).toBe(1);
  });
  it('baja el score cuando falta un criterio', () => {
    const score = llmAsJudge('El plazo de reembolso es corto.', {
      mustInclude: ['reembolso', '15'],
    });
    expect(score).toBe(0.5);
  });
  it('penaliza términos prohibidos', () => {
    const score = llmAsJudge('No estoy seguro, tal vez.', { forbid: ['no estoy seguro'] });
    expect(score).toBe(0);
  });
});
