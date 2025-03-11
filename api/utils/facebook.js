const axios = require('axios');
const { logInfo, logError } = require('./logger');

async function respondToComment(commentId, message) {
    const token = process.env.GRAPH_API_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v19.0/${commentId}/comments`;
    
    try {
        const response = await axios.post(url, {
            message: message,
            access_token: token
        });
        
        logInfo('✅ Respuesta enviada a Facebook exitosamente');
        return response.data;
    } catch (error) {
        logError('❌ Error al enviar respuesta a Facebook:', error.response?.data || error.message);
        throw error;
    }
}

function cleanResponse(response) {
    // Si la respuesta está vacía o no es string, retornar vacío
    if (!response || typeof response !== 'string') {
        logError('❌ Respuesta inválida:', response);
        return '';
    }

    try {
        logInfo('🔍 Limpiando respuesta original:', response);

        // Eliminar todo el contenido entre <think> y </think>, incluyendo las etiquetas
        let cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // Eliminar cualquier texto que comience con <think> hasta el final si no hay </think>
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*/g, '');
        
        // Eliminar comillas al inicio y final
        cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '');
        
        // Eliminar espacios en blanco extras y saltos de línea
        cleanedResponse = cleanedResponse.replace(/\s+/g, ' ').trim();

        // Si después de limpiar no queda nada, buscar si hay alguna respuesta después del último </think>
        if (!cleanedResponse && response.includes('</think>')) {
            const lastThinkIndex = response.lastIndexOf('</think>');
            if (lastThinkIndex !== -1) {
                cleanedResponse = response.substring(lastThinkIndex + 8).trim();
                cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '').trim();
            }
        }

        logInfo('🧹 Resultado de limpieza:', {
            original: response,
            limpia: cleanedResponse || '(respuesta vacía)'
        });

        // Si después de toda la limpieza no hay respuesta, retornar mensaje por defecto
        if (!cleanedResponse) {
            logError('⚠️ No se encontró respuesta después de limpiar');
            return 'Lo siento, no pude procesar tu consulta correctamente. ¿Podrías reformularla?';
        }

        return cleanedResponse;
    } catch (error) {
        logError('❌ Error limpiando respuesta:', error);
        return 'Lo siento, hubo un error procesando tu consulta. ¿Podrías intentarlo de nuevo?';
    }
}

module.exports = {
    respondToComment,
    cleanResponse
}; 