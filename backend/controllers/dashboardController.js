import User from "../models/User.js";
import Letter from "../models/Letter.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userEmail = req.query.userEmail;

    // Overall stats
    const userCount = await User.countDocuments();
    const letterCount = await Letter.countDocuments();
    const userDepartments = await User.distinct("departmentOrSector");
    const letterDepartments = await Letter.distinct("department");
    const letterStatusCounts = await Letter.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const letterDeptCounts = await Letter.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const lettersByDate = await Letter.aggregate([
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      } },
      { $sort: { _id: 1 } },
    ]);

    // User-specific stats
    let userStats = null;
    if (userEmail) {
      // Sent letters
      const sentCount = await Letter.countDocuments({ fromEmail: userEmail });
      // Received letters (including CC)
      const receivedCount = await Letter.countDocuments({
        $or: [
          { toEmail: userEmail },
          { cc: { $elemMatch: { $eq: userEmail } } },
        ],
      });
      // Total (sent + received, may double-count if user sent to self)
      const totalUserLetters = sentCount + receivedCount;
      // User's letters by status
      const userLetterStatusCounts = await Letter.aggregate([
        {
          $match: {
            $or: [
              { fromEmail: userEmail },
              { toEmail: userEmail },
              { cc: { $elemMatch: { $eq: userEmail } } },
            ],
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      // User's letters by date
      const userLettersByDate = await Letter.aggregate([
        {
          $match: {
            $or: [
              { fromEmail: userEmail },
              { toEmail: userEmail },
              { cc: { $elemMatch: { $eq: userEmail } } },
            ],
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      userStats = {
        sentCount,
        receivedCount,
        totalUserLetters,
        userLetterStatusCounts,
        userLettersByDate,
      };
    }

    res.json({
      userCount,
      letterCount,
      departmentCount: new Set([...userDepartments, ...letterDepartments]).size,
      letterStatusCounts,
      letterDeptCounts,
      lettersByDate,
      userStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 