from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from agents.deepseek_agent import CommunityManagerAgent

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 