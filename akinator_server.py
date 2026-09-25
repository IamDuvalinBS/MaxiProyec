# akinator_server.py
#
# Mini-servicio HTTP local que le hace de puente a tu bot de Node con
# Akinator, usando la librería de Python "akinator" (Ombucha/akinator.py),
# que usa "cloudscraper" para esquivar la protección de Akinator - mucho
# más robusto que las librerías de Node que ya probamos.
#
# Corre APARTE de tu bot (node index.js), en su propia terminal de Termux.
# Tu bot le habla por HTTP a http://127.0.0.1:5057.
#
# Instalación (una sola vez), en Termux parado en tu carpeta del proyecto:
#   pkg install python        (si no tenés python instalado)
#   pip install akinator flask
#
# Para correrlo:
#   python akinator_server.py
#
# Dejalo corriendo en una terminal aparte (Termux permite varias sesiones:
# deslizá desde el borde izquierdo de la pantalla > "New session").

import time
import uuid

import akinator
from akinator import CantGoBackAnyFurther, InvalidChoiceError
from flask import Flask, request, jsonify

app = Flask(__name__)

PUERTO = 5057
IDIOMA = "es"
TEMA = "c"  # personajes
UMBRAL_PROGRESO = 80.0
MAX_PASOS = 80
INACTIVIDAD_SEG = 10 * 60

sesiones = {}  # id -> {"aki": Akinator, "ultimo": timestamp}


def limpiar_inactivas():
    ahora = time.time()
    vencidas = [sid for sid, s in sesiones.items() if ahora - s["ultimo"] > INACTIVIDAD_SEG]
    for sid in vencidas:
        del sesiones[sid]


def estado_pregunta(aki):
    return {
        "pregunta": aki.question,
        "progreso": round(float(aki.progression), 1),
        "paso": aki.step,
        "gano": False
    }


@app.post("/start")
def iniciar():
    limpiar_inactivas()
    aki = akinator.Akinator()
    try:
        aki.start_game(language=IDIOMA, child_mode=False, theme=TEMA)
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    sid = str(uuid.uuid4())
    sesiones[sid] = {"aki": aki, "ultimo": time.time()}
    return jsonify({"id": sid, **estado_pregunta(aki)})


MAPA_RESPUESTAS = {
    "si": "y", "no": "n", "nose": "i",
    "probablemente": "p", "probablementeno": "pn"
}


@app.post("/answer")
def responder():
    limpiar_inactivas()
    data = request.get_json(force=True) or {}
    sid = data.get("id")
    respuesta = data.get("respuesta")

    sesion = sesiones.get(sid)
    if not sesion:
        return jsonify({"error": "sesion no encontrada"}), 404
    aki = sesion["aki"]
    sesion["ultimo"] = time.time()

    token = MAPA_RESPUESTAS.get(respuesta)
    if token is None:
        return jsonify({"error": "respuesta invalida"}), 400

    try:
        aki.answer(token)
    except InvalidChoiceError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    if aki.progression >= UMBRAL_PROGRESO:
        try:
            aki.win()
        except Exception as e:
            return jsonify({"error": str(e)}), 502
        guess = aki.first_guess
        if guess:
            return jsonify({
                "gano": True,
                "nombre": guess["name"],
                "descripcion": guess.get("description") or "",
                "foto": guess.get("absolute_picture_path") or "",
                "paso": aki.step
            })

    if aki.step >= MAX_PASOS:
        return jsonify({"gano": False, "agotado": True, **estado_pregunta(aki)})

    return jsonify(estado_pregunta(aki))


@app.post("/atras")
def atras():
    data = request.get_json(force=True) or {}
    sid = data.get("id")
    sesion = sesiones.get(sid)
    if not sesion:
        return jsonify({"error": "sesion no encontrada"}), 404
    aki = sesion["aki"]
    sesion["ultimo"] = time.time()
    try:
        aki.back()
    except CantGoBackAnyFurther:
        return jsonify({"error": "no hay pregunta anterior"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 502
    return jsonify(estado_pregunta(aki))


@app.post("/cerrar")
def cerrar():
    data = request.get_json(force=True) or {}
    sid = data.get("id")
    sesiones.pop(sid, None)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"🔮 Servidor de Akinator escuchando en http://127.0.0.1:{PUERTO}")
    app.run(host="127.0.0.1", port=PUERTO)
