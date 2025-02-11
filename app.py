from fastapi import FastAPI, HTTPException
from pydantic import BaseModel 
import ollama 
import os

STATIC_FILES_DIR = "train_files"
static_files = {}


for filename in os.listdir(STATIC_FILES_DIR):
    if filename.endswith(".txt") or filename.endswith(".pdf"): 
        file_path = os.path.join(STATIC_FILES_DIR, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            static_files[filename] = f.read()


app = FastAPI()

try:
    with open("system_prompt.txt", "r", encoding="utf-8") as file:
        system_instruction = file.read()
except FileNotFoundError:
    raise HTTPException(status_code=500, detail="El archivo 'system_prompt.txt' no se encuentra en el directorio.")


class CommentRequest(BaseModel):
    comment: str  



@app.post("/respond_comment/")
async def respond_comment(request: CommentRequest):
    if not static_files:  # Verifica si la carpeta está vacía
        raise HTTPException(status_code=404, detail="No hay archivos disponibles en 'train_files'.")

    file_name = next(iter(static_files))  # Toma el primer archivo disponible
    file_text = static_files[file_name]

    # Construir el contexto para el modelo
    context = f"Comentario del usuario: {request.comment}\n\nContenido del archivo ({file_name}): {file_text}"

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": context},
    ]

    # Llamar al modelo de DeepSeek R1
    response = ollama.chat(model="deepseek-r1:8b", messages=messages)

    return {"response": response}