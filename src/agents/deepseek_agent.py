import os
from typing import Dict
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate

class CommunityManagerAgent:
    def __init__(self):
        # Cargar el system prompt
        with open('../src/system_prompt.txt', 'r', encoding='utf-8') as f:
            self.system_prompt = f.read()
        
        # Cargar los archivos de entrenamiento
        self.training_data = self._load_training_files()
        
        # Inicializar el modelo a través de Ollama
        self.model = Ollama(
            model="deepseek-r1",  # Asegúrate que este sea el nombre correcto de tu modelo en ollama
            base_url="http://localhost:11434"  # URL por defecto de ollama
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
    
    async def process_comment(self, comment: Dict) -> str:
        """
        Procesa un comentario y genera una respuesta apropiada
        
        Args:
            comment (Dict): Diccionario con la información del comentario
                {
                    'platform': str,  # 'facebook' o 'instagram'
                    'content': str,   # contenido del comentario
                    'id': str,        # ID del comentario
                    'user': str,      # nombre del usuario
                    'timestamp': str   # marca de tiempo
                }
        """
        try:
            # Preparar el prompt completo
            prompt = self.prompt_template.format(
                system_prompt=self.system_prompt,
                training_data=self.training_data,
                user_comment=comment['content']
            )
            
            # Generar respuesta usando ollama
            response = self.model(prompt)
            
            # Validar la longitud de la respuesta
            if len(response) > 300:
                response = response[:297] + "..."
            
            return response
            
        except Exception as e:
            print(f"Error procesando comentario: {e}")
            return None
    
    def _validate_response(self, response: str) -> bool:
        """
        Valida que la respuesta cumpla con los criterios establecidos
        """
        if len(response) > 300:
            return False
        
        # Aquí puedes agregar más validaciones según tus necesidades
        return True 