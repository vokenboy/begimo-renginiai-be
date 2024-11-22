const pool = require('../db');

exports.testController = async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({
      message: 'Test route is working successfully!',
      current_time: result.rows[0].current_time,
    });
  } catch (err) {
    console.error('Error in test route:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
