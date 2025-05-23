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
        
        # Cargar los datos de fine-tuning
        self.fine_tuning_data = self._load_fine_tuning_data()
        print(f"📚 Datos de fine-tuning cargados: {len(self.fine_tuning_data)} ejemplos")
        
        # Inicializar el modelo a través de Ollama
        self.model = Ollama(
            model="deepseek-r1:7b",
            base_url=self.ollama_url
        )
        
        # Crear el template para las respuestas
        self.prompt_template = PromptTemplate(
            input_variables=["system_prompt", "fine_tuning", "user_comment"],
            template="""
            {system_prompt}
            
            Ejemplos de interacciones previas:
            {fine_tuning}
            
            Instrucciones adicionales:
            - La respuesta DEBE ser concisa y NO exceder los 300 caracteres
            - Mantén un tono amigable y profesional
            - Evita respuestas largas o explicaciones extensas
            
            Comentario del usuario:
            {user_comment}
            
            Respuesta (máximo 300 caracteres):
            """
        )
    
    def _load_fine_tuning_data(self) -> str:
        """
        Carga los datos de fine-tuning del archivo JSONL
        """
        examples = []
        fine_tuning_path = os.path.join(os.path.dirname(__file__), '..', 'train_files', 'copriter_finetuning_updated.jsonl')
        
        try:
            with open(fine_tuning_path, 'r', encoding='utf-8') as f:
                for line in f:
                    example = json.loads(line)
                    examples.append(f"Usuario: {example['input']}\nRespuesta: {example['output']}\n")
            
            return "\n".join(examples)
        except Exception as e:
            print(f"❌ Error cargando datos de fine-tuning: {e}")
            return ""
    
    def _validate_response(self, response: str) -> bool:
        """
        Valida que la respuesta cumpla con los criterios establecidos
        """
        if len(response) > 300:
            print(f"⚠️ Respuesta excede 300 caracteres ({len(response)} caracteres)")
            return False
        return True
    
    def _truncate_response(self, response: str) -> str:
        """
        Trunca la respuesta a 300 caracteres manteniendo oraciones completas
        """
        if len(response) <= 300:
            return response
            
        # Buscar el último punto antes de los 300 caracteres
        truncated = response[:300]
        last_period = truncated.rfind('.')
        
        if last_period > 0:
            return response[:last_period + 1].strip()
        else:
            return response[:297] + "..."
    
    async def process_comment(self, comment_data: Dict) -> Optional[str]:
        try:
            # Preparar el prompt con los ejemplos de fine-tuning
            prompt = self.prompt_template.format(
                system_prompt=self.system_prompt,
                fine_tuning=self.fine_tuning_data,
                user_comment=comment_data['content']
            )
            
            print(f"📤 Enviando solicitud a Ollama: {self.ollama_url}/api/generate")
            
            # Hacer la solicitud a Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "deepseek-r1:7b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=240
            )
            
            # Verificar si la solicitud fue exitosa
            response.raise_for_status()
            
            # Procesar la respuesta
            result = response.json()
            if 'response' in result:
                response_text = result['response'].strip()
                
                # Validar y truncar si es necesario
                if not self._validate_response(response_text):
                    response_text = self._truncate_response(response_text)
                    print(f"✂️ Respuesta truncada a: {len(response_text)} caracteres")
                
                return response_text
            else:
                print("❌ Respuesta de Ollama no contiene el campo 'response'")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al conectar con Ollama: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Error inesperado: {str(e)}")
            return None 