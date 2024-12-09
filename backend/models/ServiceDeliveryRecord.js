const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'El nombre es requerido'],
		match: [/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'El nombre solo debe contener letras y espacios']
	},
	position: {
		type: String,
		required: [true, 'El cargo es requerido'],
		match: [/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'El cargo solo debe contener letras y espacios']
	},
	type: {
		type: String,
		required: [true, 'El tipo de firma es requerido'],
		enum: ['Provider', 'Receiver']
	}
});

const serviceDeliveryRecordSchema = new mongoose.Schema({
	hes_number: {
		type: String,
		required: [true, 'El número de HES es requerido'],
		unique: true,
		match: [/^record-\d{3}$/, 'El formato del número de HES debe ser record-XXX']
	},
	receiving_company: {
		type: String,
		required: [true, 'La empresa receptora es requerida'],
		trim: true
	},
	service: {
		type: String,
		required: [true, 'El servicio es requerido'],
		trim: true
	},
	location: {
		type: String,
		required: [true, 'La ubicación del servicio es requerida'],
		trim: true
	},
	signatures: {
		type: [signatureSchema],
		validate: {
			validator: function(signatures) {
				return signatures.length === 2;
			},
			message: 'Se requieren exactamente dos firmas (Proveedor y Receptor)'
		}
	},
	contract: {
		type: String,
		required: [true, 'El número de contrato es requerido'],
		match: [/^contract-\d{4}$/, 'El formato del número de contrato debe ser contract-XXXX']
	},
	start_date: {
		type: Date,
		required: [true, 'La fecha de inicio es requerida']
	},
	end_date: {
		type: Date,
		required: [true, 'La fecha de término es requerida'],
		validate: {
			validator: function(end_date) {
				return end_date >= this.start_date;
			},
			message: 'La fecha de término debe ser posterior o igual a la fecha de inicio'
		}
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'El creador del registro es requerido']
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Accepted', 'Denied', 'Pending', 'Revalidation'],
		required: true,
	}
});

module.exports = mongoose.model('ServiceDeliveryRecord', serviceDeliveryRecordSchema);
