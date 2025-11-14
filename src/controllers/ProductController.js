const { default: mongoose } = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const UserTest = require("../models/UserTest");
const VariantKey = require("../models/VariantKey");
async function generateUniqueSlug(name) {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let count = 1;
    const alreadusers = await Product.find({ slug });
    // Check if the slug already exists
    count = alreadusers.length + 1;
    if (count > 1) {
        slug = `${slug}-${count}`;
    }
    return slug;
}
// Manual validation function
const validateProduct = (data) => {
    const errors = [];

    if (!data.title) errors.push({ field: "title", message: "Title is required." });
    if (!data.variants || !Array.isArray(data.variants)) {
        errors.push({ field: "variants", message: "At least one variant is required." });
    } else {
        data.variants.forEach((v, i) => {
            if (!v.sku) errors.push({ field: `variants[${i}].sku`, message: "SKU is required." });
            if (!v.price || isNaN(v.price)) {
                errors.push({ field: `variants[${i}].price`, message: "Price must be a valid number." });
            }
        });
    }

    return errors;
};

// Create Product
exports.createProduct = async (req, res) => {
    try {
        // Parse FormData fields manually if sent as stringified JSON
        let productData = req.body;
        if (typeof productData.variants === "string") {
            productData.variants = JSON.parse(productData.variants);
        }
        if (typeof productData.category === "string") {
            productData.category = JSON.parse(productData.category);
        }
        const errors = validateProduct(productData);
        if (errors.length > 0) return res.json({ success: 0, message: "Invalid request", data: null, errors });
        const filesByVariantIndex = {};
        if (req.files) {
            for (const file of req.files) {
                const match = file.fieldname.match(/^variantImages(\d+)$/);
                if (match) {
                    const index = match[1];
                    if (!filesByVariantIndex[index]) filesByVariantIndex[index] = [];
                    filesByVariantIndex[index].push(file.path);
                }
            }
        }
        productData.variants = productData.variants.map((variant, idx) => {
            const images = filesByVariantIndex[idx] || [];
            return { ...variant, images };
        });
        const slug = await generateUniqueSlug(req.body.title);
        const requestdata = { slug: slug, ...productData };
        //return res.json({ success: 1, message: "Product request", data: requestdata });
        const product = new Product(requestdata);
        await product.save();
        res.status(201).json({ data: product, success: 1, message: "Product created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        try {
            const fixed = str.replace(/'/g, '"');
            return JSON.parse(fixed);
        } catch (e2) {
            return null;
        }
    }
}

// Get All Products
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 10,
            id,
            slug,
            vfilters,
            price_min,
            price_max,
            session_id,
            keyword
        } = req.query;

        const fdata = {}; // main query


        // ----- DIRECT PRODUCT FILTERS -----
        if (id) fdata["_id"] = id;
        if (slug) fdata["slug"] = slug;

        // 🔍 Keyword Search
        if (keyword && keyword.trim() !== "") {
            fdata["$or"] = [
                { title: { $regex: keyword, $options: "i" } },
                { slug: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ];
        }

        // ----- ALLOWED VARIANT KEYS -----
        const allowedKeys = await VariantKey.find({ form: "Variant" })
            .select("key")
            .lean();
        const allowedKeySet = new Set(allowedKeys.map(k => k.key));

        // ----- VARIANT FILTERS -----
        let variantFilter = {};

        // ----- HANDLE vfilters from query -----
        if (vfilters) {
            const parsedFilters = safeJsonParse(vfilters);

            if (!parsedFilters) {
                return res.status(400).json({
                    success: 0,
                    message: "Invalid vfilters format, must be valid JSON",
                });
            }

            console.log("Parsed vfilters:", parsedFilters);

            Object.keys(parsedFilters).forEach((key) => {
                if (!allowedKeySet.has(key)) return;

                const value = parsedFilters[key];

                // PRICE RANGE
                if (key === "price_range" && typeof value === "string") {
                    const [minStr, maxStr] = value.split("-");
                    const min = parseInt(minStr.trim());
                    const max = parseInt(maxStr.trim());

                    if (!isNaN(min) && !isNaN(max)) {
                        variantFilter.price = { $gte: min, $lte: max };
                    }
                    return;
                }

                // ARRAY
                if (Array.isArray(value)) {
                    variantFilter[key] = { $in: value };
                    return;
                }

                // CSV → array
                if (typeof value === "string" && value.includes(",")) {
                    variantFilter[key] = {
                        $in: value.split(",").map(v => v.trim())
                    };
                    return;
                }

                variantFilter[key] = value;
            });
            if (parsedFilters.price_range) {

                let ranges = parsedFilters.price_range;

                // Case 1: comma-separated string → convert to array
                if (typeof ranges === "string" && ranges.includes(",")) {
                    ranges = ranges.split(",").map(r => r.trim());
                }

                // Case 2: single string → convert to array of one item
                if (typeof ranges === "string") {
                    ranges = [ranges];
                }

                // Now ranges is ALWAYS an array
                let orConditions = [];

                ranges.forEach(range => {
                    if (!range.includes("-")) return; // skip invalid

                    const [minStr, maxStr] = range.split("-");
                    const min = parseInt(minStr.trim());
                    const max = parseInt(maxStr.trim());

                    if (!isNaN(min) && !isNaN(max)) {
                        orConditions.push({ price: { $gte: min, $lte: max } });
                    }
                });

                // Apply OR condition only if at least one valid range
                if (orConditions.length > 0) {
                    variantFilter.$or = orConditions;
                }
            }

        }


        // ----- ADDITIONAL PRICE FILTER -----
        if (price_min || price_max) {
            variantFilter.price = {};
            if (price_min) variantFilter.price.$gte = Number(price_min);
            if (price_max) variantFilter.price.$lte = Number(price_max);
        }


        // ----- SESSION FILTERS -----
        if (session_id) {
            const session = await UserTest.findOne({ _id: session_id }).lean();

            if (session && Array.isArray(session.filters)) {
                session.filters.forEach((f) => {
                    if (!f.key_name || !f.key_value) return;
                    if (!allowedKeySet.has(f.key_name)) return;

                    let value = f.key_value;

                    // 🔹 Case 1: value is comma-separated string → convert to array
                    if (typeof value === "string" && value.includes(",")) {
                        value = value.split(",").map(v => v.trim());
                    }

                    // 🔹 Case 2: array → use $in
                    if (Array.isArray(value)) {
                        variantFilter[f.key_name] = { $in: value };
                        return;
                    }

                    // 🔹 Case 3: normal string → direct match
                    variantFilter[f.key_name] = value;
                });
            }

        }


        // ----- APPLY VARIANT FILTER -----
        if (Object.keys(variantFilter).length > 0) {
            fdata["variants"] = { $elemMatch: variantFilter };
        }


        // ----- PAGINATION -----
        const totalDocs = await Product.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const skip = (page - 1) * perPage;


        // ----- FETCH PRODUCTS -----
        const products = await Product.find(fdata)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage)
            .lean();


        // ----- ADD WISHLIST FLAG -----
        let productsWithWishlist = products;

        if (req.user) {
            const wishlisted = await Cart.find({
                user: req.user._id,
                cart_status: "Wishlist",
            });

            const wishIds = wishlisted.map((w) => w.product.toString());

            productsWithWishlist = products.map((prod) => ({
                ...prod,
                is_wishlist: wishIds.includes(prod._id.toString())
            }));
        }


        // ----- RESPONSE -----
        return res.status(200).json({
            success: 1,
            message: "List of products",
            data: productsWithWishlist,
            pagination: {
                page: Number(page),
                perPage: Number(perPage),
                totalDocs,
                totalPages,
            },
            variantFilter,
            fdata
        });

    } catch (err) {
        console.error("getProducts error:", err);
        return res.status(500).json({
            success: 0,
            error: err.message
        });
    }
};


