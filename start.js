const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servicios...');

// Instalar dependencias de Python
console.log('📦 Instalando dependencias de Python...');
try {
    execSync('pip install -r requirements.txt', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error instalando dependencias de Python:', error);
    process.exit(1);
}

// Iniciar el servidor Python
console.log('📝 Iniciando servidor Python...');
const pythonProcess = spawn('python', ['main.py'], {
    cwd: path.join(__dirname, 'src')
});

pythonProcess.stdout.on('data', (data) => {
    console.log(`🐍 Python: ${data}`);
});

pythonProcess.stderr.on('data', (data) => {
    console.error(`❌ Python Error: ${data}`);
});

pythonProcess.on('error', (error) => {
    console.error('❌ Error al iniciar Python:', error);
    process.exit(1);
});

// Esperar un momento para asegurarse de que el servidor Python esté listo
setTimeout(() => {
    console.log('📦 Iniciando servidor Node...');
    // Iniciar el servidor Node
    const nodeProcess = spawn('node', ['server.js'], {
        stdio: 'inherit'
    });

    nodeProcess.on('error', (error) => {
        console.error('❌ Error al iniciar Node:', error);
        pythonProcess.kill();
        process.exit(1);
    });

    // Manejar el cierre de procesos
    process.on('SIGTERM', () => {
        console.log('📥 Cerrando servicios...');
        pythonProcess.kill();
        nodeProcess.kill();
    });

    process.on('SIGINT', () => {
        console.log('📥 Cerrando servicios...');
        pythonProcess.kill();
        nodeProcess.kill();
    });

}, 2000); // Espera 2 segundos antes de iniciar Node 