const ErrorResponse = require('../utils/errorResponse');
const Bootcamp = require('../models/Bootcamp');

// @desc   Get all bootcamps
// @route  Get /api/v1/bootcamps
// @access Public
exports.getBootcamps = async (req, res, next) => {
	try {
		const bootcamps = await Bootcamp.find();
		res
			.status(200)
			.json({ success: true, count: bootcamps.length, data: bootcamps });
	} catch (err) {
		next(err);
	}
};

// @desc   Get single bootcamps
// @route  Get /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.findById(req.params.id);
		if (!bootcamp) {
			return new ErrorResponse(
				`Bootcamp not found with id of ${req.params.id}`,
				404
			);
		}
		return res.status(200).json({ success: true, data: bootcamp });
	} catch (err) {
		next(err);
	}
};

// @desc   Create new bootcamp
// @route  Post /api/v1/bootcamps
// @access Private
exports.createBootcamp = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.create(req.body);
		res.status(201).json({
			success: true,
			data: bootcamp,
		});
	} catch (err) {
		next(err);
	}
};

// @desc   Update bootcamp
// @route  Put /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!bootcamp) {
			return new ErrorResponse(
				`Bootcamp not found with id of ${req.params.id}`,
				404
			);
		}
		res.status(200).json({ success: true, data: bootcamp });
	} catch (err) {
		next(err);
	}
};

// @desc   Delete bootcamp
// @route  Delete /api/v1/bootcamps/:id
// @access Private
exports.deleteBootcamp = async (req, res, next) => {
	// const bootcamp = async Bootcamp.findByIdAndDelete()
	try {
		const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
		if (!bootcamp) {
			return new ErrorResponse(
				`Bootcamp not found with id of ${req.params.id}`,
				404
			);
		}
		res.status(200).json({ success: true, data: {} });
	} catch (err) {
		next(err);
	}
};