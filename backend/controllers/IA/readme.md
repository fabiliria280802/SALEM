# How to run it locally?
You must cd /IA folder.

1. Activar un entorno virtual
Si ya tienes un entorno virtual creado (por ejemplo, pytorch-env), puedes activarlo con el siguiente comando:
   - En Linux/macOS:
```bash
source pytorch-env/bin/activate
```

   - En Windows (PowerShell):
```bash
.\\pytorch-env\\Scripts\\activate
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
3. Si necesitas crear un entorno nuevo
Si aún no tienes un entorno virtual y necesitas crearl
  - Crea el entorno:
```bash
python -m venv pytorch-env
```
Actívalo siguiendo el paso 1.

## How to list dependencies?
En lugar de pip freeze, utiliza pip list para obtener solo los nombres y versiones de los paquetes instalados:
```bash
pip list --format=freeze > requirements.txt
```