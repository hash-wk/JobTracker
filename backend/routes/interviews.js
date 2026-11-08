const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const withApplication = {
  application: { select: { id: true, company: true, position: true } },
};

function parseDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/interviews
router.get('/', async (req, res) => {
  try {
    const interviews = await prisma.interview.findMany({
      where: { application: { userId: req.userId } },
      include: withApplication,
      orderBy: { dateTime: 'asc' },
    });
    res.json(interviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/interviews
router.post('/', async (req, res) => {
  try {
    const { applicationId, type, dateTime, location, notes } = req.body;
    const appId = Number(applicationId);
    const date = parseDate(dateTime);

    if (!appId || !type || !date) {
      return res
        .status(400)
        .json({ message: 'Application, type and date are required' });
    }

    const application = await prisma.application.findFirst({
      where: { id: appId, userId: req.userId },
    });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const interview = await prisma.interview.create({
      data: { applicationId: appId, type, dateTime: date, location, notes },
      include: withApplication,
    });

    // Move the application to "Interview" if it was earlier in the pipeline
    if (['WISHLIST', 'APPLIED'].includes(application.status)) {
      await prisma.application.update({
        where: { id: appId },
        data: {
          status: 'INTERVIEW',
          history: {
            create: { oldStatus: application.status, newStatus: 'INTERVIEW' },
          },
        },
      });
    }

    res.status(201).json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/interviews/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.interview.findFirst({
      where: { id, application: { userId: req.userId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const { type, dateTime, location, notes } = req.body;
    let date;
    if (dateTime) {
      date = parseDate(dateTime);
      if (!date) return res.status(400).json({ message: 'Invalid date' });
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: { type, dateTime: date, location, notes },
      include: withApplication,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/interviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.interview.findFirst({
      where: { id, application: { userId: req.userId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await prisma.interview.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;