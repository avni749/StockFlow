const Product = require('../models/Product');

const mapProduct = (p) => ({
  id: p._id,
  name: p.name,
  SKU: p.SKU,
  description: p.description,
  sellingPrice: p.sellingPrice,
  category: p.category,
  image: p.image,
  lowStockThreshold: p.lowStockThreshold,
  status: p.status,
  tenantId: p.tenantId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt
});

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ tenantId: req.user.tenantId });
    res.json({ products: products.map(mapProduct) });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, SKU, sellingPrice, description, category, image, lowStockThreshold } = req.body;

    if (!name || !SKU || sellingPrice === undefined) {
      res.status(400);
      throw new Error('Please provide name, SKU, and sellingPrice');
    }

    const product = await Product.create({
      name,
      SKU,
      sellingPrice,
      description,
      category,
      image,
      lowStockThreshold,
      tenantId: req.user.tenantId,
    });

    res.status(201).json({ product: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, tenantId: req.user.tenantId });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ product: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { name, SKU, sellingPrice, description, category, image, lowStockThreshold } = req.body;
    
    const product = await Product.findOne({ _id: req.params.productId, tenantId: req.user.tenantId });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (product.status === 'INACTIVE') {
      res.status(400);
      throw new Error('Cannot edit a deactivated product');
    }

    if (name) product.name = name;
    if (SKU) product.SKU = SKU;
    if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;

    await product.save();
    res.json({ product: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

const deactivateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, tenantId: req.user.tenantId });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    product.status = 'INACTIVE';
    await product.save();
    
    res.json({ product: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProduct,
  updateProduct,
  deactivateProduct
};
