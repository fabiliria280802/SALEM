const axios = require('axios');

exports.getSharePointFiles = async (siteUrl, listName, accessToken) => {
	try {
		const response = await axios.get(
			`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/json;odata=verbose',
				},
			},
		);

		const files = response.data.d.results;
		return files.map(file => ({
			fileName: file.File.Name,
			fileUrl: file.File.ServerRelativeUrl,
		}));
	} catch (error) {
		throw new Error(
			'Error al obtener archivos de SharePoint: ' + error.message,
		);
	}
};

exports.downloadFileFromSharePoint = async (fileUrl, fileName) => {
	try {
		// Simulación de la descarga del archivo
		const filePath = path.join(__dirname, fileName);

		// Aquí puedes hacer una solicitud real de descarga si es necesario
		const response = await axios.get(fileUrl, { responseType: 'stream' });

		// Guardar el archivo en el sistema de archivos local
		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on('finish', () => resolve(filePath));
			writer.on('error', reject);
		});
	} catch (error) {
		throw new Error(
			'Error al descargar archivo desde SharePoint: ' + error.message,
		);
	}
};