// Get Product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ data: product, success: 1, message: "List of prodct" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        let updateData = req.body;

        if (typeof updateData.variants === "string") {
            updateData.variants = JSON.parse(updateData.variants);
        }

        if (typeof updateData.category === "string") {
            updateData.category = JSON.parse(updateData.category);
        }

        const errors = validateProduct(updateData);
        if (errors.length > 0) return res.status(400).json({ errors });

        // Fetch the existing product
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) return res.status(404).json({ message: "Product not found" });

        const filesByVariantIndex = {};
        if (req.files) {
            for (const file of req.files) {
                const match = file.fieldname.match(/^variantImages(\d+)$/);
                if (match) {
                    const index = match[1];
                    if (!filesByVariantIndex[index]) filesByVariantIndex[index] = [];
                    filesByVariantIndex[index].push(file.path);
                }
            }
        }
        updateData.variants = updateData.variants.map((variant, idx) => {
            const newImages = filesByVariantIndex[idx];
            const existingVariant = existingProduct.variants[idx];
            return {
                ...variant,
                images: newImages && newImages.length > 0
                    ? newImages
                    : existingVariant?.images || []
            };
        });

        const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ success: 1, data: updated, message: "updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.activeHandle = async (req, res) => {
    try {
        const { product_id, variant_id, isActive } = req.body;

        if (!product_id) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        if (variant_id) {
            // ✅ Toggle a specific variant
            const product = await Product.findOneAndUpdate(
                { _id: product_id, "variants._id": variant_id },
                { $set: { "variants.$.isActive": isActive } },
                { new: true }
            );

            if (!product) {
                return res.status(404).json({ message: "Variant not found" });
            }

            return res.json({
                message: `Variant ${isActive ? "activated" : "deactivated"} successfully`,
                product
            });

        } else {
            // ✅ Toggle whole product
            const product = await Product.findByIdAndUpdate(
                product_id,
                { $set: { isActive } },
                { new: true }
            );

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            return res.json({
                message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
                product
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};