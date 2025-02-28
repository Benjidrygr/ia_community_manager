from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from agents.deepseek_agent import CommunityManagerAgent
import json

app = FastAPI()
agent = CommunityManagerAgent()

class CommentData(BaseModel):
    platform: str
    content: str
    comment_id: str
    user_id: str
    username: Optional[str]
    user_name: Optional[str]
    media_id: Optional[str]
    media_type: Optional[str]
    post_id: Optional[str]
    parent_id: Optional[str]
    timestamp: Optional[str]
    created_time: Optional[str]
    permalink: Optional[str]

class FacebookUser(BaseModel):
    id: str
    name: str

class FacebookPost(BaseModel):
    id: str
    status_type: Optional[str] = None
    is_published: Optional[bool] = None
    updated_time: Optional[str] = None
    permalink_url: Optional[str] = None

class FacebookCommentValue(BaseModel):
    from_: FacebookUser = Field(alias='from')
    post: Optional[FacebookPost] = None
    message: str
    post_id: str
    comment_id: str
    created_time: int
    item: str
    parent_id: str
    verb: str

class FacebookChange(BaseModel):
    value: FacebookCommentValue
    field: str

class FacebookEntry(BaseModel):
    id: str
    time: int
    changes: List[FacebookChange]

class FacebookEvent(BaseModel):
    entry: List[FacebookEntry]
    object: str

@app.get("/")
async def root():
    return {"message": "API del Community Manager está funcionando"}

@app.post("/process-comment")
async def process_comment(comment: CommentData):
    try:
        # Asegurarse de que el agente está inicializado correctamente
        if not hasattr(agent, 'training_data') or agent.training_data is None:
            return {"response": "El agente no está inicializado correctamente."}
            
        # Preparar el comentario para el agente
        comment_data = {
            'platform': comment.platform,
            'content': comment.content,
            'id': comment.comment_id,
            'user': comment.username or comment.user_name,
            'timestamp': comment.timestamp or comment.created_time
        }
        
        # Procesar el comentario usando el agente
        response = await agent.process_comment(comment_data)
        
        if response:
            return {"response": response}
        else:
            return {"response": "Lo siento, no pude procesar este comentario."}
            
    except Exception as e:
        print(f"Error en el endpoint process-comment: {e}")
        return {"response": "Ocurrió un error al procesar el comentario."}

@app.post("/webhook")
async def facebook_webhook(event: FacebookEvent):
    try:
        print("📘 Evento de Facebook recibido")
        
        # Procesamos solo el primer cambio del primer entry
        if event.entry and event.entry[0].changes:
            change = event.entry[0].changes[0]
            if change.field == "feed" and change.value.item == "comment":
                comment_data = {
                    'platform': 'facebook',
                    'content': change.value.message,
                    'user': change.value.from_.name,
                    'comment_id': change.value.comment_id,
                    'created_time': datetime.fromtimestamp(change.value.created_time),
                    'post_id': change.value.post_id
                }
                
                print(f"💬 Comentario de Facebook detectado:\n{json.dumps(comment_data, indent=2, default=str)}")
                
                # Procesar con el agente
                response = agent.process_comment(comment_data)
                return {"response": response}
        
        return {"message": "Evento procesado pero no es un comentario"}
    
    except Exception as e:
        print(f"❌ Error procesando evento de Facebook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 