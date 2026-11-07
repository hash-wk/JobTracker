const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

// GET /api/applications?status=&search=&sort=
router.get('/', async (req, res) => {
  try {
    const { status, search, sort } = req.query;

    const where = { userId: req.userId };
    if (status && STATUSES.includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { company: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
    });
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/applications
router.post('/', async (req, res) => {
  try {
    const { company, position, jobUrl, status, appliedDate, location, notes } =
      req.body;

    if (!company || !position) {
      return res
        .status(400)
        .json({ message: 'Company and position are required' });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await prisma.application.create({
      data: {
        userId: req.userId,
        company,
        position,
        jobUrl,
        status,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        location,
        notes,
      },
    });
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/applications/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { company, position, jobUrl, status, appliedDate, location, notes } =
      req.body;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        company,
        position,
        jobUrl,
        status,
        appliedDate: appliedDate ? new Date(appliedDate) : undefined,
        location,
        notes,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await prisma.application.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;