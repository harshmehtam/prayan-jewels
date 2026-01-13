import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Product model for silver mangalsutra catalog
  Product: a
    .model({
      name: a.string().required(),
      description: a.string().required(), // Single comprehensive description with all details
      price: a.float().required(), // Selling price (what customer pays)
      actualPrice: a.float(), // Original/MRP price (for showing discount)
      images: a.string().array().required(), // Local image paths
      isActive: a.boolean().default(true),
      viewCount: a.integer().default(0), // Track product views
      // inventory: a.hasOne('InventoryItem', 'productId'), // COMMENTED OUT - Not needed for now
      cartItems: a.hasMany('CartItem', 'productId'),
      orderItems: a.hasMany('OrderItem', 'productId'),
      wishlistItems: a.hasMany('Wishlist', 'productId'),
      reviews: a.hasMany('ProductReview', 'productId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // COMMENTED OUT - Inventory tracking for products - Not needed for now
  /*
  InventoryItem: a
    .model({
      productId: a.id().required(),
      stockQuantity: a.integer().required(),
      reservedQuantity: a.integer().default(0),
      reorderPoint: a.integer().default(5),
      supplierName: a.string(),
      supplierContact: a.string(),
      leadTime: a.integer(), // in days
      lastRestocked: a.datetime(),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),
  */

  // Address management
  Address: a
    .model({
      userId: a.id().required(),
      type: a.enum(['shipping', 'billing']),
      firstName: a.string().required(), // Max 20 characters
      lastName: a.string().required(), // Max 20 characters
      email: a.string(), // Max 100 characters - nullable to handle existing data
      phone: a.string(), // Exactly 10 digits - nullable to handl   e existing data
      addressLine1: a.string().required(), // Max 100 characters
      addressLine2: a.string(), // Max 100 characters
      city: a.string().required(), // Max 20 characters
      state: a.string().required(),
      postalCode: a.string().required(), // Exactly 6 digits
      country: a.string().required(),
      isDefault: a.boolean().default(false),
    })
    .authorization((allow) => [
      // Users can only access their own addresses using owner field
      allow.ownerDefinedIn('userId'),
      allow.group('admin').to(['read']),
      allow.group('super_admin').to(['read', 'delete']),
    ]),

  // Shopping cart for customers
  ShoppingCart: a
    .model({
      customerId: a.id(),
      sessionId: a.string(),
      subtotal: a.float().default(0),
      estimatedTax: a.float().default(0),
      estimatedShipping: a.float().default(0),
      estimatedTotal: a.float().default(0),
      expiresAt: a.datetime(),
      items: a.hasMany('CartItem', 'cartId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update', 'delete']),
    ]),

  // Cart items
  CartItem: a
    .model({
      cartId: a.id().required(),
      productId: a.id().required(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      totalPrice: a.float().required(),
      cart: a.belongsTo('ShoppingCart', 'cartId'),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update', 'delete']),
    ]),

  // Coupon management
  Coupon: a
    .model({
      code: a.string().required(), // Unique coupon code
      name: a.string().required(), // Display name for the coupon
      description: a.string(), // Description of the coupon
      type: a.enum(['percentage', 'fixed_amount']), // Discount type
      value: a.float().required(), // Discount value (percentage or fixed amount)
      minimumOrderAmount: a.float().default(0), // Minimum order amount to apply coupon
      maximumDiscountAmount: a.float(), // Maximum discount amount for percentage coupons
      usageLimit: a.integer(), // Total usage limit (null for unlimited)
      usageCount: a.integer().default(0), // Current usage count
      userUsageLimit: a.integer(), // Per-user usage limit (null for unlimited)
      isActive: a.boolean().default(true),
      showOnHeader: a.boolean().default(false), // Show as promotional banner in header
      validFrom: a.datetime().required(),
      validUntil: a.datetime().required(),
      applicableProducts: a.string().array(), // Product IDs this coupon applies to (empty for all products)
      excludedProducts: a.string().array(), // Product IDs this coupon excludes
      allowedUsers: a.string().array(), // User IDs who can use this coupon (empty for all users)
      excludedUsers: a.string().array(), // User IDs who cannot use this coupon
      createdBy: a.id(), // Admin who created the coupon
      orders: a.hasMany('Order', 'couponId'),
      userCoupons: a.hasMany('UserCoupon', 'couponId'),
    })
    .authorization((allow) => [
      allow.guest().to(['read']), // Allow guest users to read coupons
      allow.authenticated().to(['read']),
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // User coupon usage tracking
  UserCoupon: a
    .model({
      userId: a.id().required(),
      couponId: a.id().required(),
      usageCount: a.integer().default(0),
      lastUsedAt: a.datetime(),
      coupon: a.belongsTo('Coupon', 'couponId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.group('admin').to(['read']),
      allow.group('super_admin').to(['read', 'delete']),
    ]),

  // Order management
  Order: a
    .model({
      customerId: a.id().required(),
      customerEmail: a.string().required(), // Max 100 characters
      customerPhone: a.string().required(), // Exactly 10 digits
      subtotal: a.float().required(),
      tax: a.float().default(0),
      shipping: a.float().default(0),
      couponId: a.id(), // Applied coupon
      couponCode: a.string(), // Coupon code for reference
      couponDiscount: a.float().default(0), // Discount amount applied
      totalAmount: a.float().required(),
      status: a.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
      paymentMethod: a.enum(['razorpay', 'cash_on_delivery']),
      paymentStatus: a.enum(['pending', 'paid', 'failed', 'refunded']),
      confirmationNumber: a.string(), // Unique order confirmation number
      paymentOrderId: a.string(), // Razorpay order ID
      paymentId: a.string(), // Razorpay payment ID
      trackingNumber: a.string(),
      estimatedDelivery: a.date(),
      shippingFirstName: a.string().required(), // Max 20 characters
      shippingLastName: a.string().required(), // Max 20 characters
      shippingAddressLine1: a.string().required(), // Max 100 characters
      shippingAddressLine2: a.string(), // Max 100 characters
      shippingCity: a.string().required(), // Max 20 characters
      shippingState: a.string().required(),
      shippingPostalCode: a.string().required(), // Exactly 6 digits
      shippingCountry: a.string().required(),
      billingFirstName: a.string().required(), // Max 20 characters
      billingLastName: a.string().required(), // Max 20 characters
      billingAddressLine1: a.string().required(), // Max 100 characters
      billingAddressLine2: a.string(), // Max 100 characters
      billingCity: a.string().required(), // Max 20 characters
      billingState: a.string().required(),
      billingPostalCode: a.string().required(), // Exactly 6 digits
      billingCountry: a.string().required(),
      coupon: a.belongsTo('Coupon', 'couponId'),
      items: a.hasMany('OrderItem', 'orderId'),
      reviews: a.hasMany('ProductReview', 'orderId'),
    })
    .authorization((allow) => [
      // Authenticated users can manage their own orders
      allow.ownerDefinedIn('customerId'),
      // Guest users can create, read, and update orders (needed for payment processing)
      allow.guest().to(['create', 'read', 'update']),
      // Admin can create, read, and update orders
      allow.group('admin').to(['create', 'read', 'update']),
      // Only super_admin can delete orders
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Wishlist for customer product saving
  Wishlist: a
    .model({
      customerId: a.id().required(),
      productId: a.id().required(),
      product: a.belongsTo('Product', 'productId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'delete']),
    ]),

  // Product Reviews and Ratings
  ProductReview: a
    .model({
      productId: a.id().required(),
      customerId: a.id().required(),
      orderId: a.id().required(), // Link to order for purchase verification
      orderItemId: a.id().required(), // Specific order item for this product
      rating: a.integer().required(), // 1-5 stars
      title: a.string().required(), // Review title/headline
      comment: a.string().required(), // Review text
      isApproved: a.boolean().default(false), // Admin moderation
      isVerifiedPurchase: a.boolean().default(true), // Always true since linked to order
      helpfulCount: a.integer().default(0), // Number of helpful votes
      reportCount: a.integer().default(0), // Number of reports
      adminNotes: a.string(), // Internal admin notes
      approvedBy: a.id(), // Admin who approved
      approvedAt: a.datetime(), // When approved
      product: a.belongsTo('Product', 'productId'),
      order: a.belongsTo('Order', 'orderId'),
      orderItem: a.belongsTo('OrderItem', 'orderItemId'),
      helpfulVotes: a.hasMany('ReviewHelpfulVote', 'reviewId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').to(['create', 'read', 'update']),
      allow.authenticated().to(['read']), // All authenticated users can read approved reviews
      allow.guest().to(['read']), // Guests can read approved reviews
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // Review helpful voting system
  ReviewHelpfulVote: a
    .model({
      reviewId: a.id().required(),
      customerId: a.id().required(),
      isHelpful: a.boolean().required(), // true for helpful, false for not helpful
      review: a.belongsTo('ProductReview', 'reviewId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').to(['create', 'read', 'update', 'delete']),
      allow.group('admin').to(['read']),
      allow.group('super_admin').to(['read', 'delete']),
    ]),
  // Order items
  OrderItem: a
    .model({
      orderId: a.id().required(),
      productId: a.id().required(),
      productName: a.string().required(),
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      totalPrice: a.float().required(),
      order: a.belongsTo('Order', 'orderId'),
      product: a.belongsTo('Product', 'productId'),
      review: a.hasOne('ProductReview', 'orderItemId'),
    })
    .authorization((allow) => [
      // Inherit authorization from parent Order model
      allow.authenticated().to(['create', 'read']),
      allow.guest().to(['create', 'read', 'update']), // Guest users can create, read, and update order items
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // COMMENTED OUT - Audit log for tracking admin actions and security events - Not needed for now
  /*
  AuditLog: a
    .model({
      adminId: a.id().required(), // ID of the admin who performed the action
      adminEmail: a.string(), // Email of the admin for easier identification
      targetUserId: a.id(), // ID of the user being acted upon (optional)
      targetUserEmail: a.string(), // Email of the target user (optional)
      action: a.enum(['user_created', 'user_updated', 'user_deleted', 'role_changed', 'password_reset', 'product_created', 'product_updated', 'product_deleted', 'order_updated', 'inventory_updated', 'login_attempt', 'login_success', 'login_failure', 'permission_denied', 'data_export', 'bulk_operation', 'system_config_changed', 'security_alert']),
      resource: a.enum(['user', 'product', 'order', 'inventory', 'system', 'auth']), // What type of resource was affected
      resourceId: a.string(), // ID of the specific resource (product ID, order ID, etc.)
      description: a.string().required(), // Human-readable description of the action
      ipAddress: a.string(), // IP address of the admin
      userAgent: a.string(), // Browser/client information
      sessionId: a.string(), // Session identifier for tracking
      severity: a.enum(['low', 'medium', 'high', 'critical']), // Severity level for security monitoring
      metadata: a.json(), // Additional structured data about the action
      success: a.boolean().default(true), // Whether the action was successful
      errorMessage: a.string(), // Error message if action failed
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),
  */

  // COMMENTED OUT - Security events for monitoring suspicious activities - Not needed for now
  /*
  SecurityEvent: a
    .model({
      eventType: a.enum(['failed_login_attempts', 'suspicious_activity', 'privilege_escalation', 'data_breach_attempt', 'unauthorized_access', 'account_lockout', 'password_policy_violation', 'session_hijacking', 'brute_force_attack']),
      userId: a.id(), // User involved in the security event
      adminId: a.id(), // Admin involved (if applicable)
      severity: a.enum(['low', 'medium', 'high', 'critical']),
      description: a.string().required(),
      ipAddress: a.string(),
      userAgent: a.string(),
      location: a.string(), // Geographic location if available
      resolved: a.boolean().default(false),
      resolvedBy: a.id(), // Admin who resolved the issue
      resolvedAt: a.datetime(),
      resolutionNotes: a.string(),
      metadata: a.json(), // Additional event-specific data
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),
  */

  // COMMENTED OUT - Admin session tracking for accountability - Not needed for now
  /*
  AdminSession: a
    .model({
      adminId: a.id().required(),
      adminEmail: a.string(),
      sessionId: a.string().required(),
      ipAddress: a.string(),
      userAgent: a.string(),
      location: a.string(),
      loginTime: a.datetime().required(),
      logoutTime: a.datetime(),
      lastActivity: a.datetime(),
      isActive: a.boolean().default(true),
      actionsPerformed: a.integer().default(0), // Count of actions in this session
      metadata: a.json(),
    })
    .authorization((allow) => [
      allow.group('admin').to(['create', 'read', 'update']),
      allow.group('super_admin').to(['create', 'read', 'update', 'delete']),
    ]),
  */
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // IAM authorization allows unauthenticated (guest) access
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
