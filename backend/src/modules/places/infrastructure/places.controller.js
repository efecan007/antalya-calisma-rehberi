const prisma = require('../../../shared/infrastructure/prisma/client');
const cache = require('../../../shared/infrastructure/cache/cache');
const Region = require('../domain/Region');
const PrismaPlaceRepository = require('./PrismaPlaceRepository');
const ListPlacesUseCase = require('../application/listPlaces.usecase');
const GetPlaceUseCase = require('../application/getPlace.usecase');
const CreatePlaceUseCase = require('../application/createPlace.usecase');
const UpdatePlaceUseCase = require('../application/updatePlace.usecase');
const DeletePlaceUseCase = require('../application/deletePlace.usecase');
const ListPendingPlacesUseCase = require('../application/listPendingPlaces.usecase');
const ApprovePlaceUseCase = require('../application/approvePlace.usecase');
const RejectPlaceUseCase = require('../application/rejectPlace.usecase');
const { createReviewUseCase } = require('../../reviews/infrastructure/reviewsContainer');
const { extractRatings } = require('../../reviews/infrastructure/extractRatings');
const { addFavoriteUseCase, removeFavoriteUseCase } = require('../../favorites/infrastructure/favoritesContainer');

const placeRepository = new PrismaPlaceRepository(prisma);
const listPlacesUseCase = new ListPlacesUseCase({ placeRepository, cache });
const getPlaceUseCase = new GetPlaceUseCase({ placeRepository, cache });
const createPlaceUseCase = new CreatePlaceUseCase({ placeRepository, cache });
const updatePlaceUseCase = new UpdatePlaceUseCase({ placeRepository, cache });
const deletePlaceUseCase = new DeletePlaceUseCase({ placeRepository, cache });
const listPendingPlacesUseCase = new ListPendingPlacesUseCase({ placeRepository });
const approvePlaceUseCase = new ApprovePlaceUseCase({ placeRepository, cache });
const rejectPlaceUseCase = new RejectPlaceUseCase({ placeRepository, cache });

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
    const place = await getPlaceUseCase.execute({
      id: Number(req.params.id),
      requesterId: req.user?.id,
      requesterRole: req.user?.role,
    });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function createPlace(req, res, next) {
  try {
    const place = await createPlaceUseCase.execute({
      ...req.body,
      createdById: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(201).json(place);
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const place = await updatePlaceUseCase.execute({
      id: Number(req.params.id),
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

async function listPendingPlaces(_req, res, next) {
  try {
    const places = await listPendingPlacesUseCase.execute();
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function approvePlace(req, res, next) {
  try {
    const place = await approvePlaceUseCase.execute({ id: Number(req.params.id) });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function rejectPlace(req, res, next) {
  try {
    const place = await rejectPlaceUseCase.execute({ id: Number(req.params.id) });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function addFavorite(req, res, next) {
  try {
    await addFavoriteUseCase.execute({ userId: req.user.id, placeId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    await removeFavoriteUseCase.execute({ userId: req.user.id, placeId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  createReview,
  listRegions,
  listPendingPlaces,
  approvePlace,
  rejectPlace,
  addFavorite,
  removeFavorite,
};
