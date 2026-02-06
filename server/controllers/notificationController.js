const Notification = require('../models/Notification');

exports.createNotification = async (userId, message, type = 'INFO') => {
  try {
    const notification = new Notification({ userId, message, type });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Notification creation failed', err);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
