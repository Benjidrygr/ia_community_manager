from typing import Dict
import uvicorn
import json
from agents.deepseek_agent import CommunityManagerAgent

# Inicializar el agente
agent = CommunityManagerAgent()

async def app(scope, receive, send):
    assert scope['type'] == 'http'
    
    if scope['method'] == 'GET':
        # Ruta de verificación de estado
        response = {
            "hello": "world",
            "status": "IA server is running"
        }
        response_bytes = json.dumps(response).encode('utf-8')
        
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [
                [b'content-type', b'application/json'],
                [b'content-length', str(len(response_bytes)).encode()],
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': response_bytes,
        })
        
    elif scope['method'] == 'POST' and scope['path'] == '/process-comment':
        # Procesar el body de la petición
        body = await receive_body(receive)
        try:
            comment_data = json.loads(body)
            # Procesar el comentario usando el agente
            response = await agent.process_comment(comment_data)
            
            if response:
                result = {"response": response}
            else:
                result = {"error": "No se pudo generar una respuesta"}
                
            response_bytes = json.dumps(result).encode('utf-8')
            
            await send({
                'type': 'http.response.start',
                'status': 200,
                'headers': [
                    [b'content-type', b'application/json'],
                    [b'content-length', str(len(response_bytes)).encode()],
                ],
            })
            await send({
                'type': 'http.response.body',
                'body': response_bytes,
            })
        except Exception as e:
            error_response = {"error": str(e)}
            error_bytes = json.dumps(error_response).encode('utf-8')
            
            await send({
                'type': 'http.response.start',
                'status': 500,
                'headers': [
                    [b'content-type', b'application/json'],
                    [b'content-length', str(len(error_bytes)).encode()],
                ],
            })
            await send({
                'type': 'http.response.body',
                'body': error_bytes,
            })
    else:
        # Ruta no encontrada
        error_response = {"error": "Ruta no encontrada"}
        error_bytes = json.dumps(error_response).encode('utf-8')
        
        await send({
            'type': 'http.response.start',
            'status': 404,
            'headers': [
                [b'content-type', b'application/json'],
                [b'content-length', str(len(error_bytes)).encode()],
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': error_bytes,
        })

async def receive_body(receive):
    """Helper function to receive the complete body of a request"""
    body = b''
    more_body = True
    
    while more_body:
        message = await receive()
        body += message.get('body', b'')
        more_body = message.get('more_body', False)
    
    return body

# Crear una variable para la aplicación
application = app

if __name__ == "__main__":
    print("🤖 Iniciando servidor de IA...")
    uvicorn.run(
        "main:application",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
