const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");
const { sendSuccess, sendError } = require("../utils/responseUtils");

const calculateCartPricing = (items, deliveryFee = 40, packagingFee = 20, discount = 0) => {
    const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = itemTotal + deliveryFee + packagingFee - discount;
    return { itemTotal, deliveryFee, packagingFee, discount, total };
};

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.menuItem")
            .populate("restaurant", "name image deliveryFee minimumOrder isOpen");

        if (!cart || cart.items.length === 0) {
            return sendSuccess(res, 200, "Cart is empty", { cart: null, items: [] });
        }

        return sendSuccess(res, 200, "Cart fetched", { cart });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { menuItemId, quantity = 1, customizations = [] } = req.body;

        if (!menuItemId) {
            return sendError(res, 400, "Menu item ID required");
        }

        const menuItem = await MenuItem.findById(menuItemId).populate("restaurant");

        if (!menuItem || !menuItem.isAvailable) {
            return sendError(res, 404, "Menu item not available");
        }

        let cart = await Cart.findOne({ user: req.user._id });

        // If cart has items from different restaurant, clear it
        if (cart && cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
            cart.items = [];
            cart.restaurant = menuItem.restaurant._id;
        }

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                restaurant: menuItem.restaurant._id,
                items: []
            });
        }

        // Calculate item price with customizations
        const extraPrice = customizations.reduce((sum, c) => sum + (c.extraPrice || 0), 0);
        const itemPrice = menuItem.price + extraPrice;

        // Check if item already in cart
        const existingIndex = cart.items.findIndex(
            item => item.menuItem.toString() === menuItemId
        );

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += quantity;
            cart.items[existingIndex].subtotal =
                cart.items[existingIndex].quantity * itemPrice;
        } else {
            cart.items.push({
                menuItem: menuItemId,
                name: menuItem.name,
                price: itemPrice,
                image: menuItem.image,
                quantity,
                customizations,
                subtotal: itemPrice * quantity
            });
        }

        cart.restaurant = menuItem.restaurant._id;
        cart.pricing = calculateCartPricing(
            cart.items,
            menuItem.restaurant.deliveryFee || 40
        );

        await cart.save();
        await cart.populate("items.menuItem");

        return sendSuccess(res, 200, "Item added to cart", { cart });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// PUT /api/cart/update
const updateCartItem = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;

        if (!menuItemId || quantity === undefined) {
            return sendError(res, 400, "Menu item ID and quantity required");
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return sendError(res, 404, "Cart not found");
        }

        const itemIndex = cart.items.findIndex(
            item => item.menuItem.toString() === menuItemId
        );

        if (itemIndex === -1) {
            return sendError(res, 404, "Item not found in cart");
        }

        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].subtotal =
                cart.items[itemIndex].price * quantity;
        }

        if (cart.items.length === 0) {
            cart.restaurant = null;
            cart.pricing = { itemTotal: 0, deliveryFee: 0, packagingFee: 0, discount: 0, total: 0 };
        } else {
            cart.pricing = calculateCartPricing(
                cart.items,
                cart.pricing.deliveryFee,
                cart.pricing.packagingFee,
                cart.pricing.discount
            );
        }
        await cart.save();

        return sendSuccess(res, 200, "Cart updated", { cart });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/cart/remove/:menuItemId
const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return sendError(res, 404, "Cart not found");
        }

        cart.items = cart.items.filter(
            item => item.menuItem.toString() !== req.params.menuItemId
        );

        if (cart.items.length === 0) {
            cart.restaurant = null;
            cart.pricing = { itemTotal: 0, deliveryFee: 0, packagingFee: 0, discount: 0, total: 0 };
        } else {
            cart.pricing = calculateCartPricing(
                cart.items,
                cart.pricing.deliveryFee,
                cart.pricing.packagingFee,
                cart.pricing.discount
            );
        }
        await cart.save();

        return sendSuccess(res, 200, "Item removed from cart", { cart });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items: [], restaurant: null, coupon: null, pricing: { itemTotal: 0, deliveryFee: 40, packagingFee: 20, discount: 0, total: 0 } }
        );

        return sendSuccess(res, 200, "Cart cleared");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};