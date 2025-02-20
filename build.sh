#!/usr/bin/env bash
# exit on error
set -o errexit

# Instalar python3-venv si no está instalado
apt-get update
apt-get install -y python3-venv

# El resto del script de construcción si es necesario 