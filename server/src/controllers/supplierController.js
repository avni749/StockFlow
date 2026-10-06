const Supplier = require('../models/Supplier');

const mapSupplier = (s) => ({
  id: s._id,
  name: s.name,
  contactName: s.contactName,
  email: s.email,
  phone: s.phone,
  address: s.address,
  status: s.status,
  tenantId: s.tenantId,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ tenantId: req.user.tenantId });
    res.json({ suppliers: suppliers.map(mapSupplier) });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, contactName, email, phone, address } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please provide supplier name');
    }

    const supplier = await Supplier.create({
      name,
      contactName,
      email,
      phone,
      address,
      tenantId: req.user.tenantId,
    });

    res.status(201).json({ supplier: mapSupplier(supplier) });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.supplierId, tenantId: req.user.tenantId });
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    res.json({ supplier: mapSupplier(supplier) });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { name, contactName, email, phone, address } = req.body;
    
    const supplier = await Supplier.findOne({ _id: req.params.supplierId, tenantId: req.user.tenantId });
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }

    if (supplier.status === 'INACTIVE') {
      res.status(400);
      throw new Error('Cannot edit a deactivated supplier');
    }

    if (name) supplier.name = name;
    if (contactName !== undefined) supplier.contactName = contactName;
    if (email !== undefined) supplier.email = email;
    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;

    await supplier.save();
    res.json({ supplier: mapSupplier(supplier) });
  } catch (error) {
    next(error);
  }
};

const deactivateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.supplierId, tenantId: req.user.tenantId });
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    
    supplier.status = 'INACTIVE';
    await supplier.save();
    
    res.json({ supplier: mapSupplier(supplier) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  getSupplier,
  updateSupplier,
  deactivateSupplier
};
