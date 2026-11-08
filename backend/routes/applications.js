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

// GET /api/applications/:id  (one application with its history)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const application = await prisma.application.findFirst({
      where: { id, userId: req.userId },
      include: { history: { orderBy: { changedAt: 'desc' } } },
    });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
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

    const finalStatus = status || 'WISHLIST';

    const application = await prisma.application.create({
      data: {
        userId: req.userId,
        company,
        position,
        jobUrl,
        status: finalStatus,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        location,
        notes,
        history: { create: { newStatus: finalStatus } },
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

    const statusChanged = status && status !== existing.status;

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
        history: statusChanged
          ? { create: { oldStatus: existing.status, newStatus: status } }
          : undefined,
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