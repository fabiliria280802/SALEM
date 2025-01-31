# Backend

## Lea esto en otro idioma
- [Read this in English](Readme-backend-ing.md)

## Prerrequisitos
- Node js
- Anaconda (última versión)
- Python 3 y pip
- torch
- camelot-py

### ¿Cómo ejecutarlo localmente?

Debes `cd` al directorio de tu entorno, por ejemplo, `/home/fls2808/.conda/envs/pytorch-env` o `/users/your-user/.conda/envs/pytorch-env`.

-Si no tienes un carpeta /envs debes usar el siguiente comando:

```bash
    mkdir /envs
```

- Si necesitas crear un entorno nuevo, usa:

```bash
python -m venv pytorch-env # o python3 -m venv pytorch-env
```
Actívalo siguiendo el paso 1.

### PASOS
1. Activar un entorno virtual  
   Si ya tienes un entorno virtual creado (por ejemplo, pytorch-env), actívalo con el siguiente comando:
   - En Linux/macOS:

```bash
conda activate pytorch-env
```

   - En Windows (PowerShell):

```bash
.\pytorch-env\Scripts\activate
```

   Cuando el entorno está activado, verás el nombre del entorno entre paréntesis al inicio del prompt, como esto:

```bash
(pytorch-env) user@machine:~$
```

2. Desactivar un entorno virtual  
   Para desactivar un entorno activado y volver al entorno global del sistema, simplemente ejecuta:

```bash
deactivate
```

### ¿Cómo leer las dependencias desde requirements.txt?
```bash
pip install -r requirements.txt # o pip3 install -r requirements.txt
```

### Agregar nuevas dependencias a requirements.txt
En lugar de usar `pip freeze`, utiliza `pip list` para obtener solo los nombres y versiones de los paquetes instalados:

```bash
pip list --format=freeze > requirements.txt
```

### Agregar dependencias de node

1. Ir al directorio del backend

```bash
cd ../SALEM/backend
```

2. Instalar las dependencias con:

```bash
npm i
```

### ¿Cómo correr el backend con IA?

Debes estar en la carpeta del backend 

```bash
npm run dev
```

**Nota:** Este proyecto fue programado en computadoras con sistema operativo MacOS 15.2.0 y Linux/Fedora 41, para más info contactate con los colaboradores del projecto.