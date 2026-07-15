# Evals de Aplicaciones con IA — LLM Testing

Harness de **evaluación (evals)** para testear una aplicación basada en un modelo de lenguaje (LLM), un sistema **no determinista**. Construido con **TypeScript**, con un modelo mock determinista para el gate de CI y un adaptador real de **Claude** (Anthropic SDK) para correr contra producción.

![CI](https://github.com/fercarballo/llm-evals-harness/actions/workflows/ci.yml/badge.svg)

---

## Resumen ejecutivo

| | |
|---|---|
| **Qué es** | Un marco para evaluar la calidad de un sistema con IA de forma sistemática, con datasets, métricas y umbrales — el equivalente de una suite de tests para software no determinista. |
| **Problema que resuelve** | Un LLM no se puede testear por igualdad exacta: la misma entrada puede dar salidas distintas y no hay "una" respuesta correcta. Se necesitan otras técnicas: golden datasets, scorers y umbrales. |
| **Enfoque** | Un sistema bajo prueba real (clasificador de tickets), un golden dataset, tres tipos de scorer, y un umbral que actúa como gate para detectar regresiones de prompt. |
| **Resultado** | Evaluación reproducible y gratuita en cada PR (modelo mock), con el camino a un proveedor real documentado y tipado. Detecta regresiones antes de producción. |
| **Stack** | TypeScript · Vitest · Anthropic SDK (Claude) |

---

## Por qué testear IA es distinto

```mermaid
flowchart LR
    subgraph SW["Software tradicional"]
        A["suma(2,3)"] --> B["= 5 siempre"]
    end
    subgraph AI["Aplicación con IA"]
        C["clasificá(mensaje)"] --> D["salida abierta<br/>y no determinista"]
    end
    style B fill:#1e7a4f,color:#fff
    style D fill:#b8860b,color:#fff
```

`assertEquals(suma(2,3), 5)` es determinista. Pero pedirle a un LLM que clasifique un mensaje puede dar respuestas con distinto formato ("billing", "Billing.", "La categoría es billing"), y para tareas abiertas (resumir) no existe una única salida correcta. Por eso se evalúa con **propiedades y métricas**, no con igualdad.

---

## Las tres capas de scoring

```mermaid
flowchart TD
    R["Salida del modelo"] --> EM["Exact match<br/>(respuesta única: clasificación)"]
    R --> SS["Similitud semántica<br/>(salida abierta: resúmenes)"]
    R --> JU["LLM-as-judge<br/>(calidad subjetiva, con rúbrica)"]
    style R fill:#2e6da4,color:#fff
```

| Scorer | Cuándo | Devuelve |
|---|---|---|
| **Exact match** | Hay una respuesta única correcta (clasificación) | 0 / 1 |
| **Similitud semántica** | Salida abierta sin una única forma correcta | 0..1 |
| **LLM-as-judge** | Calidad subjetiva (tono, completitud) contra una rúbrica | 0..1 |

---

## El umbral como gate (detección de regresiones de prompt)

Las evals **no exigen 100%**: se fija un umbral empírico. Si la exactitud cae por debajo, el gate falla. Así se detecta una **regresión de prompt** — un cambio que mejora un caso pero degrada la métrica global.

```
$ npm run evals

Evals del clasificador de tickets
  Casos       : 13
  Correctos   : 12
  Exactitud   : 92.3%
  Umbral (gate): 80%

  Casos fallidos:
    • "La factura mensual no se descarga desde la app"  esperado=technical obtenido=billing

✅ Gate OK: exactitud por encima del umbral.
```

El caso que falla tiene **señales mixtas** ("factura" + "no se descarga") — el tipo de caso de borde que los evals deben capturar. El gate pasa porque 92.3 % supera el umbral.

---

## Mock determinista vs proveedor real

```mermaid
flowchart LR
    C["Clasificador<br/>(sistema bajo prueba)"] --> I{{"LlmClient<br/>(interfaz)"}}
    I --> M["MockLlmClient<br/>determinista · gratis · CI"]
    I --> A["AnthropicLlmClient<br/>Claude · producción"]
    style I fill:#1a3a5c,color:#fff
```

El sistema depende de una **interfaz** `LlmClient`, no de un proveedor concreto. En CI se inyecta el **mock** (reproducible y gratis); para evaluar contra el modelo real se inyecta el adaptador de **Claude**, sin cambiar el clasificador ni las evals. Correr un modelo real en cada PR sería caro, lento y no determinista — por eso el gate usa el mock, y el proveedor real queda para corridas contra producción.

---

## Estructura

```
src/
├── llm/
│   ├── client.ts            # interfaz LlmClient
│   ├── mock-client.ts       # modelo mock determinista (CI)
│   └── anthropic-client.ts  # adaptador real de Claude (producción)
└── classifier.ts            # sistema bajo prueba (clasificador + parseo tolerante)
evals/
├── dataset.json             # golden dataset
├── scorers.ts               # exact-match, similitud, LLM-as-judge
├── config.ts                # umbral (gate)
└── run-evals.ts             # runner + gate
tests/                       # tests de scorers, clasificador y suite de evals
```

---

## Uso

```bash
npm install
npm test           # tests unitarios (scorers, clasificador, suite de evals)
npm run evals      # corre las evals con el mock y aplica el gate
npm run typecheck

# Para evaluar contra Claude real (requiere ANTHROPIC_API_KEY):
# inyectar AnthropicLlmClient en lugar de MockLlmClient.
```

---

## Documentación técnica

**[docs/DOCUMENTACION-TECNICA.md](docs/DOCUMENTACION-TECNICA.md)** detalla: por qué el testing de IA es distinto, el diseño del golden dataset, los tres scorers y cuándo usar cada uno, LLM-as-judge y sus riesgos, umbrales sobre métricas continuas, la regresión de prompts y la estrategia mock vs proveedor real.

---

## La suite completa

Este repositorio forma parte de una suite de automatización de calidad que cubre el ciclo de testing de punta a punta, de los fundamentos a las prácticas propias de un rol SDET.

**Fundamentos**

1. [Framework E2E de UI](https://github.com/fercarballo/playwright-e2e-framework-saucedemo) — Playwright · Page Object Model
2. [Testing de API](https://github.com/fercarballo/api-testing-framework-restful-booker) — contract testing con Zod
3. [Pipeline CI/CD](https://github.com/fercarballo/qa-automation-cicd-pipeline) — GitHub Actions · quality gates
4. [Estabilidad y flakiness](https://github.com/fercarballo/flakiness-hunting-playwright) — detección y erradicación
5. [Regresión visual & contract testing](https://github.com/fercarballo/visual-and-contract-testing) — Playwright + Pact

**Avanzado (SDET)**

6. [Performance & load testing](https://github.com/fercarballo/performance-testing-k6) — k6 · thresholds como gate
7. [Integración con dependencias reales](https://github.com/fercarballo/integration-testing-testcontainers) — Testcontainers · Postgres
8. [DevSecOps](https://github.com/fercarballo/devsecops-pipeline) — SAST · SCA · DAST en el pipeline
9. [Tooling interno de QA](https://github.com/fercarballo/qa-insights) — test impact + flaky detection
10. **Evals de aplicaciones con IA** — este repositorio

**Plataforma e IA aplicada (Python)**

11. [Plataforma de IA + pirámide completa](https://github.com/fercarballo/ai-platform-qa-lab) — FastAPI · pytest · Playwright · evals · CI GitHub + Azure
12. [Testing de API en Python](https://github.com/fercarballo/pytest-api-suite) — pytest + unittest · integración · contract testing
13. [Calidad de datos como testing](https://github.com/fercarballo/data-quality-testing) — contratos Pandera + checks de integridad SQL

---

## Licencia

MIT.
