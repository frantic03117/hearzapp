const Cart = require("../models/Cart");
const Product = require("../models/Product");
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
            session_id
        } = req.query;

        const fdata = {};
        let variantFilter = {};

        // 1️⃣ Filter by ID or slug
        if (id) fdata["_id"] = id;
        if (slug) fdata["slug"] = slug;

        // 2️⃣ Parse variant filters from query
        if (vfilters) {
            try {
                const parsedFilters = JSON.parse(vfilters);
                Object.keys(parsedFilters).forEach((key) => {
                    if (typeof parsedFilters[key] === "string" && parsedFilters[key].includes(",")) {
                        parsedFilters[key] = {
                            $in: parsedFilters[key].split(",").map((v) => v.trim()),
                        };
                    }
                });
                variantFilter = { ...parsedFilters };
            } catch (e) {
                return res.status(400).json({
                    success: 0,
                    message: "Invalid vfilters format, must be valid JSON",
                });
            }
        }

        // 3️⃣ Price filter from query params
        if (price_min || price_max) {
            variantFilter.price = {};
            if (price_min) variantFilter.price.$gte = Number(price_min);
            if (price_max) variantFilter.price.$lte = Number(price_max);
        }

        // 4️⃣ Apply filters from UserTest (session_id)
        if (session_id) {
            // ✅ Find saved filters in UserTest
            const userFilterDoc = await UserTest.findOne({ session_id }).lean();

            if (userFilterDoc && userFilterDoc.filters.length > 0) {
                // ✅ Get allowed variant keys
                const allowedkeys = await VariantKey.find({ form: "Variant" })
                    .select("key")
                    .lean();
                const allowedKeyNames = allowedkeys.map((k) => k.key);

                const mappedFilters = {};

                for (const f of userFilterDoc.filters) {
                    if (
                        allowedKeyNames.includes(f.key_name) &&
                        f.key_value !== undefined &&
                        f.key_value !== null
                    ) {
                        // ✅ Handle special key: price_range (e.g., "15000-30000")
                        if (f.key_name === "price_range" && typeof f.key_value === "string") {
                            const [min, max] = f.key_value.split("-").map((n) => Number(n.trim()));
                            if (!isNaN(min) && !isNaN(max)) {
                                variantFilter.price = { $gte: min, $lte: max };
                            }
                            continue;
                        }

                        // ✅ If array → use $in
                        if (Array.isArray(f.key_value)) {
                            mappedFilters[f.key_name] = { $in: f.key_value };
                        } else if (
                            typeof f.key_value === "string" &&
                            f.key_value.includes(",")
                        ) {
                            // Also handle comma-separated string as $in
                            mappedFilters[f.key_name] = {
                                $in: f.key_value.split(",").map((v) => v.trim()),
                            };
                        } else {
                            mappedFilters[f.key_name] = f.key_value;
                        }
                    }
                }

                // ✅ Merge mapped filters from UserTest
                variantFilter = { ...variantFilter, ...mappedFilters };
            }
        }

        // 5️⃣ Apply variant-level filters ($elemMatch)
        if (Object.keys(variantFilter).length > 0) {
            fdata["variants"] = { $elemMatch: variantFilter };
        }

        // 6️⃣ Pagination setup
        const totalDocs = await Product.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const skip = (page - 1) * perPage;

        // 7️⃣ Fetch products
        const products = await Product.find(fdata)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(perPage))
            .lean();

        // 8️⃣ Wishlist integration
        let productsWithWishlist;
        if (req.user) {
            const wishlisted = await Cart.find({
                user: req.user._id,
                cart_status: "Wishlist",
            });
            const wishpids = wishlisted.map((itm) => itm.product.toString());

            productsWithWishlist = products.map((product) => ({
                ...product,
                is_wishlist: wishpids.includes(product._id.toString()),
            }));
        } else {
            productsWithWishlist = products;
        }

        // 9️⃣ Pagination response
        const pagination = {
            page: Number(page),
            perPage: Number(perPage),
            totalPages,
            totalDocs,
        };

        // 🔟 Final response
        return res.status(200).json({
            success: 1,
            message: "List of products",
            data: productsWithWishlist,
            pagination,
        });
    } catch (err) {
        console.error("Error in getProducts:", err);
        res.status(500).json({ success: 0, error: err.message });
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