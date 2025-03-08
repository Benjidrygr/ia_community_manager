import os
from typing import Dict, Optional
import requests
import json
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate

class CommunityManagerAgent:
    def __init__(self):
        # Obtener la URL de Ollama del ambiente o usar un valor por defecto
        self.ollama_url = os.getenv('OLLAMA_API_URL', 'http://localhost:11434')
        print(f"🤖 Inicializando agente con Ollama URL: {self.ollama_url}")
        
        # Cargar el system prompt
        with open('../src/system_prompt.txt', 'r', encoding='utf-8') as f:
            self.system_prompt = f.read()
        
        # Cargar los archivos de entrenamiento
        self.training_data = self._load_training_files()
        
        # Inicializar el modelo a través de Ollama
        self.model = Ollama(
            model="deepseek-r1:7b",  # Asegúrate que este sea el nombre correcto de tu modelo en ollama
            base_url=self.ollama_url  # URL de Ollama
        )
        
        # Crear el template para las respuestas
        self.prompt_template = PromptTemplate(
            input_variables=["system_prompt", "training_data", "user_comment"],
            template="""
            {system_prompt}
            
            Información relevante:
            {training_data}
            
            Comentario del usuario:
            {user_comment}
            
            Respuesta:
            """
        )
    
    def _load_training_files(self) -> str:
        """
        Carga todos los archivos de entrenamiento del directorio training_files
        """
        training_data = []
        train_files_path = os.path.join(os.path.dirname(__file__), '..', 'train_files')
        
        try:
            for filename in os.listdir(train_files_path):
                if filename.endswith('.txt'):
                    file_path = os.path.join(train_files_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        training_data.append(f.read())
            
            return "\n\n".join(training_data)
        except Exception as e:
            print(f"Error cargando archivos de entrenamiento: {e}")
            return ""
    
    async def process_comment(self, comment_data: Dict) -> Optional[str]:
        try:
            # Preparar el prompt
            prompt = self._prepare_prompt(comment_data)
            
            # Preparar la solicitud a Ollama
            payload = {
                "model": "deepseek-r1:7b",
                "prompt": prompt,
                "stream": False
            }
            
            print(f"📤 Enviando solicitud a Ollama: {self.ollama_url}/api/generate")
            
            # Hacer la solicitud a Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=50  # Aumentar el timeout a 30 segundos
            )
            
            # Verificar si la solicitud fue exitosa
            response.raise_for_status()
            
            # Procesar la respuesta
            result = response.json()
            if 'response' in result:
                return result['response'].strip()
            else:
                print("❌ Respuesta de Ollama no contiene el campo 'response'")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al conectar con Ollama: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Error inesperado: {str(e)}")
            return None

    def _prepare_prompt(self, comment_data: Dict) -> str:
        # Extraer información relevante
        content = comment_data.get('content', '')
        user = comment_data.get('username', 'Usuario')
        
        # Construir el prompt
        prompt = f"""Como community manager de la campaña política de Spadaro, responde al siguiente comentario de manera profesional y empática:

Usuario: {user}
Comentario: {content}

Respuesta:"""
        
        return prompt
    
    def _validate_response(self, response: str) -> bool:
        """
        Valida que la respuesta cumpla con los criterios establecidos
        """
        if len(response) > 300:
            return False
        
        # Aquí puedes agregar más validaciones según tus necesidades
        return True 