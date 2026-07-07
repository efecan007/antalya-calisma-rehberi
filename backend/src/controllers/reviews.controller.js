const prisma = require('../config/prisma');

const RATING_FIELDS = [
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'workEnvironment',
  'priceLevel',
  'overallRating',
];

function validateRatings(body) {
  for (const field of RATING_FIELDS) {
    const value = Number(body[field]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return `${field} 1 ile 5 arasında bir tam sayı olmalıdır`;
    }
  }
  return null;
}

async function createReview(req, res, next) {
  try {
    const placeId = Number(req.params.id);
    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    const validationError = validateRatings(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existing = await prisma.review.findUnique({
      where: { placeId_userId: { placeId, userId: req.user.id } },
    });
    if (existing) {
      return res.status(409).json({ message: 'Bu mekan için zaten bir yorumunuz var' });
    }

    const data = { placeId, userId: req.user.id, comment: req.body.comment };
    for (const field of RATING_FIELDS) {
      data[field] = Number(req.body[field]);
    }

    const review = await prisma.review.create({
      data,
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Bu yorumu düzenleme yetkiniz yok' });
    }

    const data = {};
    for (const field of RATING_FIELDS) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          return res.status(400).json({ message: `${field} 1 ile 5 arasında bir tam sayı olmalıdır` });
        }
        data[field] = value;
      }
    }
    if (req.body.comment !== undefined) data.comment = req.body.comment;

    const updated = await prisma.review.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true } } },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }

    await prisma.review.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, updateReview, deleteReview };
