const prisma = require('../config/prisma');
const { computeAverages } = require('../utils/ratings');

const PLACE_TYPES = ['HOTEL', 'CAFE', 'LIBRARY'];
const REGIONS = ['MURATPASA', 'KONYAALTI', 'KEPEZ', 'LARA', 'KALEICI', 'DOSEMEALTI', 'AKSU'];

function serializePlace(place) {
  const { reviews, ...rest } = place;
  return { ...rest, ratings: computeAverages(reviews || []) };
}

async function listPlaces(req, res, next) {
  try {
    const { region, type, maxPrice, search, minRating } = req.query;

    const where = {};
    if (region) where.region = region;
    if (type) where.type = type;
    if (maxPrice) where.priceLevel = { lte: Number(maxPrice) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const places = await prisma.place.findMany({
      where,
      include: { reviews: true },
      orderBy: { createdAt: 'desc' },
    });

    let serialized = places.map(serializePlace);

    if (minRating) {
      const min = Number(minRating);
      serialized = serialized.filter(
        (p) => p.ratings.overallRating !== null && p.ratings.overallRating >= min
      );
    }

    res.json(serialized);
  } catch (err) {
    next(err);
  }
}

async function getPlace(req, res, next) {
  try {
    const id = Number(req.params.id);
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!place) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    res.json(serializePlace(place));
  } catch (err) {
    next(err);
  }
}

async function createPlace(req, res, next) {
  try {
    const { name, type, region, address, lat, lng, description, priceLevel, imageUrl } = req.body;

    if (!name || !type || !region || !address || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'name, type, region, address, lat, lng zorunludur' });
    }
    if (!PLACE_TYPES.includes(type)) {
      return res.status(400).json({ message: `type şunlardan biri olmalı: ${PLACE_TYPES.join(', ')}` });
    }
    if (!REGIONS.includes(region)) {
      return res.status(400).json({ message: `region şunlardan biri olmalı: ${REGIONS.join(', ')}` });
    }

    const place = await prisma.place.create({
      data: {
        name,
        type,
        region,
        address,
        lat: Number(lat),
        lng: Number(lng),
        description,
        priceLevel: priceLevel ? Number(priceLevel) : 2,
        imageUrl,
        createdById: req.user.id,
      },
      include: { reviews: true },
    });

    res.status(201).json(serializePlace(place));
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const id = Number(req.params.id);
    const place = await prisma.place.findUnique({ where: { id } });
    if (!place) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }
    if (place.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bu mekanı düzenleme yetkiniz yok' });
    }

    const { name, type, region, address, lat, lng, description, priceLevel, imageUrl } = req.body;
    const updated = await prisma.place.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(region !== undefined && { region }),
        ...(address !== undefined && { address }),
        ...(lat !== undefined && { lat: Number(lat) }),
        ...(lng !== undefined && { lng: Number(lng) }),
        ...(description !== undefined && { description }),
        ...(priceLevel !== undefined && { priceLevel: Number(priceLevel) }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: { reviews: true },
    });

    res.json(serializePlace(updated));
  } catch (err) {
    next(err);
  }
}

async function deletePlace(req, res, next) {
  try {
    const id = Number(req.params.id);
    const place = await prisma.place.findUnique({ where: { id } });
    if (!place) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }
    if (place.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bu mekanı silme yetkiniz yok' });
    }

    await prisma.place.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function listRegions(_req, res) {
  res.json(REGIONS);
}

module.exports = { listPlaces, getPlace, createPlace, updatePlace, deletePlace, listRegions };
