const Category = require("../models/Category");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// GET /api/categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 });

        return sendSuccess(res, 200, "Categories fetched", {
            categories,
            total: categories.length
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || !category.isActive) {
            return sendError(res, 404, "Category not found");
        }

        return sendSuccess(res, 200, "Category fetched", { category });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/categories (admin only)
const createCategory = async (req, res) => {
    try {
        const { name, description, image, icon, sortOrder } = req.body;

        if (!name) {
            return sendError(res, 400, "Category name is required");
        }

        const existing = await Category.findOne({
            name: new RegExp(`^${name}$`, "i")
        });

        if (existing) {
            return sendError(res, 400, "Category already exists");
        }

        const category = await Category.create({
            name,
            description,
            image,
            icon,
            sortOrder: sortOrder || 0
        });

        return sendSuccess(res, 201, "Category created", { category });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// PUT /api/categories/:id (admin only)
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return sendError(res, 404, "Category not found");
        }

        return sendSuccess(res, 200, "Category updated", { category });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/categories/:id (admin only)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return sendError(res, 404, "Category not found");
        }

        return sendSuccess(res, 200, "Category deleted");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};