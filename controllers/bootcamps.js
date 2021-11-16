const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asynchandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc   Get all bootcamps
// @route  Get /api/v1/bootcamps
// @access Public
exports.getBootcamps = asynchandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults);
});

// @desc   Get single bootcamps
// @route  Get /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = asynchandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
		);
	}
	return res.status(200).json({ success: true, data: bootcamp });
});

// @desc   Create new bootcamp
// @route  Post /api/v1/bootcamps
// @access Private
exports.createBootcamp = asynchandler(async (req, res, next) => {
	// Add user to req.body
	req.body.user = req.user.id;

	// Check for published bootcamp
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

	//if the user is not an admin, they can only add one bootcamp

	if (publishedBootcamp && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`The user with ID ${req.user.id} has already published a bootcamp`,
				400
			)
		);
	}

	const bootcamp = await Bootcamp.create(req.body);

	res.status(201).json({
		success: true,
		data: bootcamp,
	});
});

// @desc   Update bootcamp
// @route  Put /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = asynchandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
		);
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.params.id} is not authorized to update this bootcamp`,
				401
			)
		);
	}
	bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});
	res.status(200).json({ success: true, data: bootcamp });
});

// @desc   Delete bootcamp
// @route  Delete /api/v1/bootcamps/:id
// @access Private
exports.deleteBootcamp = asynchandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
		);
	}
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.params.id} is not authorized to delete this bootcamp`,
				401
			)
		);
	}
	bootcamp.remove();
	res.status(200).json({ success: true, data: {} });
});

// @desc   Get bootcamps within a radius
// @route  Get /api/v1/bootcamps/radius/:zipcode/:distance
// @access Private
exports.getBootcampsInRadius = asynchandler(async (req, res, next) => {
	const { zipcode, distance } = req.params;

	//Get lat/long from geocoder
	const loc = await geocoder.geocode(zipcode);
	const lat = loc[0].latitude;
	const lng = loc[0].longitude;

	// Calculate radius using radians
	// divide distance by radius of earth
	// Earth radius  = 3,963 mi
	const radius = distance / 3963;

	const bootcamps = await Bootcamp.find({
		location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
	});

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	});
});

// @desc   Upload photo for bootcamp
// @route  Put /api/v1/bootcamps/:id/photo
// @access Private
exports.bootcampPhotoUpload = asynchandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
		);
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.params.id} is not authorized to update this bootcamp`,
				401
			)
		);
	}

	if (!req.files) {
		return new ErrorResponse(`Please upload a file`, 400);
	}

	const file = req.files.file;

	//Make sure the image is a photo
	if (!file.mimetype.startsWith('image')) {
		return new ErrorResponse(`Please upload an image file`, 404);
	}
	// Check filesize
	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
				404
			)
		);
	}
	// Create custom filename
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			// console.log(err);
			return next(new ErrorResponse(`Problem with file upload`, 500));
		}

		await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

		res.status(200).json({
			success: true,
			data: file.name,
		});
	});
});
