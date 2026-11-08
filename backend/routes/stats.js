const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
const WEEKS = 8;

// Monday of the week that contains the given date (UTC)
function startOfWeek(date) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

function percent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      select: { status: true, appliedDate: true, createdAt: true },
    });

    const byStatus = {};
    STATUSES.forEach((s) => (byStatus[s] = 0));
    applications.forEach((a) => (byStatus[a.status] += 1));

    const total = applications.length;
    const applied = total - byStatus.WISHLIST; // everything you actually sent
    const responded =
      byStatus.INTERVIEW + byStatus.OFFER + byStatus.REJECTED;

    // Applications sent per week, for the last 8 weeks
    const thisWeek = startOfWeek(new Date());
    const weekly = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const start = new Date(thisWeek);
      start.setUTCDate(start.getUTCDate() - i * 7);
      weekly.push({ start, count: 0 });
    }
    applications.forEach((a) => {
      if (a.status === 'WISHLIST') return;
      const week = startOfWeek(new Date(a.appliedDate || a.createdAt));
      const slot = weekly.find((w) => w.start.getTime() === week.getTime());
      if (slot) slot.count += 1;
    });

    res.json({
      total,
      applied,
      byStatus,
      responseRate: percent(responded, applied),
      interviewRate: percent(byStatus.INTERVIEW + byStatus.OFFER, applied),
      offerRate: percent(byStatus.OFFER, applied),
      weekly: weekly.map((w) => ({
        week: w.start.toISOString().slice(0, 10),
        count: w.count,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;