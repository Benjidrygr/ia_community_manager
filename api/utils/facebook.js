const axios = require('axios');
const { logInfo, logError } = require('./logger');

async function respondToComment(commentId, message) {
    const token = process.env.GRAPH_API_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v22.0/${commentId}/comments`;
    
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
        return '';
    }

    try {
        // Eliminar todo el contenido entre <think> y </think>, incluyendo las etiquetas
        let cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // Eliminar comillas al inicio y final si existen
        cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '');
        
        // Limpiar espacios en blanco extras
        cleanedResponse = cleanedResponse.trim();

        logInfo('🧹 Respuesta limpia:', {
            original: response,
            limpia: cleanedResponse
        });

        return cleanedResponse;
    } catch (error) {
        logError('❌ Error limpiando respuesta:', error);
        return response; // En caso de error, retornar la respuesta original
    }
}

module.exports = {
    respondToComment,
    cleanResponse
}; 