from fastapi import FastAPI, Request
from agents.deepseek_agent import CommunityManagerAgent
import asyncio
import uvicorn

app = FastAPI()
agent = CommunityManagerAgent()

@app.post("/process-comment")
async def process_comment(request: Request):
    data = await request.json()
    
    comment = {
        'platform': data.get('platform'),
        'content': data.get('content'),
        'id': data.get('id'),
        'user': data.get('user'),
        'timestamp': data.get('timestamp')
    }
    
    response = await agent.process_comment(comment)
    return {"response": response}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 