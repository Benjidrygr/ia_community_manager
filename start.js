const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servicios...');

// Iniciar el servidor Python
console.log('📝 Iniciando servidor Python...');
const pythonProcess = spawn('python3', ['main.py'], {
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

}, 2000); 