// trainController.js
const { spawn } = require('child_process');

exports.trainModel = async (req, res) => {
  try {
    const pythonProcess = spawn('python3', [
      'controllers/IA/ia.py',
      '--action', 'train'
    ]);

    let pythonOutput = '';
    let pythonError = '';

    // Captura el stdout de Python
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
      console.log('[IA Train STDOUT]:', data.toString());
    });

    // Captura el stderr de Python
    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
      console.error('[IA Train STDERR]:', data.toString());
    });

    // Cuando termina el proceso, enviamos la respuesta
    pythonProcess.on('close', (code) => {
      if (pythonError) {
        return res.status(500).json({
          error: 'Error entrenando el modelo',
          details: pythonError,
        });
      }
      // Aquí podrías parsear la salida si tu script imprime JSON, 
      // o simplemente retornar una respuesta de éxito.
      return res.status(200).json({
        message: 'Entrenamiento completado satisfactoriamente',
        output: pythonOutput,
      });
    });
  } catch (error) {
    console.error('Error en /trainModel:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
};
