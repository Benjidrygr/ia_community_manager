const axios = require('axios');

async function respondToComment(commentId, message) {
    const token = process.env.GRAPH_API_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v22.0/${commentId}/comments`;
    
    try {
        const response = await axios.post(url, {
            message: message,
            access_token: token
        });
        
        console.log('✅ Respuesta enviada a Facebook exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error al enviar respuesta a Facebook:', error.response?.data || error.message);
        throw error;
    }
}

function cleanResponse(response) {
    // Eliminar el contenido entre <think> y </think>
    return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

module.exports = {
    respondToComment,
    cleanResponse
}; 