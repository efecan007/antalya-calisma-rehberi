const prisma = require('../../../shared/infrastructure/prisma/client');
const cache = require('../../../shared/infrastructure/cache/cache');
const Region = require('../domain/Region');
const PrismaPlaceRepository = require('./PrismaPlaceRepository');
const ListPlacesUseCase = require('../application/listPlaces.usecase');
const GetPlaceUseCase = require('../application/getPlace.usecase');
const CreatePlaceUseCase = require('../application/createPlace.usecase');
const UpdatePlaceUseCase = require('../application/updatePlace.usecase');
const DeletePlaceUseCase = require('../application/deletePlace.usecase');
const { createReviewUseCase } = require('../../reviews/infrastructure/reviewsContainer');
const { extractRatings } = require('../../reviews/infrastructure/extractRatings');

const placeRepository = new PrismaPlaceRepository(prisma);
const listPlacesUseCase = new ListPlacesUseCase({ placeRepository, cache });
const getPlaceUseCase = new GetPlaceUseCase({ placeRepository, cache });
const createPlaceUseCase = new CreatePlaceUseCase({ placeRepository, cache });
const updatePlaceUseCase = new UpdatePlaceUseCase({ placeRepository, cache });
const deletePlaceUseCase = new DeletePlaceUseCase({ placeRepository, cache });

async function listPlaces(req, res, next) {
  try {
    const places = await listPlacesUseCase.execute(req.query);
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function getPlace(req, res, next) {
  try {
    const place = await getPlaceUseCase.execute({ id: Number(req.params.id) });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function createPlace(req, res, next) {
  try {
    const place = await createPlaceUseCase.execute({ ...req.body, createdById: req.user.id });
    res.status(201).json(place);
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const place = await updatePlaceUseCase.execute({
      id: Number(req.params.id),
      requesterId: req.user.id,
      requesterRole: req.user.role,
      changes: req.body,
    });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function deletePlace(req, res, next) {
  try {
    await deletePlaceUseCase.execute({
      id: Number(req.params.id),
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function createReview(req, res, next) {
  try {
    const review = await createReviewUseCase.execute({
      placeId: Number(req.params.id),
      userId: req.user.id,
      ratings: extractRatings(req.body),
      comment: req.body.comment,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

function listRegions(_req, res) {
  res.json(Region.VALUES);
}

module.exports = {
  listPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  createReview,
  listRegions,
};
