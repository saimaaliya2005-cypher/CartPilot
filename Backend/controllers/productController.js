const Product = require('../model/Product');
const cloudinary = require('../config/cloudinary');


// "S, M, L" (or an array) -> ["S","M","L"], trimmed, no blanks, no duplicates
const parseList = (v) => {
    if (Array.isArray(v)) v = v.join(',');
    return String(v || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s, i, a) => a.indexOf(s) === i)
        .slice(0, 20);
};

const getProducts = async (req, res) => {
    try{
        const products = await Product.find({});
        res.json(products);
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
}

const getProductById = async(req, res) => {
    try{
       const product = await Product.findById(req.params.id);
       if(product)  {
        res.json(product);
       }
       else {
        res.status(404).json({ message: 'Product not found'})
       }
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server error'})
    }
}

const createProduct = async(req, res) => {
    try {
        const { name, description, price, category, stock, sizes, colors } = req.body;
    let imageUrl = '';
    if(req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
    }
    const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        imageUrl,
        sizes: parseList(sizes),
        colors: parseList(colors)
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server error'})
    }
}

const updateProduct = async (req, res) => {
    try{
        const { name, description, price, category, stock, sizes, colors } = req.body;
        const product = await Product.findById(req.params.id);
        if(product) {
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.category = category || product.category;
            product.stock = stock || product.stock;
            if (sizes !== undefined) product.sizes = parseList(sizes);
            if (colors !== undefined) product.colors = parseList(colors);
            if(req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                product.imageUrl = result.secure_url;
            }
            const updatedProduct = await product.save();
            res.json(updatedProduct)
            console.log(req.body);
        }
        else {
            res.status(404).json({ message: 'Product not found'})
        }
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server err' })
    }
}

const deleteProduct = async (req, res) => {
    try{
        const product = await Product.findById(req.params.id);

        if(product) {
            await product.deleteOne();
            res.json({ message: 'Product removed'})
        }
        else {
         res.status(404).json({ message: 'Product not found'})   
        }
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server err'})
    }
}

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}