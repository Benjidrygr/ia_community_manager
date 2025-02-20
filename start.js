const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando servicios...');

// Crear y activar entorno virtual
console.log('🌍 Configurando entorno virtual Python...');
try {
    // Crear el entorno virtual si no existe
    if (!fs.existsSync('venv')) {
        console.log('📦 Creando nuevo entorno virtual...');
        execSync('python3 -m venv venv', { stdio: 'inherit' });
    }

    // Instalar dependencias usando el pip del entorno virtual
    console.log('📦 Instalando dependencias de Python...');
    if (process.platform === 'win32') {
        execSync('venv\\Scripts\\pip install -r requirements.txt', { stdio: 'inherit' });
    } else {
        execSync('./venv/bin/pip install -r requirements.txt', { stdio: 'inherit' });
    }
} catch (error) {
    console.error('❌ Error configurando Python:', error);
    process.exit(1);
}

// Iniciar el servidor Python usando el python del entorno virtual
console.log('📝 Iniciando servidor Python...');
const pythonProcess = spawn(
    process.platform === 'win32' ? 'venv\\Scripts\\python' : './venv/bin/python',
    ['main.py'],
    {
        cwd: path.join(__dirname, 'src')
    }
);

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