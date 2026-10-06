const Tenant = require('../models/Tenant');

const getBusinesses = async (req, res, next) => {
  try {
    const tenants = await Tenant.find({});
    res.json({
      businesses: tenants.map(t => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const suspendBusiness = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId);
    if (!tenant) {
      res.status(404);
      throw new Error('Business not found');
    }
    
    tenant.status = 'SUSPENDED';
    await tenant.save();

    res.json({
      business: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const reactivateBusiness = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId);
    if (!tenant) {
      res.status(404);
      throw new Error('Business not found');
    }
    
    tenant.status = 'ACTIVE';
    await tenant.save();

    res.json({
      business: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinesses,
  suspendBusiness,
  reactivateBusiness
};
