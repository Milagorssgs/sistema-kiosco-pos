import webview
import uvicorn
import threading
from src.main import app  # Asegurate de que esta ruta apunte a tu 'app' de FastAPI

def iniciar_servidor():
    # Prende el backend de fondo de forma invisible
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="critical")

if __name__ == '__main__':
    # 1. Creamos un hilo secundario para que el servidor corra sin trabar la pantalla
    hilo_servidor = threading.Thread(target=iniciar_servidor, daemon=True)
    hilo_servidor.start()

    # 2. Creamos la ventana nativa de Windows
    webview.create_window(
        title="Sistema Kiosco POS",
        url="http://127.0.0.1:8000",
        width=1200,
        height=800,
        min_size=(800, 600)
    )
    
    # 3. Arrancamos el programa
    webview.start()