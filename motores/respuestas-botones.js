export function idDeRespuestaInteractiva(msg) {
  const respuesta = msg?.message?.interactiveResponseMessage;
  if (!respuesta) return null;
  try {
    const parametros = respuesta.nativeFlowResponseMessage?.paramsJson;
    const id = parametros ? JSON.parse(parametros).id : null;
    return id || respuesta.body?.text || null;
  } catch (e) {
    return null;
  }
}
