/**
 * Umbral de aceptación (el gate).
 *
 * Con métricas continuas no se exige 100%: se fija un umbral empírico según la
 * criticidad. Si la exactitud del sistema cae por debajo de este valor, la eval
 * falla y (en CI) bloquea el merge. Así se detectan REGRESIONES DE PROMPT: un
 * cambio de prompt que "mejora" un caso pero degrada la exactitud global.
 */
export const ACCURACY_THRESHOLD = 0.8;
