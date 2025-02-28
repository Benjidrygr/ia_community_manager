from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import uvicorn
from agents.deepseek_agent import CommunityManagerAgent

# Inicializar FastAPI y el agente
app = FastAPI(title="Community Manager AI Service")
agent = CommunityManagerAgent()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommentRequest(BaseModel):
    platform: str
    content: str
    comment_id: str
    user_id: str
    username: Optional[str]
    user_name: Optional[str]
    timestamp: Optional[str]
    media_id: Optional[str]
    post_id: Optional[str]

@app.get("/")
async def root():
    return {"status": "active", "service": "Community Manager AI"}

@app.post("/process-comment")
async def process_comment(comment: CommentRequest):
    try:
        # Preparar el comentario para el agente
        comment_data = {
            "platform": comment.platform,
            "content": comment.content,
            "id": comment.comment_id,
            "user": comment.username or comment.user_name,
            "timestamp": comment.timestamp
        }
        
        # Procesar el comentario
        response = await agent.process_comment(comment_data)
        
        if not response:
            raise HTTPException(status_code=500, detail="Error generando respuesta")
            
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🤖 Iniciando servidor de IA...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
