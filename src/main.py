from typing import Dict
import uvicorn

async def app(scope, receive, send):
    assert scope['type'] == 'http'
    
    # Preparar la respuesta
    response = {
        "hello": "world",
        "status": "IA server is running"
    }
    
    # Convertir el diccionario a bytes
    response_bytes = str(response).encode('utf-8')
    
    # Enviar headers
    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [
            [b'content-type', b'application/json'],
            [b'content-length', str(len(response_bytes)).encode()],
        ],
    })
    
    # Enviar el body
    await send({
        'type': 'http.response.body',
        'body': response_bytes,
    })

if __name__ == "__main__":
    print("🤖 Iniciando servidor básico de IA...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
