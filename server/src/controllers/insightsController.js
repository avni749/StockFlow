const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryState = require('../models/InventoryState');

const buildDateMatch = (startDate, endDate) => {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    let sDate, eDate;

    if (startDate) {
      sDate = new Date(startDate);
      if (isNaN(sDate.getTime())) throw new Error("Invalid startDate format. Use YYYY-MM-DD");
      match.createdAt.$gte = sDate;
    }
    
    if (endDate) {
      eDate = new Date(endDate);
      if (isNaN(eDate.getTime())) throw new Error("Invalid endDate format. Use YYYY-MM-DD");
      eDate.setUTCHours(23, 59, 59, 999);
      match.createdAt.$lte = eDate;
    }

    if (sDate && eDate && sDate > eDate) {
      throw new Error("startDate cannot be after endDate");
    }
  }
  return match;
};

// GET /api/v1/business/insights/top-selling
const getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    let dateMatch = {};
    try {
      dateMatch = buildDateMatch(startDate, endDate);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const parsedLimit = parseInt(limit, 10);
    const resultLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;

    const pipeline = [
      { 
        $match: { 
          tenantId: req.user.tenantId, 
          status: 'PAID',
          ...dateMatch
        } 
      },
      { $unwind: "$items" },
      { 
        $group: {
          _id: "$items.productId",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.sellingPrice"] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: resultLimit },
      { 
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: { $arrayElemAt: ["$productDetails.name", 0] },
          quantitySold: 1,
          revenue: 1
        }
      }
    ];

    const results = await Order.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/v1/business/insights/sales
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateMatch = {};
    try {
      dateMatch = buildDateMatch(startDate, endDate);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const pipeline = [
      { 
        $match: { 
          tenantId: req.user.tenantId,
          ...dateMatch
        } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          statusRevenue: { 
            $sum: { 
              $cond: [ { $eq: ["$status", "PAID"] }, "$totalAmount", 0 ] 
            } 
          }
        }
      }
    ];

    const results = await Order.aggregate(pipeline);

    const analytics = {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      expiredOrders: 0,
      grossRevenue: 0
    };

    results.forEach(statusGroup => {
      analytics.totalOrders += statusGroup.count;
      if (statusGroup._id === 'PAID') {
        analytics.paidOrders = statusGroup.count;
        analytics.grossRevenue = statusGroup.statusRevenue;
      } else if (statusGroup._id === 'PENDING_PAYMENT') {
        analytics.pendingOrders = statusGroup.count;
      } else if (statusGroup._id === 'CANCELLED') {
        analytics.cancelledOrders = statusGroup.count;
      } else if (statusGroup._id === 'EXPIRED') {
        analytics.expiredOrders = statusGroup.count;
      }
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/v1/business/insights/stock-overview
const getStockOverview = async (req, res) => {
  try {
    const pipeline = [
      { $match: { tenantId: req.user.tenantId } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $lookup: {
          from: "tenants",
          localField: "tenantId",
          foreignField: "_id",
          as: "tenant"
        }
      },
      {
        $project: {
          available: 1,
          reserved: 1,
          sold: 1,
          productThreshold: { $arrayElemAt: ["$product.lowStockThreshold", 0] },
          tenantThreshold: { $arrayElemAt: ["$tenant.businessWideDefaultLowStockThreshold", 0] }
        }
      },
      {
        $project: {
          available: 1,
          reserved: 1,
          sold: 1,
          effectiveThreshold: { $ifNull: ["$productThreshold", "$tenantThreshold"] }
        }
      },
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: "$available" },
          totalReserved: { $sum: "$reserved" },
          totalSold: { $sum: "$sold" },
          productCount: { $sum: 1 },
          lowStockProductCount: { 
            $sum: { 
              $cond: [ { $lt: ["$available", "$effectiveThreshold"] }, 1, 0 ] 
            } 
          }
        }
      }
    ];

    const results = await InventoryState.aggregate(pipeline);

    if (results.length === 0) {
      return res.json({
        totalAvailable: 0,
        totalReserved: 0,
        totalSold: 0,
        totalStock: 0,
        productCount: 0,
        lowStockProductCount: 0
      });
    }

    const overview = results[0];
    res.json({
      totalAvailable: overview.totalAvailable,
      totalReserved: overview.totalReserved,
      totalSold: overview.totalSold,
      totalStock: overview.totalAvailable + overview.totalReserved + overview.totalSold,
      productCount: overview.productCount,
      lowStockProductCount: overview.lowStockProductCount
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getTopSellingProducts,
  getSalesAnalytics,
  getStockOverview
};
